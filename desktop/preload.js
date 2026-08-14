const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('pacecoachConfig', {
  get: () => ipcRenderer.invoke('config:get'),
  save: (cfg) => ipcRenderer.invoke('config:save', cfg),
  ready: () => ipcRenderer.send('config:ready'),
})
