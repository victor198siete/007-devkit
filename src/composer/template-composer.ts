import path from 'path';
import { fileURLToPath } from 'url';
import type { DevkitConfig, TemplateBlock, BlockFile, TemplateVars } from '../types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.join(__dirname, '../../templates');

// ─── Build template variables from config ─────────────────────────────────────

export function buildTemplateVars(config: DevkitConfig): TemplateVars {
  const now = new Date();
  return {
    projectName: config.projectName,
    frontend: config.frontend ?? 'none',
    backend: config.backend ?? 'none',
    mobile: config.mobile ?? 'none',
    database: config.database ?? 'none',
    monorepo: config.monorepo ?? 'none',
    aiTool: config.aiTool,
    language: config.language,
    year: now.getFullYear(),
    date: now.toISOString().split('T')[0],
    hasFrontend: config.frontend !== null,
    hasBackend: config.backend !== null,
    hasMobile: config.mobile !== null,
    hasDatabase: config.database !== null,
    hasMonorepo: config.monorepo !== null,
    isAngular: config.frontend === 'angular',
    isReact: config.frontend === 'react',
    isNextjs: config.frontend === 'nextjs' || config.backend === 'nextjs-api',
    isVue: config.frontend === 'vue',
    isNuxt: config.frontend === 'nuxt',
    isNestjs: config.backend === 'nestjs',
    isExpress: config.backend === 'express',
    isIonic: config.mobile === 'ionic',
    isNx: config.monorepo === 'nx',
    isTurborepo: config.monorepo === 'turborepo',
    isPostgres: config.database === 'postgresql',
    isMongo: config.database === 'mongodb',
    isClaudeCode: config.aiTool === 'claude-code' || config.aiTool === 'both',
    isCursor: config.aiTool === 'cursor' || config.aiTool === 'both',
    isBothAiTools: config.aiTool === 'both',
  };
}

// ─── Resolve which blocks to load based on config ─────────────────────────────

export function resolveBlocks(config: DevkitConfig): TemplateBlock[] {
  const blocks: TemplateBlock[] = [];

  // Always include shared roles and workflows
  blocks.push(sharedBlock());

  // Frontend block
  if (config.frontend) {
    const frontendBlock = frontendBlocks[config.frontend];
    if (frontendBlock) blocks.push(frontendBlock);
  }

  // Backend block
  if (config.backend) {
    const backendBlock = backendBlocks[config.backend];
    if (backendBlock) blocks.push(backendBlock);
  }

  // Mobile block
  if (config.mobile) {
    const mobileBlock = mobileBlocks[config.mobile];
    if (mobileBlock) blocks.push(mobileBlock);
  }

  // Database block (adds notes to standards docs)
  if (config.database) {
    const dbBlock = databaseBlocks[config.database];
    if (dbBlock) blocks.push(dbBlock);
  }

  // Monorepo block
  if (config.monorepo) {
    const monoBlock = monorepoBlocks[config.monorepo];
    if (monoBlock) blocks.push(monoBlock);
  }

  return blocks;
}

// ─── Collect all files to generate from all blocks ────────────────────────────

export interface ComposedOutput {
  filesToCopy: BlockFile[];
  cursorrulesFragments: string[];
  claudeFragments: string[];
}

export function composeOutput(blocks: TemplateBlock[]): ComposedOutput {
  const filesToCopy: BlockFile[] = [];
  const cursorrulesFragments: string[] = [];
  const claudeFragments: string[] = [];

  for (const block of blocks) {
    // Resolve block file src paths to absolute paths
    const resolvedFiles = block.files.map((f) => ({
      ...f,
      src: path.isAbsolute(f.src) ? f.src : path.join(block.path, f.src),
    }));
    filesToCopy.push(...resolvedFiles);
    if (block.cursorrulesFragment) cursorrulesFragments.push(block.cursorrulesFragment);
    if (block.claudeFragment) claudeFragments.push(block.claudeFragment);
  }

  return { filesToCopy, cursorrulesFragments, claudeFragments };
}

// ─── Block definitions ────────────────────────────────────────────────────────

function sharedBlock(): TemplateBlock {
  return {
    id: '_shared',
    label: 'Shared (universal)',
    path: path.join(TEMPLATES_DIR, 'blocks/_shared'),
    files: [
      { src: 'roles/project-manager.md', dest: 'agents/roles/project-manager.md' },
      { src: 'roles/security-agent.md', dest: 'agents/roles/security-agent.md' },
      { src: 'workflows/init-session.md', dest: 'agents/workflows/init-session.md' },
    ],
  };
}

const frontendBlocks: Record<string, TemplateBlock> = {
  angular: {
    id: 'frontend/angular',
    label: 'Angular 21',
    path: path.join(TEMPLATES_DIR, 'blocks/frontend/angular'),
    files: [
      { src: 'role.md', dest: 'agents/roles/frontend-agent.md' },
      { src: 'standards.md', dest: 'docs/frontend-architecture-standards.md' },
      { src: 'ui-ux.md', dest: 'docs/frontend-ui-ux-guidelines.md' },
      { src: 'workflows/new-component.md', dest: 'agents/workflows/new-frontend-component.md' },
      { src: 'workflows/new-feature.md', dest: 'agents/workflows/new-frontend-feature.md' },
      { src: 'workflows/new-module.md', dest: 'agents/workflows/new-frontend-module.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/angular/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/angular/claude.fragment.ejs'),
  },
  react: {
    id: 'frontend/react',
    label: 'React 19',
    path: path.join(TEMPLATES_DIR, 'blocks/frontend/react'),
    files: [
      { src: 'role.md', dest: 'agents/roles/frontend-agent.md' },
      { src: 'standards.md', dest: 'docs/frontend-architecture-standards.md' },
      { src: 'workflows/new-component.md', dest: 'agents/workflows/new-frontend-component.md' },
      { src: 'workflows/new-feature.md', dest: 'agents/workflows/new-frontend-feature.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/react/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/react/claude.fragment.ejs'),
  },
  nextjs: {
    id: 'frontend/nextjs',
    label: 'Next.js 14',
    path: path.join(TEMPLATES_DIR, 'blocks/frontend/nextjs'),
    files: [
      { src: 'role.md', dest: 'agents/roles/frontend-agent.md' },
      { src: 'standards.md', dest: 'docs/frontend-architecture-standards.md' },
      { src: 'workflows/new-component.md', dest: 'agents/workflows/new-frontend-component.md' },
      { src: 'workflows/new-feature.md', dest: 'agents/workflows/new-frontend-feature.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/nextjs/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/nextjs/claude.fragment.ejs'),
  },
  vue: {
    id: 'frontend/vue',
    label: 'Vue 3',
    path: path.join(TEMPLATES_DIR, 'blocks/frontend/vue'),
    files: [
      { src: 'role.md', dest: 'agents/roles/frontend-agent.md' },
      { src: 'standards.md', dest: 'docs/frontend-architecture-standards.md' },
      { src: 'workflows/new-component.md', dest: 'agents/workflows/new-frontend-component.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/vue/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/vue/claude.fragment.ejs'),
  },
  nuxt: {
    id: 'frontend/nuxt',
    label: 'Nuxt 3',
    path: path.join(TEMPLATES_DIR, 'blocks/frontend/nuxt'),
    files: [
      { src: 'role.md', dest: 'agents/roles/frontend-agent.md' },
      { src: 'standards.md', dest: 'docs/frontend-architecture-standards.md' },
      { src: 'workflows/new-component.md', dest: 'agents/workflows/new-frontend-component.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/nuxt/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/frontend/nuxt/claude.fragment.ejs'),
  },
};

const backendBlocks: Record<string, TemplateBlock> = {
  nestjs: {
    id: 'backend/nestjs',
    label: 'NestJS',
    path: path.join(TEMPLATES_DIR, 'blocks/backend/nestjs'),
    files: [
      { src: 'role.md', dest: 'agents/roles/backend-agent.md' },
      { src: 'standards.md', dest: 'docs/nest-backend-general-standards.md' },
      { src: 'workflows/new-module.md', dest: 'agents/workflows/new-backend-module.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/backend/nestjs/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/backend/nestjs/claude.fragment.ejs'),
  },
  express: {
    id: 'backend/express',
    label: 'Express',
    path: path.join(TEMPLATES_DIR, 'blocks/backend/express'),
    files: [
      { src: 'role.md', dest: 'agents/roles/backend-agent.md' },
      { src: 'standards.md', dest: 'docs/express-backend-standards.md' },
      { src: 'workflows/new-route.md', dest: 'agents/workflows/new-backend-route.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/backend/express/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/backend/express/claude.fragment.ejs'),
  },
  'nextjs-api': {
    id: 'backend/nextjs-api',
    label: 'Next.js API Routes',
    path: path.join(TEMPLATES_DIR, 'blocks/backend/nextjs-api'),
    files: [
      { src: 'role.md', dest: 'agents/roles/backend-agent.md' },
      { src: 'standards.md', dest: 'docs/nextjs-api-standards.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/backend/nextjs-api/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/backend/nextjs-api/claude.fragment.ejs'),
  },
};

const mobileBlocks: Record<string, TemplateBlock> = {
  ionic: {
    id: 'mobile/ionic',
    label: 'Ionic + Capacitor',
    path: path.join(TEMPLATES_DIR, 'blocks/mobile/ionic'),
    files: [
      { src: 'role.md', dest: 'agents/roles/mobile-agent.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/mobile/ionic/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/mobile/ionic/claude.fragment.ejs'),
  },
  'react-native': {
    id: 'mobile/react-native',
    label: 'React Native',
    path: path.join(TEMPLATES_DIR, 'blocks/mobile/react-native'),
    files: [
      { src: 'role.md', dest: 'agents/roles/mobile-agent.md' },
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/mobile/react-native/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/mobile/react-native/claude.fragment.ejs'),
  },
};

const databaseBlocks: Record<string, TemplateBlock> = {
  postgresql: {
    id: 'database/postgresql',
    label: 'PostgreSQL',
    path: path.join(TEMPLATES_DIR, 'blocks/database/postgresql'),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/database/postgresql/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/database/postgresql/claude.fragment.ejs'),
  },
  mysql: {
    id: 'database/mysql',
    label: 'MySQL',
    path: path.join(TEMPLATES_DIR, 'blocks/database/mysql'),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/database/mysql/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/database/mysql/claude.fragment.ejs'),
  },
  mongodb: {
    id: 'database/mongodb',
    label: 'MongoDB',
    path: path.join(TEMPLATES_DIR, 'blocks/database/mongodb'),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/database/mongodb/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/database/mongodb/claude.fragment.ejs'),
  },
};

const monorepoBlocks: Record<string, TemplateBlock> = {
  nx: {
    id: 'monorepo/nx',
    label: 'Nx',
    path: path.join(TEMPLATES_DIR, 'blocks/monorepo/nx'),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/monorepo/nx/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/monorepo/nx/claude.fragment.ejs'),
  },
  turborepo: {
    id: 'monorepo/turborepo',
    label: 'Turborepo',
    path: path.join(TEMPLATES_DIR, 'blocks/monorepo/turborepo'),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, 'blocks/monorepo/turborepo/cursorrules.fragment.ejs'),
    claudeFragment: path.join(TEMPLATES_DIR, 'blocks/monorepo/turborepo/claude.fragment.ejs'),
  },
};
