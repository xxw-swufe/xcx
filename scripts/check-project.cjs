const fs = require('fs');
const path = require('path');
const { TextDecoder } = require('util');

const rootDir = process.cwd();
const pagesJsonPath = path.join(rootDir, 'pages.json');
const manifestPath = path.join(rootDir, 'manifest.json');
const generatedAppJsonPath = path.join(rootDir, 'unpackage', 'dist', 'dev', 'mp-weixin', 'app.json');

const ignoredDirs = new Set([
  '.git',
  '.hbuilderx',
  'node_modules',
  'uni_modules',
  'unpackage'
]);

const customTextExtensions = new Set(['.vue', '.js', '.json', '.md', '.scss', '.html']);
const routeRefPattern = /(?<![A-Za-z0-9_-])\/(?:pages|uni_modules\/uni-id-pages\/pages)\/[A-Za-z0-9_./-]+/g;
const hardMojibakePattern = /�|锟/;
const softMojibakeChars = new Set(['鍙', '鎴', '浼', '閫', '闂', '璇', '璁', '绠', '姝', '寰', '纭', '鍒', '璐', '鏀', '']);

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
const errors = [];
const warnings = [];

function normalizeSlashes(value) {
  return value.replace(/\\/g, '/');
}

function toRelative(absPath) {
  return normalizeSlashes(path.relative(rootDir, absPath));
}

function hasUtf8Bom(buffer) {
  return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
}

function readUtf8File(absPath) {
  const buffer = fs.readFileSync(absPath);
  const bom = hasUtf8Bom(buffer);
  const contentBuffer = bom ? buffer.subarray(3) : buffer;
  try {
    const text = utf8Decoder.decode(contentBuffer);
    return { text, bom };
  } catch (error) {
    errors.push(`无效 UTF-8: ${toRelative(absPath)}`);
    return null;
  }
}

function loadJson(absPath) {
  const file = readUtf8File(absPath);
  if (!file) return null;

  if (file.bom) {
    warnings.push(`发现 UTF-8 BOM: ${toRelative(absPath)}`);
  }

  try {
    return JSON.parse(file.text);
  } catch (error) {
    errors.push(`JSON 解析失败: ${toRelative(absPath)}`);
    return null;
  }
}

function walkFiles(dirPath, collected = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.editorconfig') {
      if (entry.isDirectory()) continue;
    }

    const absPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) continue;
      walkFiles(absPath, collected);
      continue;
    }

    if (customTextExtensions.has(path.extname(entry.name).toLowerCase())) {
      collected.push(absPath);
    }
  }

  return collected;
}

function collectActualPages() {
  const pagesDir = path.join(rootDir, 'pages');
  const actualPages = new Set();

  function walkPageDir(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walkPageDir(absPath);
        continue;
      }

      if (path.extname(entry.name).toLowerCase() !== '.vue') continue;
      const relPath = normalizeSlashes(path.relative(rootDir, absPath)).replace(/\.vue$/i, '');
      actualPages.add(relPath);
    }
  }

  walkPageDir(pagesDir);
  return actualPages;
}

function countSoftMojibakeChars(line) {
  let count = 0;
  for (const char of line) {
    if (softMojibakeChars.has(char)) count += 1;
  }
  return count;
}

function scanTextFiles(files) {
  for (const absPath of files) {
    const file = readUtf8File(absPath);
    if (!file) continue;

    if (file.bom) {
      warnings.push(`发现 UTF-8 BOM: ${toRelative(absPath)}`);
    }

    const lines = file.text.split(/\r\n|\n|\r/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (hardMojibakePattern.test(line) || countSoftMojibakeChars(line) >= 3) {
        warnings.push(`疑似乱码: ${toRelative(absPath)}:${index + 1} -> ${line.trim().slice(0, 80)}`);
      }
    }
  }
}

function validateRoutes(pagesJson, actualPages, files) {
  const registeredPages = new Set(
    (pagesJson.pages || [])
      .map((entry) => entry.path)
      .filter((pagePath) => typeof pagePath === 'string')
  );

  const appPages = [...registeredPages].filter((pagePath) => pagePath.startsWith('pages/'));
  const actualAppPages = [...actualPages];

  for (const pagePath of appPages) {
    if (!actualPages.has(pagePath)) {
      errors.push(`pages.json 已注册但文件不存在: ${pagePath}`);
    }
  }

  for (const pagePath of actualAppPages) {
    if (!registeredPages.has(pagePath)) {
      errors.push(`页面文件存在但 pages.json 未注册: ${pagePath}`);
    }
  }

  const tabBarList = (((pagesJson.tabBar || {}).list) || []);
  for (const item of tabBarList) {
    if (!registeredPages.has(item.pagePath)) {
      errors.push(`tabBar 页面未注册: ${item.pagePath}`);
    }
    if (item.pagePath.startsWith('pages/') && !actualPages.has(item.pagePath)) {
      errors.push(`tabBar 页面文件不存在: ${item.pagePath}`);
    }
  }

  for (const absPath of files) {
    const file = readUtf8File(absPath);
    if (!file) continue;

    const matches = file.text.match(routeRefPattern) || [];
    for (const route of matches) {
      const normalizedRoute = route.replace(/^\//, '');
      if (normalizedRoute.startsWith('pages/')) {
        if (!registeredPages.has(normalizedRoute)) {
          errors.push(`代码引用了未注册页面: ${normalizedRoute} (${toRelative(absPath)})`);
        } else if (!actualPages.has(normalizedRoute)) {
          errors.push(`代码引用了不存在页面文件: ${normalizedRoute} (${toRelative(absPath)})`);
        }
      } else {
        const modulePageFile = path.join(rootDir, `${normalizedRoute}.vue`);
        if (!fs.existsSync(modulePageFile)) {
          errors.push(`代码引用了不存在模块页面: ${normalizedRoute} (${toRelative(absPath)})`);
        }
      }
    }
  }

  return registeredPages;
}

function compareArrays(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

function validateGeneratedAppJson(pagesJson, manifestJson) {
  if (!fs.existsSync(generatedAppJsonPath)) return;

  const generatedAppJson = loadJson(generatedAppJsonPath);
  if (!generatedAppJson) return;

  const sourcePages = (pagesJson.pages || []).map((entry) => entry.path);
  const builtPages = generatedAppJson.pages || [];
  if (!compareArrays(sourcePages, builtPages)) {
    warnings.push('生成的 unpackage/dist/dev/mp-weixin/app.json 与 pages.json 页面列表不一致');
  }

  const sourceTabBar = (((pagesJson.tabBar || {}).list) || []).map((item) => ({
    pagePath: item.pagePath,
    text: item.text,
    iconPath: item.iconPath,
    selectedIconPath: item.selectedIconPath
  }));
  const builtTabBar = (((generatedAppJson.tabBar || {}).list) || []).map((item) => ({
    pagePath: item.pagePath,
    text: item.text,
    iconPath: item.iconPath,
    selectedIconPath: item.selectedIconPath
  }));

  if (JSON.stringify(sourceTabBar) !== JSON.stringify(builtTabBar)) {
    warnings.push('生成的 unpackage/dist/dev/mp-weixin/app.json 与 pages.json 的 tabBar 配置不一致');
  }

  const sourcePermissionDesc =
    ((((manifestJson['mp-weixin'] || {}).permission || {})['scope.userLocation'] || {}).desc) || '';
  const builtPermissionDesc =
    ((((generatedAppJson.permission || {})['scope.userLocation']) || {}).desc) || '';

  if (sourcePermissionDesc && builtPermissionDesc && sourcePermissionDesc !== builtPermissionDesc) {
    warnings.push('生成的 unpackage/dist/dev/mp-weixin/app.json 与 manifest.json 的定位权限文案不一致');
  }
}

function printIssues(label, items) {
  if (!items.length) return;
  console.log(`${label}:`);
  for (const item of items) {
    console.log(`- ${item}`);
  }
}

function main() {
  const customFiles = walkFiles(rootDir);
  const pagesJson = loadJson(pagesJsonPath);
  const manifestJson = loadJson(manifestPath);
  if (!pagesJson || !manifestJson) {
    process.exitCode = 1;
    return;
  }

  const actualPages = collectActualPages();
  validateRoutes(pagesJson, actualPages, customFiles);
  scanTextFiles(customFiles);
  validateGeneratedAppJson(pagesJson, manifestJson);

  printIssues('Warnings', warnings);
  printIssues('Errors', errors);

  if (errors.length) {
    console.log(`\n项目巡检失败: ${errors.length} 个错误，${warnings.length} 个警告`);
    process.exitCode = 1;
    return;
  }

  if (warnings.length) {
    console.log(`\n项目巡检通过: 0 个错误，${warnings.length} 个警告`);
    return;
  }

  console.log('项目巡检通过: 编码、页面注册、路由引用、生成 app.json 均正常');
}

main();
