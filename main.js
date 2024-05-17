const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Ruta de destino para los archivos copiados
const fileCopyDestination = path.join(__dirname, 'copied-files');

// Ruta del ícono por defecto
const defaultIconPath = path.join(__dirname, 'default-icon.png');
const filePathsStorage = path.join(__dirname, 'file-paths.json');

// Crea el archivo de almacenamiento si no existe
if (!fs.existsSync(filePathsStorage)) {
    fs.writeFileSync(filePathsStorage, JSON.stringify([]));
}
// Crea el directorio si no existe
if (!fs.existsSync(fileCopyDestination)) {
    fs.mkdirSync(fileCopyDestination);
}

// Verifica que el ícono por defecto exista
if (!fs.existsSync(defaultIconPath)) {
    console.error(`El ícono por defecto no existe en la ruta: ${defaultIconPath}`);
}

// Crea la ventana principal de la aplicación
function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        },
    });

    win.loadFile('index.html');
}

// Inicializa la aplicación
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Cierra la aplicación cuando se cierran todas las ventanas
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
ipcMain.handle("add-file-path", async (_, fileParams) => {
    const { fileToAdd, fileName } = fileParams;

    try {
        const fileData = JSON.parse(fs.readFileSync(filePathsStorage));
        fileData.push({ name: fileName, path: fileToAdd });
        fs.writeFileSync(filePathsStorage, JSON.stringify(fileData));
    } catch (err) {
        console.error('Error adding file path:', err);
    }
});
// Maneja la solicitud para copiar un archivo
ipcMain.handle("copy-file", async (_, fileParams) => {
    const fileToCopy = fileParams.fileToCopy;
    const fileName = fileParams.fileName;

    try {
        fs.copyFileSync(fileToCopy, path.join(fileCopyDestination, fileName));
    } catch (err) {
        console.error('Error copying file:', err);
    }
});
let filesInfo = [];

// Maneja la solicitud para obtener la lista de archivos en la carpeta
ipcMain.handle("get-files-in-folder", async () => {
    // try {
    //     const files = await fs.promises.readdir(fileCopyDestination);
    //     filesInfo = await Promise.all(files.map(async (file) => {
    //         const filePath = path.join(fileCopyDestination, file);
    //         const fileStat = await fs.promises.stat(filePath);
    //         return {
    //             name: file,
    //             path: filePath,
    //             size: fileStat.size,
    //             isDirectory: fileStat.isDirectory()
    //         };
    //     }));
    //     return filesInfo;
    // } catch (err) {
    //     console.error('Error getting files in folder:', err);
    //     return [];
    // }
    try {
        const fileData = JSON.parse(fs.readFileSync(filePathsStorage));
        filesInfo = fileData.map(file => ({
            name: file.name,
            path: file.path,
            size: fs.existsSync(file.path) ? fs.statSync(file.path).size : 0,
            isDirectory: fs.existsSync(file.path) ? fs.statSync(file.path).isDirectory() : false
        }));
        return filesInfo;
    } catch (err) {
        console.error('Error getting files:', err);
        return [];
    }
});

// Función para verificar si el archivo es una imagen soportada
function isSupportedImage(filePath) {
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.ico'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
}

// Maneja el inicio del evento de arrastre
// ipcMain.handle("on-drag-start", async (event, fileName) => {
//     try {
//         const fileInfo = filesInfo.find(file => file.name === fileName);
//         if (fileInfo) {
//             // Verificar que el archivo existe y se puede acceder a él
//             if (fs.existsSync(fileInfo.path)) {
//                 // Usar ícono por defecto si el archivo no es una imagen soportada
//                 const iconPath = isSupportedImage(fileInfo.path) ? fileInfo.path : defaultIconPath;

//                 event.sender.startDrag({
//                     file: fileInfo.path,
//                     icon: iconPath
//                 });

//                 console.log("on-drag-start: ", fileName);
//                 console.log("on-drag-start: ", fileInfo.path);
//             } else {
//                 console.log(`File "${fileInfo.path}" does not exist.`);
//                 throw new Error(`File "${fileInfo.path}" does not exist.`);
//             }
//         } else {
//             console.log(`File "${fileName}" not found in filesInfo.`);
//         }
//     } catch (err) {
//         console.error('Error starting drag:', err);
//     }
// });
ipcMain.handle("on-drag-start", async (event, fileName) => {
    try {
        const fileInfo = filesInfo.find(file => file.name === fileName);
        if (fileInfo) {
            if (fs.existsSync(fileInfo.path)) {
                const iconPath = isSupportedImage(fileInfo.path) ? fileInfo.path : defaultIconPath;

                event.sender.startDrag({
                    file: fileInfo.path,
                    icon: iconPath
                });

                console.log("on-drag-start: ", fileName);
                console.log("on-drag-start: ", fileInfo.path);
            } else {
                console.log(`File "${fileInfo.path}" does not exist.`);
                throw new Error(`File "${fileInfo.path}" does not exist.`);
            }
        } else {
            console.log(`File "${fileName}" not found in filesInfo.`);
        }
    } catch (err) {
        console.error('Error starting drag:', err);
    }
});
// Maneja la solicitud para eliminar un archivo
// ipcMain.handle("delete-file", async (_, fileName) => {
//     try {
//         const filePath = path.join(fileCopyDestination, fileName);
//         if (fs.existsSync(filePath)) {
//             await fs.promises.unlink(filePath);
//             console.log(`delete-file: ${fileName} deleted successfully.`);
            
//             // Actualiza filesInfo después de eliminar el archivo
//             filesInfo = filesInfo.filter(file => file.name !== fileName);
//             return { success: true, message: `File "${fileName}" deleted successfully.` };
//         } else {
//             console.log(`delete-file: ${fileName} does not exist.`);
//             return { success: false, message: `File "${fileName}" does not exist.` };
//         }
//     } catch (err) {
//         console.error('Error deleting file:', err);
//         return { success: false, message: `Error deleting file: ${err.message}` };
//     }
// });
ipcMain.handle("delete-file", async (_, fileName) => {
    try {
        const fileData = JSON.parse(fs.readFileSync(filePathsStorage));
        const updatedFileData = fileData.filter(file => file.name !== fileName);
        fs.writeFileSync(filePathsStorage, JSON.stringify(updatedFileData));

        // Actualiza filesInfo después de eliminar el archivo
        filesInfo = filesInfo.filter(file => file.name !== fileName);

        console.log(`delete-file: ${fileName} deleted successfully.`);
        return { success: true, message: `File "${fileName}" deleted successfully.` };
    } catch (err) {
        console.error('Error deleting file:', err);
        return { success: false, message: `Error deleting file: ${err.message}` };
    }
});