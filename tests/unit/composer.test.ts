import { describe, it, expect } from 'vitest';
import {
  buildTemplateVars,
  resolveBlocks,
  composeOutput,
} from '../../src/composer/template-composer.js';
import type { DevkitConfig } from '../../src/types/index.js';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const angularNestConfig: DevkitConfig = {
  projectName: 'my-app',
  frontend: 'angular',
  backend: 'nestjs',
  mobile: null,
  database: 'postgresql',
  monorepo: 'nx',
  aiTool: 'both',
  language: 'en',
};

const reactExpressConfig: DevkitConfig = {
  projectName: 'react-api',
  frontend: 'react',
  backend: 'express',
  mobile: null,
  database: 'mongodb',
  monorepo: null,
  aiTool: 'claude-code',
  language: 'en',
};

const nextjsOnlyConfig: DevkitConfig = {
  projectName: 'next-app',
  frontend: 'nextjs',
  backend: 'nextjs-api',
  mobile: null,
  database: 'postgresql',
  monorepo: null,
  aiTool: 'cursor',
  language: 'es',
};

const fullStackConfig: DevkitConfig = {
  projectName: 'kindi-app',
  frontend: 'angular',
  backend: 'nestjs',
  mobile: 'ionic',
  database: 'postgresql',
  monorepo: 'nx',
  aiTool: 'both',
  language: 'es',
};

const backendOnlyConfig: DevkitConfig = {
  projectName: 'api-only',
  frontend: null,
  backend: 'nestjs',
  mobile: null,
  database: 'postgresql',
  monorepo: null,
  aiTool: 'claude-code',
  language: 'en',
};

// ─── buildTemplateVars ────────────────────────────────────────────────────────

describe('buildTemplateVars', () => {
  it('sets boolean helpers correctly for Angular + NestJS config', () => {
    const vars = buildTemplateVars(angularNestConfig);

    expect(vars.projectName).toBe('my-app');
    expect(vars.isAngular).toBe(true);
    expect(vars.isNestjs).toBe(true);
    expect(vars.isNx).toBe(true);
    expect(vars.isPostgres).toBe(true);
    expect(vars.hasFrontend).toBe(true);
    expect(vars.hasBackend).toBe(true);
    expect(vars.hasMobile).toBe(false);
    expect(vars.isClaudeCode).toBe(true);
    expect(vars.isCursor).toBe(true);
    expect(vars.isBothAiTools).toBe(true);
  });

  it('sets boolean helpers correctly for React + Express config', () => {
    const vars = buildTemplateVars(reactExpressConfig);

    expect(vars.isReact).toBe(true);
    expect(vars.isAngular).toBe(false);
    expect(vars.isExpress).toBe(true);
    expect(vars.isNestjs).toBe(false);
    expect(vars.isMongo).toBe(true);
    expect(vars.hasMonorepo).toBe(false);
    expect(vars.isClaudeCode).toBe(true);
    expect(vars.isCursor).toBe(false);
  });

  it('sets isNextjs true for both nextjs frontend and nextjs-api backend', () => {
    const vars = buildTemplateVars(nextjsOnlyConfig);
    expect(vars.isNextjs).toBe(true);
  });

  it('handles backend-only config', () => {
    const vars = buildTemplateVars(backendOnlyConfig);
    expect(vars.hasFrontend).toBe(false);
    expect(vars.hasBackend).toBe(true);
    expect(vars.hasMobile).toBe(false);
    expect(vars.isNestjs).toBe(true);
    expect(vars.frontend).toBe('none');
  });

  it('includes year and date fields', () => {
    const vars = buildTemplateVars(angularNestConfig);
    expect(vars.year).toBe(new Date().getFullYear());
    expect(vars.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ─── resolveBlocks ────────────────────────────────────────────────────────────

describe('resolveBlocks', () => {
  it('always includes shared block', () => {
    const blocks = resolveBlocks(backendOnlyConfig);
    expect(blocks.some((b) => b.id === '_shared')).toBe(true);
  });

  it('includes frontend/angular block for Angular config', () => {
    const blocks = resolveBlocks(angularNestConfig);
    expect(blocks.some((b) => b.id === 'frontend/angular')).toBe(true);
  });

  it('includes backend/nestjs block for NestJS config', () => {
    const blocks = resolveBlocks(angularNestConfig);
    expect(blocks.some((b) => b.id === 'backend/nestjs')).toBe(true);
  });

  it('includes mobile/ionic block when mobile is ionic', () => {
    const blocks = resolveBlocks(fullStackConfig);
    expect(blocks.some((b) => b.id === 'mobile/ionic')).toBe(true);
  });

  it('includes database/postgresql block', () => {
    const blocks = resolveBlocks(angularNestConfig);
    expect(blocks.some((b) => b.id === 'database/postgresql')).toBe(true);
  });

  it('includes monorepo/nx block', () => {
    const blocks = resolveBlocks(angularNestConfig);
    expect(blocks.some((b) => b.id === 'monorepo/nx')).toBe(true);
  });

  it('does NOT include frontend block when frontend is null', () => {
    const blocks = resolveBlocks(backendOnlyConfig);
    expect(blocks.some((b) => b.id.startsWith('frontend/'))).toBe(false);
  });

  it('includes correct block count for full stack config', () => {
    const blocks = resolveBlocks(fullStackConfig);
    // _shared + angular + nestjs + ionic + postgresql + nx = 6
    expect(blocks.length).toBe(6);
  });

  it('includes only shared block for minimal config (no stack)', () => {
    const minimalConfig: DevkitConfig = {
      projectName: 'minimal',
      frontend: null,
      backend: null,
      mobile: null,
      database: null,
      monorepo: null,
      aiTool: 'claude-code',
      language: 'en',
    };
    const blocks = resolveBlocks(minimalConfig);
    expect(blocks.length).toBe(1);
    expect(blocks[0].id).toBe('_shared');
  });
});

// ─── composeOutput ────────────────────────────────────────────────────────────

describe('composeOutput', () => {
  it('composes files from all blocks with absolute paths', () => {
    const blocks = resolveBlocks(angularNestConfig);
    const output = composeOutput(blocks);

    expect(output.filesToCopy.length).toBeGreaterThan(0);
    // All src paths should be absolute
    for (const file of output.filesToCopy) {
      expect(file.src).toMatch(/^\//);
    }
  });

  it('collects cursorrules fragments from blocks that have them', () => {
    const blocks = resolveBlocks(angularNestConfig);
    const output = composeOutput(blocks);

    // angular, nestjs, postgresql, nx all have cursorrules fragments
    expect(output.cursorrulesFragments.length).toBeGreaterThanOrEqual(4);
  });

  it('collects claude fragments from blocks that have them', () => {
    const blocks = resolveBlocks(angularNestConfig);
    const output = composeOutput(blocks);

    expect(output.claudeFragments.length).toBeGreaterThanOrEqual(4);
  });

  it('shared block has no cursorrules or claude fragments', () => {
    const blocks = resolveBlocks(backendOnlyConfig);
    const sharedBlock = blocks.find((b) => b.id === '_shared')!;
    expect(sharedBlock.cursorrulesFragment).toBeUndefined();
    expect(sharedBlock.claudeFragment).toBeUndefined();
  });

  it('output files include agent role files', () => {
    const blocks = resolveBlocks(fullStackConfig);
    const output = composeOutput(blocks);

    const destPaths = output.filesToCopy.map((f) => f.dest);
    expect(destPaths).toContain('agents/roles/project-manager.md');
    expect(destPaths).toContain('agents/roles/security-agent.md');
    expect(destPaths).toContain('agents/roles/frontend-agent.md');
    expect(destPaths).toContain('agents/roles/backend-agent.md');
    expect(destPaths).toContain('agents/roles/mobile-agent.md');
  });

  it('output files include workflow files', () => {
    const blocks = resolveBlocks(angularNestConfig);
    const output = composeOutput(blocks);

    const destPaths = output.filesToCopy.map((f) => f.dest);
    expect(destPaths).toContain('agents/workflows/new-backend-module.md');
    expect(destPaths).toContain('agents/workflows/new-frontend-component.md');
  });
});
