/**
 * 构建 Capgo OTA 更新包：dist/updates/bundle.zip + manifest.json
 * 用法：npm run build && node scripts/build-update-bundle.mjs
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(root, 'dist');
const updatesDir = path.join(distDir, 'updates');
const bundlePath = path.join(updatesDir, 'bundle.zip');
const manifestPath = path.join(updatesDir, 'manifest.json');

if (!fs.existsSync(distDir)) {
  console.error('请先运行 npm run build 生成 dist/');
  process.exit(1);
}

fs.mkdirSync(updatesDir, { recursive: true });

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const version = pkg.version;

execSync(
  `npx capgo bundle zip --path "${distDir}" --name bundle --bundle "${version}" --no-code-check`,
  { cwd: root, stdio: 'inherit' },
);

const generatedCandidates = [
  path.join(root, 'bundle'),
  path.join(root, 'bundle.zip'),
  path.join(updatesDir, 'bundle.zip'),
];
const generated = generatedCandidates.find((p) => fs.existsSync(p));
if (!generated) {
  console.error('Capgo 未生成 bundle 文件');
  process.exit(1);
}
const bundleFile = path.join(updatesDir, 'bundle.zip');
if (generated !== bundleFile) {
  fs.copyFileSync(generated, bundleFile);
  if (generated === path.join(root, 'bundle') || generated === path.join(root, 'bundle.zip')) {
    fs.unlinkSync(generated);
  }
}

const baseUrl =
  process.env.VITE_PAGES_BASE_URL ?? 'https://baichijun.github.io/airplane-survivor';

const checksum = createHash('sha256')
  .update(fs.readFileSync(bundleFile))
  .digest('hex');

const manifest = {
  version,
  url: `${baseUrl.replace(/\/$/, '')}/updates/bundle.zip`,
  checksum,
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`已生成 OTA 包：${bundleFile}`);
console.log(`已生成清单：${manifestPath}`);
console.log(manifest);
