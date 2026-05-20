const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot   = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the shared packages so Metro picks up changes
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both mobile and repo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot,   'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Explicitly map workspace packages so Metro doesn't rely on symlink resolution.
// On Windows, npm stores file: references as text-file redirectors that Metro
// cannot follow — this bypasses that entirely.
config.resolver.extraNodeModules = {
  '@myorbit/api':        path.resolve(workspaceRoot, 'packages/api'),
  '@myorbit/config':     path.resolve(workspaceRoot, 'packages/config'),
  '@myorbit/utils':      path.resolve(workspaceRoot, 'packages/utils'),
  '@myorbit/validation': path.resolve(workspaceRoot, 'packages/validation'),
};

module.exports = config;
