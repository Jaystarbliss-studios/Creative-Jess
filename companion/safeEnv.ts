const ALLOWED_CHILD_ENV = [
  'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'USERPROFILE', 'HOME', 'HOMEDRIVE', 'HOMEPATH', 'PUBLIC',
  'APPDATA', 'LOCALAPPDATA', 'PROGRAMDATA', 'COMSPEC', 'PATHEXT', 'LANG', 'LC_ALL',
  'DISPLAY', 'WAYLAND_DISPLAY', 'XDG_RUNTIME_DIR', 'XDG_DATA_HOME', 'XDG_CONFIG_HOME',
  'XDG_CACHE_HOME', 'DBUS_SESSION_BUS_ADDRESS', 'GDK_BACKEND', 'QT_PLUGIN_PATH',
];

export function safeChildEnvironment(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  const result: NodeJS.ProcessEnv = {};
  const pathValue = source.Path || source.PATH;
  if (typeof pathValue === 'string') result[process.platform === 'win32' ? 'Path' : 'PATH'] = pathValue;
  for (const key of ALLOWED_CHILD_ENV) {
    const value = source[key];
    if (typeof value === 'string') result[key] = value;
  }
  return result;
}
