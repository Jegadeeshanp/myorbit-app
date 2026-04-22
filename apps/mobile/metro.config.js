const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot  = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch the shared packages so Metro picks up changes
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both mobile and repo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot,   'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
