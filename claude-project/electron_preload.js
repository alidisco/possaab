// Electron Preload Script - Secure IPC Bridge
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations via IPC
  invoke: (channel, ...args) => {
    const validChannels = [
      'db:query',
      'db:execute',
      'backup:create',
      'backup:restore',
      'backup:list',
      'printer:print',
      'printer:list',
      'app:getPath',
      'settings:get',
      'settings:set',
    ];
    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args);
    }
    throw new Error(`Invalid IPC channel: ${channel}`);
  },
  // Listen for events from main process
  on: (channel, callback) => {
    const validChannels = ['backup:status', 'update:available'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
});
