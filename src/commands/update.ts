import path from 'path';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import type { DevkitConfig, DevkitProjectConfig } from '../types/index.js';
import { resolveBlocks, composeOutput } from '../composer/template-composer.js';
import { generateFiles } from '../generator/file-generator.js';

export async function updateCommand(targetPath?: string): Promise<void> {
  const targetDir = targetPath
    ? path.resolve(process.cwd(), targetPath)
    : process.cwd();

  // Read devkit.config.json
  const configPath = path.join(targetDir, 'devkit.config.json');
  const exists = await fse.pathExists(configPath);

  if (!exists) {
    console.log(chalk.red('  ✗ devkit.config.json not found.'));
    console.log(chalk.gray('    Run 007devkit init first.'));
    process.exit(1);
  }

  const devkitConfig: DevkitProjectConfig = await fse.readJson(configPath);

  console.log('');
  console.log(chalk.bold.cyan(' 007devkit ') + chalk.gray('— Update'));
  console.log(chalk.gray(`  Project: ${devkitConfig.projectName}`));
  console.log(chalk.gray(`  Installed: ${devkitConfig.installedAt}`));
  console.log(chalk.gray(`  Blocks: ${devkitConfig.blocks.join(', ')}`));
  console.log('');

  // Determine which files to update
  const filesToUpdate = await p.multiselect({
    message: 'Which core files should be updated to latest?',
    options: [
      { value: 'core-agents', label: 'agents/prompts/ + agents/contexts/', hint: 'Recommended' },
      { value: 'core-workflows', label: 'agents/workflows/ (debug, tests, review)', hint: 'Recommended' },
      { value: 'core-aim', label: 'docs/aim-methodology.md', hint: 'Universal methodology' },
      { value: 'cursorrules', label: '.cursorrules', hint: 'Stack rules' },
      { value: 'claude-md', label: 'CLAUDE.md', hint: 'Agent instructions' },
    ],
    required: false,
  });

  if (p.isCancel(filesToUpdate) || (filesToUpdate as string[]).length === 0) {
    p.cancel('Nothing to update.');
    return;
  }

  const confirm = await p.confirm({
    message: `Update ${(filesToUpdate as string[]).length} file group(s)? Customized files will be skipped.`,
  });

  if (!confirm || p.isCancel(confirm)) {
    p.cancel('Update cancelled.');
    return;
  }

  // Rebuild config from stored devkit.config.json
  const config = rebuildConfig(devkitConfig);
  const blocks = resolveBlocks(config);
  const composed = composeOutput(blocks);

  const spinner = ora('Updating files...').start();
  const result = await generateFiles(config, targetDir, composed);
  spinner.stop();

  // Print summary
  console.log('');
  if (result.errors.length === 0) {
    p.outro(chalk.green.bold('✓ Update complete!'));
  } else {
    p.outro(chalk.yellow.bold('⚠ Update complete with some issues'));
  }

  for (const f of result.created) {
    console.log(chalk.green(`  ✓  ${f}`));
  }
  for (const f of result.skipped) {
    console.log(chalk.gray(`  ─  ${f} (skipped)`));
  }
  for (const e of result.errors) {
    console.log(chalk.red(`  ✗  ${e}`));
  }
  console.log('');
}

// Rebuild DevkitConfig from stored DevkitProjectConfig
function rebuildConfig(stored: DevkitProjectConfig): DevkitConfig {
  return {
    projectName: stored.projectName,
    frontend: (stored.blocks.find(b => ['angular', 'react', 'nextjs', 'vue', 'nuxt'].includes(b)) ?? null) as DevkitConfig['frontend'],
    backend: (stored.blocks.find(b => ['nestjs', 'express', 'nextjs-api'].includes(b)) ?? null) as DevkitConfig['backend'],
    mobile: (stored.blocks.find(b => ['ionic', 'react-native'].includes(b)) ?? null) as DevkitConfig['mobile'],
    database: (stored.blocks.find(b => ['postgresql', 'mysql', 'mongodb'].includes(b)) ?? null) as DevkitConfig['database'],
    monorepo: (stored.blocks.find(b => ['nx', 'turborepo'].includes(b)) ?? null) as DevkitConfig['monorepo'],
    aiTool: stored.aiTool,
    language: stored.language,
  };
}
