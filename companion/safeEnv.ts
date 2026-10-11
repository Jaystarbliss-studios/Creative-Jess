const ALLOWED_CHILD_ENV = [
  'PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'USERPROFILE', 'HOME',
  'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA', 'COMSPEC', 'PATHEXT', 'LANG', 'LC_ALL',
  'DISPLAY', 'WAYLAND_DISPLAY', 'XDG_RUNTIME_DIR', 'XDG_DATA_HOME', 'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME', 'DBUS_SESSION_BUS_ADDRESS', 'GDK_BACKEND', 'QT_PLUGIN_PATH',
];

export function safeChildEnvironment(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {};
  for (const key of ALLOWED_CHILD_ENV) {
    const value = source[key];
    if (typeof value === 'string') result[key] = value;
  }
  return result;
}
