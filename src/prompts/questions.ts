import * as p from '@clack/prompts';
import chalk from 'chalk';
import type { DevkitConfig } from '../types/index.js';

export async function runQuestions(targetDir?: string): Promise<DevkitConfig> {
  console.log('');
  p.intro(chalk.bold.cyan(' 007devkit ') + chalk.gray('— AI Dev Environment Setup'));

  const projectName = await p.text({
    message: 'Project name',
    placeholder: targetDir ?? 'my-app',
    defaultValue: targetDir ?? 'my-app',
    validate: (val) => {
      if (!val || val.trim().length === 0) return 'Project name is required';
      if (!/^[a-z0-9-_@/]+$/.test(val)) return 'Use lowercase letters, numbers, hyphens or underscores';
      return undefined;
    },
  });

  if (p.isCancel(projectName)) {
    p.cancel('Setup cancelled.');
    process.exit(0);
  }

  const frontend = await p.select({
    message: 'Frontend framework',
    options: [
      { value: 'angular', label: 'Angular 21 + Signals', hint: 'Standalone components, inject(), signals' },
      { value: 'react', label: 'React 19', hint: 'Hooks, RSC, React Compiler' },
      { value: 'nextjs', label: 'Next.js 14 (App Router)', hint: 'RSC, Server Actions, streaming' },
      { value: 'vue', label: 'Vue 3 + Composition API', hint: 'Pinia, script setup' },
      { value: 'nuxt', label: 'Nuxt 3', hint: 'Vue 3 + file-based routing' },
      { value: 'none', label: 'None', hint: 'Backend only' },
    ],
  });

  if (p.isCancel(frontend)) { p.cancel('Setup cancelled.'); process.exit(0); }

  const backend = await p.select({
    message: 'Backend framework',
    options: [
      { value: 'nestjs', label: 'NestJS', hint: 'Modules, Guards, TypeORM, OpenAPI' },
      { value: 'express', label: 'Express / Fastify', hint: 'Lightweight REST API' },
      { value: 'nextjs-api', label: 'Next.js API Routes', hint: 'Serverless-ready' },
      { value: 'none', label: 'None', hint: 'Frontend only' },
    ],
  });

  if (p.isCancel(backend)) { p.cancel('Setup cancelled.'); process.exit(0); }

  const database = await p.select({
    message: 'Database',
    options: [
      { value: 'postgresql', label: 'PostgreSQL', hint: 'TypeORM / Drizzle' },
      { value: 'mysql', label: 'MySQL / MariaDB', hint: 'TypeORM / Drizzle' },
      { value: 'mongodb', label: 'MongoDB', hint: 'Mongoose / Prisma' },
      { value: 'none', label: 'None / Other' },
    ],
  });

  if (p.isCancel(database)) { p.cancel('Setup cancelled.'); process.exit(0); }

  const mobile = await p.select({
    message: 'Mobile app?',
    options: [
      { value: 'none', label: 'No mobile' },
      { value: 'ionic', label: 'Ionic + Capacitor', hint: 'Angular or React based' },
      { value: 'react-native', label: 'React Native / Expo' },
    ],
  });

  if (p.isCancel(mobile)) { p.cancel('Setup cancelled.'); process.exit(0); }

  const monorepo = await p.select({
    message: 'Monorepo tool?',
    options: [
      { value: 'none', label: 'No (single repo)' },
      { value: 'nx', label: 'Nx', hint: 'Recommended for Angular + NestJS' },
      { value: 'turborepo', label: 'Turborepo', hint: 'Recommended for Next.js / React' },
    ],
  });

  if (p.isCancel(monorepo)) { p.cancel('Setup cancelled.'); process.exit(0); }

  const aiTool = await p.select({
    message: 'Primary AI tool',
    options: [
      { value: 'claude-code', label: 'Claude Code (CLI)', hint: 'Generates CLAUDE.md' },
      { value: 'cursor', label: 'Cursor / Windsurf', hint: 'Generates .cursorrules' },
      { value: 'both', label: 'Both', hint: 'Generates both files' },
    ],
  });

  if (p.isCancel(aiTool)) { p.cancel('Setup cancelled.'); process.exit(0); }

  const language = await p.select({
    message: 'Documentation language',
    options: [
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English' },
    ],
  });

  if (p.isCancel(language)) { p.cancel('Setup cancelled.'); process.exit(0); }

  return {
    projectName: projectName as string,
    frontend: frontend === 'none' ? null : (frontend as DevkitConfig['frontend']),
    backend: backend === 'none' ? null : (backend as DevkitConfig['backend']),
    mobile: mobile === 'none' ? null : (mobile as DevkitConfig['mobile']),
    database: database === 'none' ? null : (database as DevkitConfig['database']),
    monorepo: monorepo === 'none' ? null : (monorepo as DevkitConfig['monorepo']),
    aiTool: aiTool as DevkitConfig['aiTool'],
    language: language as DevkitConfig['language'],
  };
}
