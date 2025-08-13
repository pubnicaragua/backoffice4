import { app, BrowserWindow, Menu, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    // Crear la ventana principal  
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js'),
            webSecurity: true
        },
        icon: path.join(__dirname, '../../public/icon.png'),
        show: false,
        titleBarStyle: 'default'
    });

    // Cargar la aplicación React  
    const startUrl = isDev
        ? 'http://localhost:5173' // Vite dev server  
        : `file://${path.join(__dirname, '../../dist/index.html')}`;

    mainWindow.loadURL(startUrl);

    // Mostrar ventana cuando esté lista  
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();

        if (isDev) {
            mainWindow.webContents.openDevTools();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Prevenir navegación externa  
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);

        if (parsedUrl.origin !== 'http://localhost:5173' && !navigationUrl.startsWith('file://')) {
            event.preventDefault();
        }
    });
}

// Configurar menú de aplicación  
function createMenu() {
    const template = [
        {
            label: 'Archivo',
            submenu: [
                {
                    label: 'Exportar Datos',
                    accelerator: 'CmdOrCtrl+E',
                    click: () => {
                        mainWindow.webContents.send('export-data');
                    }
                },
                { type: 'separator' },
                { role: 'quit', label: 'Salir' }
            ]
        },
        {
            label: 'Editar',
            submenu: [
                { role: 'undo', label: 'Deshacer' },
                { role: 'redo', label: 'Rehacer' },
                { type: 'separator' },
                { role: 'cut', label: 'Cortar' },
                { role: 'copy', label: 'Copiar' },
                { role: 'paste', label: 'Pegar' }
            ]
        },
        {
            label: 'Ver',
            submenu: [
                { role: 'reload', label: 'Recargar' },
                { role: 'forceReload', label: 'Forzar Recarga' },
                { role: 'toggleDevTools', label: 'Herramientas de Desarrollador' },
                { type: 'separator' },
                { role: 'resetZoom', label: 'Zoom Normal' },
                { role: 'zoomIn', label: 'Acercar' },
                { role: 'zoomOut', label: 'Alejar' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'Pantalla Completa' }
            ]
        },
        {
            label: 'Ventana',
            submenu: [
                { role: 'minimize', label: 'Minimizar' },
                { role: 'close', label: 'Cerrar' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// Eventos de la aplicación  
app.whenReady().then(() => {
    createWindow();
    createMenu();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers específicos para tu aplicación  
ipcMain.handle('show-save-dialog', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Guardar archivo',
        defaultPath: options.defaultPath || 'reporte.csv',
        filters: [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'Excel Files', extensions: ['xlsx'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Seleccionar archivo',
        properties: ['openFile'],
        filters: [
            { name: 'CSV Files', extensions: ['csv'] },
            { name: 'XML Files', extensions: ['xml'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    return result;
});

// Manejo de errores no capturadas  
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});