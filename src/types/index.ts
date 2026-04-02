// ─── Stack Options ────────────────────────────────────────────────────────────

export type FrontendStack = 'angular' | 'react' | 'nextjs' | 'vue' | 'nuxt' | null;
export type BackendStack = 'nestjs' | 'express' | 'nextjs-api' | null;
export type MobileStack = 'ionic' | 'react-native' | null;
export type DatabaseStack = 'postgresql' | 'mysql' | 'mongodb' | null;
export type MonorepoStack = 'nx' | 'turborepo' | null;
export type AiTool = 'claude-code' | 'cursor' | 'both';
export type Language = 'es' | 'en';

// ─── Main Config ──────────────────────────────────────────────────────────────

export interface DevkitConfig {
  projectName: string;
  frontend: FrontendStack;
  backend: BackendStack;
  mobile: MobileStack;
  database: DatabaseStack;
  monorepo: MonorepoStack;
  aiTool: AiTool;
  language: Language;
}

// ─── devkit.config.json (written to target project) ──────────────────────────

export interface DevkitProjectConfig {
  version: string;
  projectName: string;
  blocks: string[];
  aiTool: AiTool;
  language: Language;
  customized: string[];
  installedAt: string;
}

// ─── Template Block ───────────────────────────────────────────────────────────

export interface TemplateBlock {
  /** Unique block id, e.g. "frontend/angular" */
  id: string;
  /** Human-readable label */
  label: string;
  /** Path to the block directory inside templates/blocks/ */
  path: string;
  /** Files to copy as-is (relative to block path) */
  files: BlockFile[];
  /** EJS fragment that gets injected into .cursorrules */
  cursorrulesFragment?: string;
  /** EJS fragment that gets injected into CLAUDE.md */
  claudeFragment?: string;
}

export interface BlockFile {
  /** Source path relative to block dir */
  src: string;
  /** Destination path relative to target project root */
  dest: string;
  /** If true, skip if file already exists in target */
  skipIfExists?: boolean;
}

// ─── Generation Result ────────────────────────────────────────────────────────

export interface GenerationResult {
  created: string[];
  skipped: string[];
  errors: string[];
}

// ─── Template Variables ───────────────────────────────────────────────────────

export interface TemplateVars {
  projectName: string;
  frontend: string;
  backend: string;
  mobile: string;
  database: string;
  monorepo: string;
  aiTool: string;
  language: string;
  year: number;
  date: string;
  hasFrontend: boolean;
  hasBackend: boolean;
  hasMobile: boolean;
  hasDatabase: boolean;
  hasMonorepo: boolean;
  isAngular: boolean;
  isReact: boolean;
  isNextjs: boolean;
  isVue: boolean;
  isNuxt: boolean;
  isNestjs: boolean;
  isExpress: boolean;
  isIonic: boolean;
  isNx: boolean;
  isTurborepo: boolean;
  isPostgres: boolean;
  isMongo: boolean;
  isClaudeCode: boolean;
  isCursor: boolean;
  isBothAiTools: boolean;
}
