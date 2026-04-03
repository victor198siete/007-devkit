// Programmatic API — used by VS Code extension and other tooling
// Does NOT import CLI-specific code (commander, @clack/prompts, chalk, ora)

export { generateFiles } from './generator/file-generator.js';
export {
  resolveBlocks,
  composeOutput,
  buildTemplateVars,
} from './composer/template-composer.js';
export type { ComposedOutput } from './composer/template-composer.js';
export type {
  DevkitConfig,
  DevkitProjectConfig,
  GenerationResult,
  TemplateVars,
  TemplateBlock,
  BlockFile,
  FrontendStack,
  BackendStack,
  MobileStack,
  DatabaseStack,
  MonorepoStack,
  AiTool,
  Language,
} from './types/index.js';
