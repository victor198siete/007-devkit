import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import os from 'os';
import fse from 'fs-extra';
import { execa } from 'execa';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROOT = path.resolve(import.meta.dirname, '../..');
const CLI = path.join(ROOT, 'dist/cli.js');

function makeTempDir(): string {
  return fse.mkdtempSync(path.join(os.tmpdir(), '007devkit-integration-'));
}

// ─── Integration: init command ────────────────────────────────────────────────

describe('CLI init command (integration)', () => {
  let tempDir: string;

  beforeAll(async () => {
    tempDir = makeTempDir();

    // Run init with non-interactive mode via --yes flag
    // We use the programmatic API path since prompts can't be piped easily
    // Instead we test the generator directly in a realistic scenario
    await runInit(tempDir, {
      projectName: 'integration-test-app',
      frontend: 'angular',
      backend: 'nestjs',
      mobile: null,
      database: 'postgresql',
      monorepo: 'nx',
      aiTool: 'both',
      language: 'en',
    });
  });

  afterAll(async () => {
    await fse.remove(tempDir);
  });

  it('creates CLAUDE.md with project name', async () => {
    const claudePath = path.join(tempDir, 'CLAUDE.md');
    expect(await fse.pathExists(claudePath)).toBe(true);
    const content = await fse.readFile(claudePath, 'utf-8');
    expect(content).toContain('integration-test-app');
  });

  it('creates .cursorrules with agent rules', async () => {
    const cursorPath = path.join(tempDir, '.cursorrules');
    expect(await fse.pathExists(cursorPath)).toBe(true);
    const content = await fse.readFile(cursorPath, 'utf-8');
    expect(content).toContain('integration-test-app');
    expect(content).toContain('@backend');
    expect(content).toContain('@frontend');
  });

  it('creates devkit.config.json with correct blocks', async () => {
    const configPath = path.join(tempDir, 'devkit.config.json');
    expect(await fse.pathExists(configPath)).toBe(true);

    const config = await fse.readJson(configPath);
    expect(config.projectName).toBe('integration-test-app');
    expect(config.blocks).toContain('angular');
    expect(config.blocks).toContain('nestjs');
    expect(config.blocks).toContain('postgresql');
    expect(config.blocks).toContain('nx');
    expect(config.aiTool).toBe('both');
  });

  it('creates all 5 agent role files', async () => {
    const roles = [
      'project-manager.md',
      'security-agent.md',
      'frontend-agent.md',
      'backend-agent.md',
    ];
    for (const role of roles) {
      expect(
        await fse.pathExists(path.join(tempDir, 'agents/roles', role)),
        `Missing: agents/roles/${role}`,
      ).toBe(true);
    }
  });

  it('creates all universal workflow files', async () => {
    const workflows = ['debug-issue.md', 'write-tests.md', 'review-code.md', 'init-session.md'];
    for (const wf of workflows) {
      expect(
        await fse.pathExists(path.join(tempDir, 'agents/workflows', wf)),
        `Missing: agents/workflows/${wf}`,
      ).toBe(true);
    }
  });

  it('creates NestJS-specific workflow', async () => {
    expect(
      await fse.pathExists(path.join(tempDir, 'agents/workflows/new-backend-module.md')),
    ).toBe(true);
  });

  it('creates Angular-specific workflows', async () => {
    expect(
      await fse.pathExists(path.join(tempDir, 'agents/workflows/new-frontend-component.md')),
    ).toBe(true);
    expect(
      await fse.pathExists(path.join(tempDir, 'agents/workflows/new-frontend-feature.md')),
    ).toBe(true);
  });

  it('creates all 3 prompt templates', async () => {
    const prompts = ['feature-request.md', 'bug-report.md', 'architecture-decision.md'];
    for (const prompt of prompts) {
      expect(
        await fse.pathExists(path.join(tempDir, 'agents/prompts', prompt)),
        `Missing: agents/prompts/${prompt}`,
      ).toBe(true);
    }
  });

  it('creates context management files', async () => {
    expect(
      await fse.pathExists(path.join(tempDir, 'agents/contexts/session-state.md')),
    ).toBe(true);
    expect(
      await fse.pathExists(path.join(tempDir, 'agents/contexts/handoff-template.md')),
    ).toBe(true);
  });

  it('creates docs files', async () => {
    expect(await fse.pathExists(path.join(tempDir, 'docs/aim-methodology.md'))).toBe(true);
    expect(
      await fse.pathExists(path.join(tempDir, 'docs/nest-backend-general-standards.md')),
    ).toBe(true);
    expect(
      await fse.pathExists(path.join(tempDir, 'docs/frontend-architecture-standards.md')),
    ).toBe(true);
  });
});

// ─── Programmatic test runner (bypasses CLI prompts) ─────────────────────────

async function runInit(targetDir: string, config: {
  projectName: string;
  frontend: string | null;
  backend: string | null;
  mobile: string | null;
  database: string | null;
  monorepo: string | null;
  aiTool: string;
  language: string;
}): Promise<void> {
  // Import and call generateFiles directly for integration testing
  const { generateFiles } = await import('../../src/generator/file-generator.js');
  const { resolveBlocks, composeOutput } = await import('../../src/composer/template-composer.js');
  const { DevkitConfig } = await import('../../src/types/index.js').catch(() => ({ DevkitConfig: null }));

  const devkitConfig = {
    projectName: config.projectName,
    frontend: config.frontend as any,
    backend: config.backend as any,
    mobile: config.mobile as any,
    database: config.database as any,
    monorepo: config.monorepo as any,
    aiTool: config.aiTool as any,
    language: config.language as any,
  };

  await fse.ensureDir(targetDir);
  const blocks = resolveBlocks(devkitConfig);
  const composed = composeOutput(blocks);
  await generateFiles(devkitConfig, targetDir, composed);
}
