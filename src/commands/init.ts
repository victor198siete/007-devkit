import path from 'path';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import ora from 'ora';
import fse from 'fs-extra';
import { runQuestions } from '../prompts/questions.js';
import { resolveBlocks, composeOutput } from '../composer/template-composer.js';
import { generateFiles } from '../generator/file-generator.js';

export async function initCommand(targetPath?: string): Promise<void> {
  const targetDir = targetPath
    ? path.resolve(process.cwd(), targetPath)
    : process.cwd();

  // Confirm target directory
  const dirName = path.basename(targetDir);
  const dirExists = await fse.pathExists(targetDir);
  const isEmpty = dirExists
    ? (await fse.readdir(targetDir)).length === 0
    : true;

  if (dirExists && !isEmpty) {
    const proceed = await p.confirm({
      message: `${chalk.yellow(dirName)} is not empty. Continue anyway?`,
      initialValue: false,
    });
    if (!proceed || p.isCancel(proceed)) {
      p.cancel('Setup cancelled.');
      process.exit(0);
    }
  }

  // Run interactive questions
  const config = await runQuestions(dirName);

  // Ensure target directory exists
  await fse.ensureDir(targetDir);

  // Resolve blocks and compose output plan
  const spinner = ora('Preparing templates...').start();
  const blocks = resolveBlocks(config);
  const composed = composeOutput(blocks);
  spinner.stop();

  // Generate files
  const genSpinner = ora('Generating files...').start();
  const result = await generateFiles(config, targetDir, composed);
  genSpinner.stop();

  // Print summary
  console.log('');
  if (result.errors.length === 0) {
    p.outro(chalk.green.bold('✓ Done!'));
  } else {
    p.outro(chalk.yellow.bold('⚠ Done with some issues'));
  }

  if (result.created.length > 0) {
    console.log(chalk.green('  Created:'));
    for (const f of result.created) {
      console.log(chalk.green(`    ✓  ${f}`));
    }
  }

  if (result.skipped.length > 0) {
    console.log(chalk.gray('  Skipped (already exist):'));
    for (const f of result.skipped) {
      console.log(chalk.gray(`    ─  ${f}`));
    }
  }

  if (result.errors.length > 0) {
    console.log(chalk.red('  Errors:'));
    for (const e of result.errors) {
      console.log(chalk.red(`    ✗  ${e}`));
    }
  }

  console.log('');
  console.log(chalk.cyan('  Next steps:'));
  console.log(chalk.white(`    1. Read ${chalk.bold('CLAUDE.md')} to understand the agent system`));
  console.log(chalk.white(`    2. Check ${chalk.bold('agents/contexts/session-state.md')} to track project state`));
  console.log(chalk.white(`    3. Use ${chalk.bold('@pm')} alias to coordinate your first feature`));
  console.log('');
}
