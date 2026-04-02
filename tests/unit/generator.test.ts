import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import os from 'os';
import fse from 'fs-extra';
import { generateFiles } from '../../src/generator/file-generator.js';
import { resolveBlocks, composeOutput } from '../../src/composer/template-composer.js';
import type { DevkitConfig } from '../../src/types/index.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTempDir(): string {
  return fse.mkdtempSync(path.join(os.tmpdir(), '007devkit-test-'));
}

const baseConfig: DevkitConfig = {
  projectName: 'test-project',
  frontend: 'angular',
  backend: 'nestjs',
  mobile: null,
  database: 'postgresql',
  monorepo: null,
  aiTool: 'both',
  language: 'en',
};

// ─── generateFiles ────────────────────────────────────────────────────────────

describe('generateFiles', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = makeTempDir();
  });

  afterEach(async () => {
    await fse.remove(tempDir);
  });

  it('generates devkit.config.json', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    const result = await generateFiles(baseConfig, tempDir, composed);

    expect(result.created).toContain('devkit.config.json');
    const configPath = path.join(tempDir, 'devkit.config.json');
    expect(await fse.pathExists(configPath)).toBe(true);

    const config = await fse.readJson(configPath);
    expect(config.projectName).toBe('test-project');
    expect(config.blocks).toContain('angular');
    expect(config.blocks).toContain('nestjs');
    expect(config.blocks).toContain('postgresql');
    expect(config.aiTool).toBe('both');
    expect(config.language).toBe('en');
    expect(config.customized).toEqual([]);
  });

  it('generates CLAUDE.md when aiTool includes claude-code', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    await generateFiles(baseConfig, tempDir, composed);

    const claudePath = path.join(tempDir, 'CLAUDE.md');
    expect(await fse.pathExists(claudePath)).toBe(true);

    const content = await fse.readFile(claudePath, 'utf-8');
    expect(content).toContain('test-project');
    expect(content).toContain('@backend');
    expect(content).toContain('@frontend');
  });

  it('generates .cursorrules when aiTool includes cursor', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    await generateFiles(baseConfig, tempDir, composed);

    const cursorPath = path.join(tempDir, '.cursorrules');
    expect(await fse.pathExists(cursorPath)).toBe(true);

    const content = await fse.readFile(cursorPath, 'utf-8');
    expect(content).toContain('test-project');
  });

  it('does NOT generate CLAUDE.md when aiTool is cursor-only', async () => {
    const config: DevkitConfig = { ...baseConfig, aiTool: 'cursor' };
    const blocks = resolveBlocks(config);
    const composed = composeOutput(blocks);
    await generateFiles(config, tempDir, composed);

    expect(await fse.pathExists(path.join(tempDir, 'CLAUDE.md'))).toBe(false);
    expect(await fse.pathExists(path.join(tempDir, '.cursorrules'))).toBe(true);
  });

  it('does NOT generate .cursorrules when aiTool is claude-code-only', async () => {
    const config: DevkitConfig = { ...baseConfig, aiTool: 'claude-code' };
    const blocks = resolveBlocks(config);
    const composed = composeOutput(blocks);
    await generateFiles(config, tempDir, composed);

    expect(await fse.pathExists(path.join(tempDir, '.cursorrules'))).toBe(false);
    expect(await fse.pathExists(path.join(tempDir, 'CLAUDE.md'))).toBe(true);
  });

  it('creates agent role files', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    await generateFiles(baseConfig, tempDir, composed);

    expect(await fse.pathExists(path.join(tempDir, 'agents/roles/project-manager.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/roles/security-agent.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/roles/frontend-agent.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/roles/backend-agent.md'))).toBe(true);
  });

  it('creates workflow files', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    await generateFiles(baseConfig, tempDir, composed);

    expect(await fse.pathExists(path.join(tempDir, 'agents/workflows/debug-issue.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/workflows/write-tests.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/workflows/review-code.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/workflows/new-backend-module.md'))).toBe(true);
  });

  it('creates context and prompt files from core', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    await generateFiles(baseConfig, tempDir, composed);

    expect(await fse.pathExists(path.join(tempDir, 'agents/prompts/feature-request.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/prompts/bug-report.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/contexts/handoff-template.md'))).toBe(true);
    expect(await fse.pathExists(path.join(tempDir, 'agents/contexts/session-state.md'))).toBe(true);
  });

  it('session-state.md contains project name from EJS', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    await generateFiles(baseConfig, tempDir, composed);

    const content = await fse.readFile(
      path.join(tempDir, 'agents/contexts/session-state.md'),
      'utf-8',
    );
    expect(content).toContain('test-project');
  });

  it('skips existing files on second run', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);

    // First run
    const result1 = await generateFiles(baseConfig, tempDir, composed);
    const created1 = result1.created.length;

    // Second run — all files exist
    const result2 = await generateFiles(baseConfig, tempDir, composed);
    expect(result2.created.length).toBe(0);
    expect(result2.skipped.length).toBeGreaterThan(0);
    expect(result2.errors.length).toBe(0);
  });

  it('returns empty errors array on successful generation', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    const result = await generateFiles(baseConfig, tempDir, composed);

    expect(result.errors).toEqual([]);
  });

  it('generates docs/aim-methodology.md', async () => {
    const blocks = resolveBlocks(baseConfig);
    const composed = composeOutput(blocks);
    await generateFiles(baseConfig, tempDir, composed);

    expect(await fse.pathExists(path.join(tempDir, 'docs/aim-methodology.md'))).toBe(true);
  });
});
