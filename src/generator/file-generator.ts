import path from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import ejs from 'ejs';
import type { BlockFile, DevkitConfig, DevkitProjectConfig, GenerationResult, TemplateVars } from '../types/index.js';
import type { ComposedOutput } from '../composer/template-composer.js';
import { buildTemplateVars } from '../composer/template-composer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Works in both: dist/cli.js (one level up) and src/subdir/ (two levels up)
const _fromDist = path.join(__dirname, '../templates');
const _fromSrc = path.join(__dirname, '../../templates');
const TEMPLATES_DIR = fse.existsSync(_fromDist) ? _fromDist : _fromSrc;
const PACKAGE_VERSION = '0.1.0';

// ─── Main generation entry point ─────────────────────────────────────────────

export async function generateFiles(
  config: DevkitConfig,
  targetDir: string,
  composed: ComposedOutput,
): Promise<GenerationResult> {
  const result: GenerationResult = { created: [], skipped: [], errors: [] };
  const vars = buildTemplateVars(config);

  // 1. Copy core (universal) files
  await copyCoreFiles(targetDir, vars, result);

  // 2. Copy block-specific files
  for (const blockFile of composed.filesToCopy) {
    await copyBlockFile(blockFile, targetDir, vars, result);
  }

  // 3. Render and write .cursorrules (if needed)
  if (config.aiTool === 'cursor' || config.aiTool === 'both') {
    await renderCursorrules(composed.cursorrulesFragments, targetDir, vars, result);
  }

  // 4. Render and write CLAUDE.md (if needed)
  if (config.aiTool === 'claude-code' || config.aiTool === 'both') {
    await renderClaudeMd(composed.claudeFragments, targetDir, vars, result);
  }

  // 5. Write devkit.config.json
  await writeDevkitConfig(config, composed, targetDir, result);

  return result;
}

// ─── Copy core files ──────────────────────────────────────────────────────────

async function copyCoreFiles(
  targetDir: string,
  vars: TemplateVars,
  result: GenerationResult,
): Promise<void> {
  const coreDir = path.join(TEMPLATES_DIR, 'core');
  const coreFiles = await collectFiles(coreDir);

  for (const filePath of coreFiles) {
    const relativePath = path.relative(coreDir, filePath);
    const destPath = path.join(targetDir, relativePath);

    try {
      // For .ejs files, the final destination has the .ejs extension stripped
      const finalDest = filePath.endsWith('.ejs')
        ? destPath.replace(/\.ejs$/, '')
        : destPath;

      const exists = await fse.pathExists(finalDest);
      if (exists) {
        result.skipped.push(relativePath.replace(/\.ejs$/, ''));
        continue;
      }

      const content = await fse.readFile(filePath, 'utf-8');
      const rendered = filePath.endsWith('.ejs')
        ? ejs.render(content, vars)
        : content;

      await fse.ensureDir(path.dirname(finalDest));
      await fse.writeFile(finalDest, rendered, 'utf-8');
      result.created.push(relativePath.replace(/\.ejs$/, ''));
    } catch (err) {
      result.errors.push(`${relativePath}: ${(err as Error).message}`);
    }
  }
}

// ─── Copy a single block file ─────────────────────────────────────────────────

async function copyBlockFile(
  blockFile: BlockFile,
  targetDir: string,
  vars: TemplateVars,
  result: GenerationResult,
): Promise<void> {
  // src is absolute path from the block definition
  const srcPath = blockFile.src;
  const destPath = path.join(targetDir, blockFile.dest);

  try {
    const exists = await fse.pathExists(destPath);
    // Skip by default — only overwrite when skipIfExists is explicitly false
    if (exists && blockFile.skipIfExists !== false) {
      result.skipped.push(blockFile.dest);
      return;
    }

    const content = await fse.readFile(srcPath, 'utf-8');
    const rendered = srcPath.endsWith('.ejs') ? ejs.render(content, vars) : content;

    await fse.ensureDir(path.dirname(destPath));
    await fse.writeFile(destPath, rendered, 'utf-8');
    result.created.push(blockFile.dest);
  } catch (err) {
    result.errors.push(`${blockFile.dest}: ${(err as Error).message}`);
  }
}

// ─── Render .cursorrules from fragments ──────────────────────────────────────

async function renderCursorrules(
  fragmentPaths: string[],
  targetDir: string,
  vars: TemplateVars,
  result: GenerationResult,
): Promise<void> {
  const destPath = path.join(targetDir, '.cursorrules');
  const exists = await fse.pathExists(destPath);
  if (exists) {
    result.skipped.push('.cursorrules');
    return;
  }

  try {
    const headerTpl = await fse.readFile(
      path.join(TEMPLATES_DIR, 'scaffolds/cursorrules-header.ejs'),
      'utf-8',
    );
    const parts = [ejs.render(headerTpl, vars)];

    for (const fragPath of fragmentPaths) {
      const fragExists = await fse.pathExists(fragPath);
      if (!fragExists) continue;
      const frag = await fse.readFile(fragPath, 'utf-8');
      parts.push(ejs.render(frag, vars));
    }

    const footerTpl = await fse.readFile(
      path.join(TEMPLATES_DIR, 'scaffolds/cursorrules-footer.ejs'),
      'utf-8',
    );
    parts.push(ejs.render(footerTpl, vars));

    await fse.ensureDir(path.dirname(destPath));
    await fse.writeFile(destPath, parts.join('\n\n---\n\n'), 'utf-8');
    result.created.push('.cursorrules');
  } catch (err) {
    result.errors.push(`.cursorrules: ${(err as Error).message}`);
  }
}

// ─── Render CLAUDE.md from fragments ─────────────────────────────────────────

async function renderClaudeMd(
  fragmentPaths: string[],
  targetDir: string,
  vars: TemplateVars,
  result: GenerationResult,
): Promise<void> {
  const destPath = path.join(targetDir, 'CLAUDE.md');
  const exists = await fse.pathExists(destPath);
  if (exists) {
    result.skipped.push('CLAUDE.md');
    return;
  }

  try {
    const headerTpl = await fse.readFile(
      path.join(TEMPLATES_DIR, 'scaffolds/claude-header.ejs'),
      'utf-8',
    );
    const parts = [ejs.render(headerTpl, vars)];

    for (const fragPath of fragmentPaths) {
      const fragExists = await fse.pathExists(fragPath);
      if (!fragExists) continue;
      const frag = await fse.readFile(fragPath, 'utf-8');
      parts.push(ejs.render(frag, vars));
    }

    const footerTpl = await fse.readFile(
      path.join(TEMPLATES_DIR, 'scaffolds/claude-footer.ejs'),
      'utf-8',
    );
    parts.push(ejs.render(footerTpl, vars));

    await fse.ensureDir(path.dirname(destPath));
    await fse.writeFile(destPath, parts.join('\n\n'), 'utf-8');
    result.created.push('CLAUDE.md');
  } catch (err) {
    result.errors.push(`CLAUDE.md: ${(err as Error).message}`);
  }
}

// ─── Write devkit.config.json ─────────────────────────────────────────────────

async function writeDevkitConfig(
  config: DevkitConfig,
  _composed: ComposedOutput,
  targetDir: string,
  result: GenerationResult,
): Promise<void> {
  const destPath = path.join(targetDir, 'devkit.config.json');

  const blocks: string[] = [];
  if (config.frontend) blocks.push(config.frontend);
  if (config.backend) blocks.push(config.backend);
  if (config.mobile) blocks.push(config.mobile);
  if (config.database) blocks.push(config.database);
  if (config.monorepo) blocks.push(config.monorepo);

  const devkitConfig: DevkitProjectConfig = {
    version: PACKAGE_VERSION,
    projectName: config.projectName,
    blocks,
    aiTool: config.aiTool,
    language: config.language,
    customized: [],
    installedAt: new Date().toISOString(),
  };

  const exists = await fse.pathExists(destPath);
  if (exists) {
    result.skipped.push('devkit.config.json');
    return;
  }

  await fse.writeJson(destPath, devkitConfig, { spaces: 2 });
  result.created.push('devkit.config.json');
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await fse.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath);
      files.push(...nested);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}
