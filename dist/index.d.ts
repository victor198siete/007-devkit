type FrontendStack = 'angular' | 'react' | 'nextjs' | 'vue' | 'nuxt' | null;
type BackendStack = 'nestjs' | 'express' | 'nextjs-api' | null;
type MobileStack = 'ionic' | 'react-native' | null;
type DatabaseStack = 'postgresql' | 'mysql' | 'mongodb' | null;
type MonorepoStack = 'nx' | 'turborepo' | null;
type AiTool = 'claude-code' | 'cursor' | 'both';
type Language = 'es' | 'en';
interface DevkitConfig {
    projectName: string;
    frontend: FrontendStack;
    backend: BackendStack;
    mobile: MobileStack;
    database: DatabaseStack;
    monorepo: MonorepoStack;
    aiTool: AiTool;
    language: Language;
}
interface DevkitProjectConfig {
    version: string;
    projectName: string;
    blocks: string[];
    aiTool: AiTool;
    language: Language;
    customized: string[];
    installedAt: string;
}
interface TemplateBlock {
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
interface BlockFile {
    /** Source path relative to block dir */
    src: string;
    /** Destination path relative to target project root */
    dest: string;
    /** If true, skip if file already exists in target */
    skipIfExists?: boolean;
}
interface GenerationResult {
    created: string[];
    skipped: string[];
    errors: string[];
}
interface TemplateVars {
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

declare function buildTemplateVars(config: DevkitConfig): TemplateVars;
declare function resolveBlocks(config: DevkitConfig): TemplateBlock[];
interface ComposedOutput {
    filesToCopy: BlockFile[];
    cursorrulesFragments: string[];
    claudeFragments: string[];
}
declare function composeOutput(blocks: TemplateBlock[]): ComposedOutput;

declare function generateFiles(config: DevkitConfig, targetDir: string, composed: ComposedOutput): Promise<GenerationResult>;

export { type AiTool, type BackendStack, type BlockFile, type ComposedOutput, type DatabaseStack, type DevkitConfig, type DevkitProjectConfig, type FrontendStack, type GenerationResult, type Language, type MobileStack, type MonorepoStack, type TemplateBlock, type TemplateVars, buildTemplateVars, composeOutput, generateFiles, resolveBlocks };
