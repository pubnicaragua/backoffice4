import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    // Crear la ventana principal  
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'icon.png'), // Opcional  
        show: false
    });

    // Cargar la aplicación React  
    const startUrl = isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`;

    mainWindow.loadURL(startUrl);

    // Mostrar ventana cuando esté lista  
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Abrir DevTools en desarrollo  
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Eventos de la aplicación  
app.whenReady().then(createWindow);

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

// Configurar menú personalizado  
const template = [
    {
        label: 'Archivo',
        submenu: [
            { role: 'quit', label: 'Salir' }
        ]
    },
    {
        label: 'Ver',
        submenu: [
            { role: 'reload', label: 'Recargar' },
            { role: 'toggledevtools', label: 'Herramientas de Desarrollador' }
        ]
    }
];

app.whenReady().then(() => {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
});