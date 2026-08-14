const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('paceonConfig', {
  get: () => ipcRenderer.invoke('config:get'),
  save: (cfg) => ipcRenderer.invoke('config:save', cfg),
  ready: () => ipcRenderer.send('config:ready'),
})

contextBridge.exposeInMainWorld('paceonDsbridge', {
  status: (port) => ipcRenderer.invoke('dsbridge:status', port),
  start: () => ipcRenderer.invoke('dsbridge:start'),
  stop: () => ipcRenderer.invoke('dsbridge:stop'),
  syncConfig: () => ipcRenderer.invoke('dsbridge:config'),
})
