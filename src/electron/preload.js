import { contextBridge, ipcRenderer } from 'electron';

// Exponer APIs seguras al proceso renderer  
contextBridge.exposeInMainWorld('electronAPI', {
    // Diálogos de archivo  
    showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

    // Manejo de archivos específico para tu aplicación  
    processFile: (filePath) => ipcRenderer.invoke('process-file', filePath),

    // Exportación de reportes  
    exportData: (data, format) => ipcRenderer.invoke('export-data', data, format),

    // Eventos del menú  
    onExportData: (callback) => {
        ipcRenderer.on('export-data', callback);
        return () => ipcRenderer.removeListener('export-data', callback);
    },

    // Información del sistema  
    platform: process.platform,
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron
    },

    // Utilidades para archivos CSV/XML que tu aplicación procesa  
    fileOperations: {
        readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
        writeFile: (filePath, data) => ipcRenderer.invoke('write-file', filePath, data),
        selectFiles: (filters) => ipcRenderer.invoke('select-files', filters)
    },

    // Específico para archivos CAF del SII  
    siiOperations: {
        processCafFile: (filePath) => ipcRenderer.invoke('process-caf-file', filePath),
        validateXmlDte: (xmlContent) => ipcRenderer.invoke('validate-xml-dte', xmlContent)
    },

    // Notificaciones del sistema  
    showNotification: (title, body) => ipcRenderer.invoke('show-notification', { title, body }),

    // Configuración de la aplicación  
    config: {
        get: (key) => ipcRenderer.invoke('config-get', key),
        set: (key, value) => ipcRenderer.invoke('config-set', key, value)
    }
});

// Prevenir acceso directo a Node.js APIs  
delete window.require;
delete window.exports;
delete window.module;