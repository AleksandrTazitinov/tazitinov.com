#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const ORG_SCOPE = '@tazitinov';
const PROJECT_NAME = 'personal-portal';

const PRESETS = {
  'next-app': { generator: '@nx/next:application', kind: 'app' },
  'next-lib': { generator: '@nx/next:library', kind: 'lib' },
  'angular-app': { generator: '@nx/angular:application', kind: 'app' },
  'angular-lib': { generator: '@nx/angular:library', kind: 'lib' },
  'nest-app': { generator: '@nx/nest:application', kind: 'app' },
  'node-app': { generator: '@nx/node:application', kind: 'app' },
  'js-lib': { generator: '@nx/js:library', kind: 'lib' },
  'node-lib': { generator: '@nx/node:library', kind: 'lib' },
  'nest-lib': { generator: '@nx/nest:library', kind: 'lib' },
  package: { generator: '@nx/js:library', kind: 'package', defaults: ['--publishable'] },
};

function printHelp() {
  console.log(`Usage:
  pnpm gen <preset> <directory> [nx generator options]

Presets:
  next-app   -> @nx/next:application
  next-lib   -> @nx/next:library
  angular-app -> @nx/angular:application
  angular-lib -> @nx/angular:library
  nest-app   -> @nx/nest:application
  node-app   -> @nx/node:application
  js-lib     -> @nx/js:library
  node-lib   -> @nx/node:library
  nest-lib   -> @nx/nest:library
  package    -> @nx/js:library --publishable

Naming:
  scope: ${ORG_SCOPE}
  project prefix: ${PROJECT_NAME}
  generated package/import path: ${ORG_SCOPE}/${PROJECT_NAME}-<name>

Examples:
  pnpm gen next-app apps/web
  pnpm gen angular-app apps/dashboard
  pnpm gen nest-app apps/auth
  pnpm gen node-lib packages/data --publishable
  pnpm gen package packages/sdk
`);
}

function normalizeInput(input) {
  return input.replace(/\\/g, '/').replace(/\/+$/, '');
}

function getLeafName(directory) {
  const normalized = normalizeInput(directory);
  const parts = normalized.split('/').filter(Boolean);
  const leaf = parts.at(-1);

  if (!leaf) {
    throw new Error('Directory argument must not be empty.');
  }

  return leaf;
}

function getPackageName(directory) {
  return `${PROJECT_NAME}-${getLeafName(directory)}`;
}

function getScopedName(directory) {
  return `${ORG_SCOPE}/${getPackageName(directory)}`;
}

function hasOption(args, optionName) {
  return args.some((arg) => arg === optionName || arg.startsWith(`${optionName}=`));
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || hasOption(args, '--help') || hasOption(args, '-h')) {
    printHelp();
    process.exit(0);
  }

  const [presetName, directory, ...rest] = args;
  const preset = PRESETS[presetName];

  if (!preset) {
    console.error(`Unknown preset "${presetName}".`);
    printHelp();
    process.exit(1);
  }

  if (!directory || directory.startsWith('-')) {
    console.error('A target directory is required.');
    printHelp();
    process.exit(1);
  }

  const scopedName = getScopedName(directory);
  const nxArgs = ['nx', 'g', preset.generator, directory];

  if (preset.defaults) {
    nxArgs.push(...preset.defaults);
  }

  if (!hasOption(rest, '--name')) {
    nxArgs.push(`--name=${scopedName}`);
  }

  if ((preset.kind === 'lib' || preset.kind === 'package') && !hasOption(rest, '--importPath')) {
    nxArgs.push(`--importPath=${scopedName}`);
  }

  nxArgs.push(...rest);

  const result = spawnSync('pnpm', nxArgs, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

main();
