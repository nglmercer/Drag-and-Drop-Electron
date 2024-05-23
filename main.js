// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fileHandler = require('./fileHandler');

const store = new Store();
const defaultIconPath = path.join(__dirname, 'default-icon.png');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle("add-file-path", async (_, fileParams) => {
    const { fileToAdd, fileName } = fileParams;

    try {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Guardar archivo',
            defaultPath: fileName
        });

        if (!canceled) {
            const savedFilePath = fileHandler.addOrReplaceFile(fileToAdd, fileName, path.dirname(filePath));
            console.log(`El archivo "${fileName}" se ha agregado o reemplazado correctamente.`);
            return { success: true, filePath: savedFilePath };
        }
    } catch (err) {
        console.error('Error adding file path:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle("get-files-in-folder", async () => {
    try {
        return fileHandler.getFilesInfo();
    } catch (err) {
        console.error('Error getting files:', err);
        return [];
    }
});

ipcMain.handle("delete-file", async (_, fileName) => {
    try {
        fileHandler.deleteFile(fileName);
        console.log(`delete-file: ${fileName} deleted successfully.`);
        return { success: true, message: `File "${fileName}" deleted successfully.` };
    } catch (err) {
        console.error('Error deleting file:', err);
        return { success: false, message: `Error deleting file: ${err.message}` };
    }
});

ipcMain.handle("on-drag-start", async (event, fileName) => {
    try {
        const filesInfo = fileHandler.getFilesInfo();
        const fileInfo = filesInfo.find(file => file.name === fileName);
        if (fileInfo) {
            const filePath = fileInfo.path;
            if (fs.existsSync(filePath)) {
                const iconPath = isSupportedImage(filePath) ? filePath : defaultIconPath;
                event.sender.startDrag({
                    file: filePath,
                    icon: iconPath
                });
            } else {
                throw new Error(`File "${filePath}" does not exist.`);
            }
        } else {
            throw new Error(`File "${fileName}" not found in filesInfo.`);
        }
    } catch (err) {
        console.error('Error starting drag:', err);
    }
});

function isSupportedImage(filePath) {
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.ico', '.avif', '.webp'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
}
