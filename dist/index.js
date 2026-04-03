// src/generator/file-generator.ts
import path2 from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import fse2 from "fs-extra";
import ejs from "ejs";

// src/composer/template-composer.ts
import path from "path";
import { fileURLToPath } from "url";
import fse from "fs-extra";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var _fromDist = path.join(__dirname, "../templates");
var _fromSrc = path.join(__dirname, "../../templates");
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
var __dirname2 = path2.dirname(fileURLToPath2(import.meta.url));
var _fromDist2 = path2.join(__dirname2, "../templates");
var _fromSrc2 = path2.join(__dirname2, "../../templates");
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
export {
  buildTemplateVars,
  composeOutput,
  generateFiles,
  resolveBlocks
};
