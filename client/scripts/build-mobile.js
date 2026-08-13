const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const clientDir = path.resolve(__dirname, '..');
const apiDir = path.join(clientDir, 'app', 'api');
const tempApiDir = path.join(clientDir, 'api_disabled_temp');

let movedApiDir = false;

try {
  if (fs.existsSync(apiDir)) {
    console.log('[build:mobile] Temporarily moving app/api -> api_disabled_temp to allow static export...');
    fs.renameSync(apiDir, tempApiDir);
    movedApiDir = true;
  }

  console.log('[build:mobile] Running Next.js static export build (BUILD_TARGET=mobile)...');
  const result = spawnSync('npx', ['next', 'build'], {
    cwd: clientDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      BUILD_TARGET: 'mobile',
      NEXT_PUBLIC_BUILD_TARGET: 'mobile',
    },
  });

  if (result.status !== 0) {
    throw new Error(`[build:mobile] Build failed with exit code ${result.status}`);
  }
  console.log('[build:mobile] Static export build completed successfully!');
} finally {
  if (movedApiDir && fs.existsSync(tempApiDir)) {
    console.log('[build:mobile] Restoring api_disabled_temp -> app/api...');
    fs.renameSync(tempApiDir, apiDir);
    console.log('[build:mobile] app/api restored.');
  }
}
