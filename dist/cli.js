#!/usr/bin/env node

// src/cli.ts
import { Command } from "commander";

// src/commands/init.ts
import path3 from "path";
import * as p2 from "@clack/prompts";
import chalk2 from "chalk";
import ora from "ora";
import fse3 from "fs-extra";

// src/prompts/questions.ts
import * as p from "@clack/prompts";
import chalk from "chalk";
async function runQuestions(targetDir) {
  console.log("");
  p.intro(chalk.bold.cyan(" 007devkit ") + chalk.gray("\u2014 AI Dev Environment Setup"));
  const projectName = await p.text({
    message: "Project name",
    placeholder: targetDir ?? "my-app",
    defaultValue: targetDir ?? "my-app",
    validate: (val) => {
      if (!val || val.trim().length === 0) return "Project name is required";
      if (!/^[a-z0-9-_@/]+$/.test(val)) return "Use lowercase letters, numbers, hyphens or underscores";
      return void 0;
    }
  });
  if (p.isCancel(projectName)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  const frontend = await p.select({
    message: "Frontend framework",
    options: [
      { value: "angular", label: "Angular 21 + Signals", hint: "Standalone components, inject(), signals" },
      { value: "react", label: "React 19", hint: "Hooks, RSC, React Compiler" },
      { value: "nextjs", label: "Next.js 14 (App Router)", hint: "RSC, Server Actions, streaming" },
      { value: "vue", label: "Vue 3 + Composition API", hint: "Pinia, script setup" },
      { value: "nuxt", label: "Nuxt 3", hint: "Vue 3 + file-based routing" },
      { value: "none", label: "None", hint: "Backend only" }
    ]
  });
  if (p.isCancel(frontend)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  const backend = await p.select({
    message: "Backend framework",
    options: [
      { value: "nestjs", label: "NestJS", hint: "Modules, Guards, TypeORM, OpenAPI" },
      { value: "express", label: "Express / Fastify", hint: "Lightweight REST API" },
      { value: "nextjs-api", label: "Next.js API Routes", hint: "Serverless-ready" },
      { value: "none", label: "None", hint: "Frontend only" }
    ]
  });
  if (p.isCancel(backend)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  const database = await p.select({
    message: "Database",
    options: [
      { value: "postgresql", label: "PostgreSQL", hint: "TypeORM / Drizzle" },
      { value: "mysql", label: "MySQL / MariaDB", hint: "TypeORM / Drizzle" },
      { value: "mongodb", label: "MongoDB", hint: "Mongoose / Prisma" },
      { value: "none", label: "None / Other" }
    ]
  });
  if (p.isCancel(database)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  const mobile = await p.select({
    message: "Mobile app?",
    options: [
      { value: "none", label: "No mobile" },
      { value: "ionic", label: "Ionic + Capacitor", hint: "Angular or React based" },
      { value: "react-native", label: "React Native / Expo" }
    ]
  });
  if (p.isCancel(mobile)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  const monorepo = await p.select({
    message: "Monorepo tool?",
    options: [
      { value: "none", label: "No (single repo)" },
      { value: "nx", label: "Nx", hint: "Recommended for Angular + NestJS" },
      { value: "turborepo", label: "Turborepo", hint: "Recommended for Next.js / React" }
    ]
  });
  if (p.isCancel(monorepo)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  const aiTool = await p.select({
    message: "Primary AI tool",
    options: [
      { value: "claude-code", label: "Claude Code (CLI)", hint: "Generates CLAUDE.md" },
      { value: "cursor", label: "Cursor / Windsurf", hint: "Generates .cursorrules" },
      { value: "both", label: "Both", hint: "Generates both files" }
    ]
  });
  if (p.isCancel(aiTool)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  const language = await p.select({
    message: "Documentation language",
    options: [
      { value: "es", label: "Espa\xF1ol" },
      { value: "en", label: "English" }
    ]
  });
  if (p.isCancel(language)) {
    p.cancel("Setup cancelled.");
    process.exit(0);
  }
  return {
    projectName,
    frontend: frontend === "none" ? null : frontend,
    backend: backend === "none" ? null : backend,
    mobile: mobile === "none" ? null : mobile,
    database: database === "none" ? null : database,
    monorepo: monorepo === "none" ? null : monorepo,
    aiTool,
    language
  };
}

// src/composer/template-composer.ts
import path from "path";
import { fileURLToPath } from "url";
import fse from "fs-extra";
var __dirname2 = path.dirname(fileURLToPath(import.meta.url));
var _fromDist = path.join(__dirname2, "../templates");
var _fromSrc = path.join(__dirname2, "../../templates");
var TEMPLATES_DIR = fse.existsSync(_fromDist) ? _fromDist : _fromSrc;
function buildTemplateVars(config) {
  const now = /* @__PURE__ */ new Date();
  return {
    projectName: config.projectName,
    frontend: config.frontend ?? "none",
    backend: config.backend ?? "none",
    mobile: config.mobile ?? "none",
    database: config.database ?? "none",
    monorepo: config.monorepo ?? "none",
    aiTool: config.aiTool,
    language: config.language,
    year: now.getFullYear(),
    date: now.toISOString().split("T")[0],
    hasFrontend: config.frontend !== null,
    hasBackend: config.backend !== null,
    hasMobile: config.mobile !== null,
    hasDatabase: config.database !== null,
    hasMonorepo: config.monorepo !== null,
    isAngular: config.frontend === "angular",
    isReact: config.frontend === "react",
    isNextjs: config.frontend === "nextjs" || config.backend === "nextjs-api",
    isVue: config.frontend === "vue",
    isNuxt: config.frontend === "nuxt",
    isNestjs: config.backend === "nestjs",
    isExpress: config.backend === "express",
    isIonic: config.mobile === "ionic",
    isNx: config.monorepo === "nx",
    isTurborepo: config.monorepo === "turborepo",
    isPostgres: config.database === "postgresql",
    isMongo: config.database === "mongodb",
    isClaudeCode: config.aiTool === "claude-code" || config.aiTool === "both",
    isCursor: config.aiTool === "cursor" || config.aiTool === "both",
    isBothAiTools: config.aiTool === "both"
  };
}
function resolveBlocks(config) {
  const blocks = [];
  blocks.push(sharedBlock());
  if (config.frontend) {
    const frontendBlock = frontendBlocks[config.frontend];
    if (frontendBlock) blocks.push(frontendBlock);
  }
  if (config.backend) {
    const backendBlock = backendBlocks[config.backend];
    if (backendBlock) blocks.push(backendBlock);
  }
  if (config.mobile) {
    const mobileBlock = mobileBlocks[config.mobile];
    if (mobileBlock) blocks.push(mobileBlock);
  }
  if (config.database) {
    const dbBlock = databaseBlocks[config.database];
    if (dbBlock) blocks.push(dbBlock);
  }
  if (config.monorepo) {
    const monoBlock = monorepoBlocks[config.monorepo];
    if (monoBlock) blocks.push(monoBlock);
  }
  return blocks;
}
function composeOutput(blocks) {
  const filesToCopy = [];
  const cursorrulesFragments = [];
  const claudeFragments = [];
  for (const block of blocks) {
    const resolvedFiles = block.files.map((f) => ({
      ...f,
      src: path.isAbsolute(f.src) ? f.src : path.join(block.path, f.src)
    }));
    filesToCopy.push(...resolvedFiles);
    if (block.cursorrulesFragment) cursorrulesFragments.push(block.cursorrulesFragment);
    if (block.claudeFragment) claudeFragments.push(block.claudeFragment);
  }
  return { filesToCopy, cursorrulesFragments, claudeFragments };
}
function sharedBlock() {
  return {
    id: "_shared",
    label: "Shared (universal)",
    path: path.join(TEMPLATES_DIR, "blocks/_shared"),
    files: [
      { src: "roles/project-manager.md", dest: "agents/roles/project-manager.md" },
      { src: "roles/security-agent.md", dest: "agents/roles/security-agent.md" },
      { src: "workflows/init-session.md", dest: "agents/workflows/init-session.md" }
    ]
  };
}
var frontendBlocks = {
  angular: {
    id: "frontend/angular",
    label: "Angular 21",
    path: path.join(TEMPLATES_DIR, "blocks/frontend/angular"),
    files: [
      { src: "role.md", dest: "agents/roles/frontend-agent.md" },
      { src: "standards.md", dest: "docs/frontend-architecture-standards.md" },
      { src: "ui-ux.md", dest: "docs/frontend-ui-ux-guidelines.md" },
      { src: "workflows/new-component.md", dest: "agents/workflows/new-frontend-component.md" },
      { src: "workflows/new-feature.md", dest: "agents/workflows/new-frontend-feature.md" },
      { src: "workflows/new-module.md", dest: "agents/workflows/new-frontend-module.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/frontend/angular/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/frontend/angular/claude.fragment.ejs")
  },
  react: {
    id: "frontend/react",
    label: "React 19",
    path: path.join(TEMPLATES_DIR, "blocks/frontend/react"),
    files: [
      { src: "role.md", dest: "agents/roles/frontend-agent.md" },
      { src: "standards.md", dest: "docs/frontend-architecture-standards.md" },
      { src: "workflows/new-component.md", dest: "agents/workflows/new-frontend-component.md" },
      { src: "workflows/new-feature.md", dest: "agents/workflows/new-frontend-feature.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/frontend/react/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/frontend/react/claude.fragment.ejs")
  },
  nextjs: {
    id: "frontend/nextjs",
    label: "Next.js 14",
    path: path.join(TEMPLATES_DIR, "blocks/frontend/nextjs"),
    files: [
      { src: "role.md", dest: "agents/roles/frontend-agent.md" },
      { src: "standards.md", dest: "docs/frontend-architecture-standards.md" },
      { src: "workflows/new-component.md", dest: "agents/workflows/new-frontend-component.md" },
      { src: "workflows/new-feature.md", dest: "agents/workflows/new-frontend-feature.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/frontend/nextjs/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/frontend/nextjs/claude.fragment.ejs")
  },
  vue: {
    id: "frontend/vue",
    label: "Vue 3",
    path: path.join(TEMPLATES_DIR, "blocks/frontend/vue"),
    files: [
      { src: "role.md", dest: "agents/roles/frontend-agent.md" },
      { src: "standards.md", dest: "docs/frontend-architecture-standards.md" },
      { src: "workflows/new-component.md", dest: "agents/workflows/new-frontend-component.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/frontend/vue/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/frontend/vue/claude.fragment.ejs")
  },
  nuxt: {
    id: "frontend/nuxt",
    label: "Nuxt 3",
    path: path.join(TEMPLATES_DIR, "blocks/frontend/nuxt"),
    files: [
      { src: "role.md", dest: "agents/roles/frontend-agent.md" },
      { src: "standards.md", dest: "docs/frontend-architecture-standards.md" },
      { src: "workflows/new-component.md", dest: "agents/workflows/new-frontend-component.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/frontend/nuxt/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/frontend/nuxt/claude.fragment.ejs")
  }
};
var backendBlocks = {
  nestjs: {
    id: "backend/nestjs",
    label: "NestJS",
    path: path.join(TEMPLATES_DIR, "blocks/backend/nestjs"),
    files: [
      { src: "role.md", dest: "agents/roles/backend-agent.md" },
      { src: "standards.md", dest: "docs/nest-backend-general-standards.md" },
      { src: "workflows/new-module.md", dest: "agents/workflows/new-backend-module.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/backend/nestjs/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/backend/nestjs/claude.fragment.ejs")
  },
  express: {
    id: "backend/express",
    label: "Express",
    path: path.join(TEMPLATES_DIR, "blocks/backend/express"),
    files: [
      { src: "role.md", dest: "agents/roles/backend-agent.md" },
      { src: "standards.md", dest: "docs/express-backend-standards.md" },
      { src: "workflows/new-route.md", dest: "agents/workflows/new-backend-route.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/backend/express/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/backend/express/claude.fragment.ejs")
  },
  "nextjs-api": {
    id: "backend/nextjs-api",
    label: "Next.js API Routes",
    path: path.join(TEMPLATES_DIR, "blocks/backend/nextjs-api"),
    files: [
      { src: "role.md", dest: "agents/roles/backend-agent.md" },
      { src: "standards.md", dest: "docs/nextjs-api-standards.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/backend/nextjs-api/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/backend/nextjs-api/claude.fragment.ejs")
  }
};
var mobileBlocks = {
  ionic: {
    id: "mobile/ionic",
    label: "Ionic + Capacitor",
    path: path.join(TEMPLATES_DIR, "blocks/mobile/ionic"),
    files: [
      { src: "role.md", dest: "agents/roles/mobile-agent.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/mobile/ionic/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/mobile/ionic/claude.fragment.ejs")
  },
  "react-native": {
    id: "mobile/react-native",
    label: "React Native",
    path: path.join(TEMPLATES_DIR, "blocks/mobile/react-native"),
    files: [
      { src: "role.md", dest: "agents/roles/mobile-agent.md" }
    ],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/mobile/react-native/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/mobile/react-native/claude.fragment.ejs")
  }
};
var databaseBlocks = {
  postgresql: {
    id: "database/postgresql",
    label: "PostgreSQL",
    path: path.join(TEMPLATES_DIR, "blocks/database/postgresql"),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/database/postgresql/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/database/postgresql/claude.fragment.ejs")
  },
  mysql: {
    id: "database/mysql",
    label: "MySQL",
    path: path.join(TEMPLATES_DIR, "blocks/database/mysql"),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/database/mysql/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/database/mysql/claude.fragment.ejs")
  },
  mongodb: {
    id: "database/mongodb",
    label: "MongoDB",
    path: path.join(TEMPLATES_DIR, "blocks/database/mongodb"),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/database/mongodb/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/database/mongodb/claude.fragment.ejs")
  }
};
var monorepoBlocks = {
  nx: {
    id: "monorepo/nx",
    label: "Nx",
    path: path.join(TEMPLATES_DIR, "blocks/monorepo/nx"),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/monorepo/nx/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/monorepo/nx/claude.fragment.ejs")
  },
  turborepo: {
    id: "monorepo/turborepo",
    label: "Turborepo",
    path: path.join(TEMPLATES_DIR, "blocks/monorepo/turborepo"),
    files: [],
    cursorrulesFragment: path.join(TEMPLATES_DIR, "blocks/monorepo/turborepo/cursorrules.fragment.ejs"),
    claudeFragment: path.join(TEMPLATES_DIR, "blocks/monorepo/turborepo/claude.fragment.ejs")
  }
};

// src/generator/file-generator.ts
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import fse2 from "fs-extra";
import ejs from "ejs";
var __dirname3 = path2.dirname(fileURLToPath2(import.meta.url));
var _fromDist2 = path2.join(__dirname3, "../templates");
var _fromSrc2 = path2.join(__dirname3, "../../templates");
var TEMPLATES_DIR2 = fse2.existsSync(_fromDist2) ? _fromDist2 : _fromSrc2;
var PACKAGE_VERSION = "0.1.0";
async function generateFiles(config, targetDir, composed) {
  const result = { created: [], skipped: [], errors: [] };
  const vars = buildTemplateVars(config);
  await copyCoreFiles(targetDir, vars, result);
  for (const blockFile of composed.filesToCopy) {
    await copyBlockFile(blockFile, targetDir, vars, result);
  }
  if (config.aiTool === "cursor" || config.aiTool === "both") {
    await renderCursorrules(composed.cursorrulesFragments, targetDir, vars, result);
  }
  if (config.aiTool === "claude-code" || config.aiTool === "both") {
    await renderClaudeMd(composed.claudeFragments, targetDir, vars, result);
  }
  await writeDevkitConfig(config, composed, targetDir, result);
  return result;
}
async function copyCoreFiles(targetDir, vars, result) {
  const coreDir = path2.join(TEMPLATES_DIR2, "core");
  const coreFiles = await collectFiles(coreDir);
  for (const filePath of coreFiles) {
    const relativePath = path2.relative(coreDir, filePath);
    const destPath = path2.join(targetDir, relativePath);
    try {
      const finalDest = filePath.endsWith(".ejs") ? destPath.replace(/\.ejs$/, "") : destPath;
      const exists = await fse2.pathExists(finalDest);
      if (exists) {
        result.skipped.push(relativePath.replace(/\.ejs$/, ""));
        continue;
      }
      const content = await fse2.readFile(filePath, "utf-8");
      const rendered = filePath.endsWith(".ejs") ? ejs.render(content, vars) : content;
      await fse2.ensureDir(path2.dirname(finalDest));
      await fse2.writeFile(finalDest, rendered, "utf-8");
      result.created.push(relativePath.replace(/\.ejs$/, ""));
    } catch (err) {
      result.errors.push(`${relativePath}: ${err.message}`);
    }
  }
}
async function copyBlockFile(blockFile, targetDir, vars, result) {
  const srcPath = blockFile.src;
  const destPath = path2.join(targetDir, blockFile.dest);
  try {
    const exists = await fse2.pathExists(destPath);
    if (exists && blockFile.skipIfExists !== false) {
      result.skipped.push(blockFile.dest);
      return;
    }
    const content = await fse2.readFile(srcPath, "utf-8");
    const rendered = srcPath.endsWith(".ejs") ? ejs.render(content, vars) : content;
    await fse2.ensureDir(path2.dirname(destPath));
    await fse2.writeFile(destPath, rendered, "utf-8");
    result.created.push(blockFile.dest);
  } catch (err) {
    result.errors.push(`${blockFile.dest}: ${err.message}`);
  }
}
async function renderCursorrules(fragmentPaths, targetDir, vars, result) {
  const destPath = path2.join(targetDir, ".cursorrules");
  const exists = await fse2.pathExists(destPath);
  if (exists) {
    result.skipped.push(".cursorrules");
    return;
  }
  try {
    const headerTpl = await fse2.readFile(
      path2.join(TEMPLATES_DIR2, "scaffolds/cursorrules-header.ejs"),
      "utf-8"
    );
    const parts = [ejs.render(headerTpl, vars)];
    for (const fragPath of fragmentPaths) {
      const fragExists = await fse2.pathExists(fragPath);
      if (!fragExists) continue;
      const frag = await fse2.readFile(fragPath, "utf-8");
      parts.push(ejs.render(frag, vars));
    }
    const footerTpl = await fse2.readFile(
      path2.join(TEMPLATES_DIR2, "scaffolds/cursorrules-footer.ejs"),
      "utf-8"
    );
    parts.push(ejs.render(footerTpl, vars));
    await fse2.ensureDir(path2.dirname(destPath));
    await fse2.writeFile(destPath, parts.join("\n\n---\n\n"), "utf-8");
    result.created.push(".cursorrules");
  } catch (err) {
    result.errors.push(`.cursorrules: ${err.message}`);
  }
}
async function renderClaudeMd(fragmentPaths, targetDir, vars, result) {
  const destPath = path2.join(targetDir, "CLAUDE.md");
  const exists = await fse2.pathExists(destPath);
  if (exists) {
    result.skipped.push("CLAUDE.md");
    return;
  }
  try {
    const headerTpl = await fse2.readFile(
      path2.join(TEMPLATES_DIR2, "scaffolds/claude-header.ejs"),
      "utf-8"
    );
    const parts = [ejs.render(headerTpl, vars)];
    for (const fragPath of fragmentPaths) {
      const fragExists = await fse2.pathExists(fragPath);
      if (!fragExists) continue;
      const frag = await fse2.readFile(fragPath, "utf-8");
      parts.push(ejs.render(frag, vars));
    }
    const footerTpl = await fse2.readFile(
      path2.join(TEMPLATES_DIR2, "scaffolds/claude-footer.ejs"),
      "utf-8"
    );
    parts.push(ejs.render(footerTpl, vars));
    await fse2.ensureDir(path2.dirname(destPath));
    await fse2.writeFile(destPath, parts.join("\n\n"), "utf-8");
    result.created.push("CLAUDE.md");
  } catch (err) {
    result.errors.push(`CLAUDE.md: ${err.message}`);
  }
}
async function writeDevkitConfig(config, _composed, targetDir, result) {
  const destPath = path2.join(targetDir, "devkit.config.json");
  const blocks = [];
  if (config.frontend) blocks.push(config.frontend);
  if (config.backend) blocks.push(config.backend);
  if (config.mobile) blocks.push(config.mobile);
  if (config.database) blocks.push(config.database);
  if (config.monorepo) blocks.push(config.monorepo);
  const devkitConfig = {
    version: PACKAGE_VERSION,
    projectName: config.projectName,
    blocks,
    aiTool: config.aiTool,
    language: config.language,
    customized: [],
    installedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const exists = await fse2.pathExists(destPath);
  if (exists) {
    result.skipped.push("devkit.config.json");
    return;
  }
  await fse2.writeJson(destPath, devkitConfig, { spaces: 2 });
  result.created.push("devkit.config.json");
}
async function collectFiles(dir) {
  const entries = await fse2.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path2.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await collectFiles(fullPath);
      files.push(...nested);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

// src/commands/init.ts
async function initCommand(targetPath) {
  const targetDir = targetPath ? path3.resolve(process.cwd(), targetPath) : process.cwd();
  const dirName = path3.basename(targetDir);
  const dirExists = await fse3.pathExists(targetDir);
  const isEmpty = dirExists ? (await fse3.readdir(targetDir)).length === 0 : true;
  if (dirExists && !isEmpty) {
    const proceed = await p2.confirm({
      message: `${chalk2.yellow(dirName)} is not empty. Continue anyway?`,
      initialValue: false
    });
    if (!proceed || p2.isCancel(proceed)) {
      p2.cancel("Setup cancelled.");
      process.exit(0);
    }
  }
  const config = await runQuestions(dirName);
  await fse3.ensureDir(targetDir);
  const spinner = ora("Preparing templates...").start();
  const blocks = resolveBlocks(config);
  const composed = composeOutput(blocks);
  spinner.stop();
  const genSpinner = ora("Generating files...").start();
  const result = await generateFiles(config, targetDir, composed);
  genSpinner.stop();
  console.log("");
  if (result.errors.length === 0) {
    p2.outro(chalk2.green.bold("\u2713 Done!"));
  } else {
    p2.outro(chalk2.yellow.bold("\u26A0 Done with some issues"));
  }
  if (result.created.length > 0) {
    console.log(chalk2.green("  Created:"));
    for (const f of result.created) {
      console.log(chalk2.green(`    \u2713  ${f}`));
    }
  }
  if (result.skipped.length > 0) {
    console.log(chalk2.gray("  Skipped (already exist):"));
    for (const f of result.skipped) {
      console.log(chalk2.gray(`    \u2500  ${f}`));
    }
  }
  if (result.errors.length > 0) {
    console.log(chalk2.red("  Errors:"));
    for (const e of result.errors) {
      console.log(chalk2.red(`    \u2717  ${e}`));
    }
  }
  console.log("");
  console.log(chalk2.cyan("  Next steps:"));
  console.log(chalk2.white(`    1. Read ${chalk2.bold("CLAUDE.md")} to understand the agent system`));
  console.log(chalk2.white(`    2. Check ${chalk2.bold("agents/contexts/session-state.md")} to track project state`));
  console.log(chalk2.white(`    3. Use ${chalk2.bold("@pm")} alias to coordinate your first feature`));
  console.log("");
}

// src/commands/update.ts
import path4 from "path";
import * as p3 from "@clack/prompts";
import chalk3 from "chalk";
import ora2 from "ora";
import fse4 from "fs-extra";
async function updateCommand(targetPath) {
  const targetDir = targetPath ? path4.resolve(process.cwd(), targetPath) : process.cwd();
  const configPath = path4.join(targetDir, "devkit.config.json");
  const exists = await fse4.pathExists(configPath);
  if (!exists) {
    console.log(chalk3.red("  \u2717 devkit.config.json not found."));
    console.log(chalk3.gray("    Run 007devkit init first."));
    process.exit(1);
  }
  const devkitConfig = await fse4.readJson(configPath);
  console.log("");
  console.log(chalk3.bold.cyan(" 007devkit ") + chalk3.gray("\u2014 Update"));
  console.log(chalk3.gray(`  Project: ${devkitConfig.projectName}`));
  console.log(chalk3.gray(`  Installed: ${devkitConfig.installedAt}`));
  console.log(chalk3.gray(`  Blocks: ${devkitConfig.blocks.join(", ")}`));
  console.log("");
  const filesToUpdate = await p3.multiselect({
    message: "Which core files should be updated to latest?",
    options: [
      { value: "core-agents", label: "agents/prompts/ + agents/contexts/", hint: "Recommended" },
      { value: "core-workflows", label: "agents/workflows/ (debug, tests, review)", hint: "Recommended" },
      { value: "core-aim", label: "docs/aim-methodology.md", hint: "Universal methodology" },
      { value: "cursorrules", label: ".cursorrules", hint: "Stack rules" },
      { value: "claude-md", label: "CLAUDE.md", hint: "Agent instructions" }
    ],
    required: false
  });
  if (p3.isCancel(filesToUpdate) || filesToUpdate.length === 0) {
    p3.cancel("Nothing to update.");
    return;
  }
  const confirm3 = await p3.confirm({
    message: `Update ${filesToUpdate.length} file group(s)? Customized files will be skipped.`
  });
  if (!confirm3 || p3.isCancel(confirm3)) {
    p3.cancel("Update cancelled.");
    return;
  }
  const config = rebuildConfig(devkitConfig);
  const blocks = resolveBlocks(config);
  const composed = composeOutput(blocks);
  const spinner = ora2("Updating files...").start();
  const result = await generateFiles(config, targetDir, composed);
  spinner.stop();
  console.log("");
  if (result.errors.length === 0) {
    p3.outro(chalk3.green.bold("\u2713 Update complete!"));
  } else {
    p3.outro(chalk3.yellow.bold("\u26A0 Update complete with some issues"));
  }
  for (const f of result.created) {
    console.log(chalk3.green(`  \u2713  ${f}`));
  }
  for (const f of result.skipped) {
    console.log(chalk3.gray(`  \u2500  ${f} (skipped)`));
  }
  for (const e of result.errors) {
    console.log(chalk3.red(`  \u2717  ${e}`));
  }
  console.log("");
}
function rebuildConfig(stored) {
  return {
    projectName: stored.projectName,
    frontend: stored.blocks.find((b) => ["angular", "react", "nextjs", "vue", "nuxt"].includes(b)) ?? null,
    backend: stored.blocks.find((b) => ["nestjs", "express", "nextjs-api"].includes(b)) ?? null,
    mobile: stored.blocks.find((b) => ["ionic", "react-native"].includes(b)) ?? null,
    database: stored.blocks.find((b) => ["postgresql", "mysql", "mongodb"].includes(b)) ?? null,
    monorepo: stored.blocks.find((b) => ["nx", "turborepo"].includes(b)) ?? null,
    aiTool: stored.aiTool,
    language: stored.language
  };
}

// src/cli.ts
var program = new Command();
program.name("007devkit").description("Scaffold your TypeScript project with AI agents, AIM methodology and coding standards.").version("0.1.0", "-v, --version", "Output the current version");
program.command("init [directory]").alias("i").description("Initialize a new AI dev environment in the current or specified directory").action(async (directory) => {
  await initCommand(directory);
});
program.command("update [directory]").alias("u").description("Update templates to the latest version without overwriting customizations").action(async (directory) => {
  await updateCommand(directory);
});
program.action(async () => {
  await initCommand();
});
program.parse(process.argv);
