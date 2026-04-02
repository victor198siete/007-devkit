import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { updateCommand } from './commands/update.js';

const program = new Command();

program
  .name('007devkit')
  .description('Scaffold your TypeScript project with AI agents, AIM methodology and coding standards.')
  .version('0.1.0', '-v, --version', 'Output the current version');

program
  .command('init [directory]')
  .alias('i')
  .description('Initialize a new AI dev environment in the current or specified directory')
  .action(async (directory?: string) => {
    await initCommand(directory);
  });

program
  .command('update [directory]')
  .alias('u')
  .description('Update templates to the latest version without overwriting customizations')
  .action(async (directory?: string) => {
    await updateCommand(directory);
  });

// Default action: run init if no command provided
program.action(async () => {
  await initCommand();
});

program.parse(process.argv);
