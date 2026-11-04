const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const fs = require('node:fs');
const path = require('node:path');

function exposeWindowsWatchman() {
  if (process.platform !== 'win32') {
    return;
  }

  const pathEntries = (process.env.PATH || '').split(path.delimiter);
  if (
    pathEntries.some((entry) =>
      fs.existsSync(path.join(entry, 'watchman.exe')),
    )
  ) {
    return;
  }

  const candidateDirectories = [];
  const wingetPackages = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft',
    'WinGet',
    'Packages',
  );

  try {
    for (const packageEntry of fs.readdirSync(wingetPackages, {
      withFileTypes: true,
    })) {
      if (
        !packageEntry.isDirectory() ||
        !packageEntry.name.toLowerCase().startsWith('facebook.watchman_')
      ) {
        continue;
      }

      const packageDirectory = path.join(wingetPackages, packageEntry.name);
      for (const releaseEntry of fs.readdirSync(packageDirectory, {
        withFileTypes: true,
      })) {
        if (
          releaseEntry.isDirectory() &&
          releaseEntry.name.toLowerCase().startsWith('watchman-v') &&
          releaseEntry.name.toLowerCase().endsWith('-windows')
        ) {
          candidateDirectories.push(
            path.join(packageDirectory, releaseEntry.name, 'bin'),
          );
        }
      }
    }
  } catch {
    // Watchman may be installed outside WinGet; check Chocolatey's standard path too.
  }

  candidateDirectories.push(
    path.join(process.env.ProgramData || 'C:\\ProgramData', 'chocolatey', 'bin'),
  );

  const watchmanDirectory = candidateDirectories.find((directory) =>
    fs.existsSync(path.join(directory, 'watchman.exe')),
  );

  if (watchmanDirectory) {
    process.env.PATH = [watchmanDirectory, process.env.PATH || '']
      .filter(Boolean)
      .join(path.delimiter);
  }
}

exposeWindowsWatchman();

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    useWatchman: true,
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
