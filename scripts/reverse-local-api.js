const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function getAdbCommand() {
  const localPropertiesPath = path.join(__dirname, '..', 'android', 'local.properties');
  let sdkDirectory = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;

  if (!sdkDirectory && fs.existsSync(localPropertiesPath)) {
    const localProperties = fs.readFileSync(localPropertiesPath, 'utf8');
    const sdkMatch = localProperties.match(/^sdk\.dir\s*=\s*(.+)$/m);
    sdkDirectory = sdkMatch?.[1]
      .trim()
      .replace(/\\:/g, ':')
      .replace(/\\\\/g, '\\');
  }

  if (sdkDirectory) {
    const adbPath = path.join(
      sdkDirectory,
      'platform-tools',
      process.platform === 'win32' ? 'adb.exe' : 'adb',
    );
    if (fs.existsSync(adbPath)) return adbPath;
  }

  return process.platform === 'win32' ? 'adb.exe' : 'adb';
}

const adb = getAdbCommand();
const devicesResult = spawnSync(adb, ['devices'], {
  encoding: 'utf8',
  windowsHide: true,
});

if (devicesResult.error || devicesResult.status !== 0) {
  console.warn(
    'Could not check Android devices for API forwarding. If the app cannot reach localhost:5000, connect the device with ADB and run: adb reverse tcp:5000 tcp:5000',
  );
  process.exit(0);
}

const devices = devicesResult.stdout
  .split(/\r?\n/)
  .slice(1)
  .map(line => line.trim().split(/\s+/))
  .filter(([serial, state]) => serial && state === 'device')
  .map(([serial]) => serial);

if (devices.length === 0) {
  console.warn(
    'No Android device is connected for API forwarding. Connect it with ADB and run: adb reverse tcp:5000 tcp:5000',
  );
  process.exit(0);
}

const failedDevices = [];

for (const serial of devices) {
  const result = spawnSync(
    adb,
    ['-s', serial, 'reverse', 'tcp:5000', 'tcp:5000'],
    { stdio: 'ignore', windowsHide: true },
  );

  if (result.error || result.status !== 0) {
    failedDevices.push(serial);
  }
}

if (failedDevices.length > 0) {
  console.warn(
    `Could not set up API forwarding for ${failedDevices.join(', ')}. Run: adb reverse tcp:5000 tcp:5000`,
  );
} else {
  console.log(`Android API forwarding ready on ${devices.length} device(s): localhost:5000 → computer:5000`);
}
