const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const sharp = require('sharp');

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
function isSupportedMedia(filePath) {
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.ico', '.mp4', '.mp3'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
}
ipcMain.handle("add-file-path", async (_, fileParams) => {
    const { fileToAdd, fileName, draggedFromThisWindow } = fileParams; // Nuevo parámetro

    try {
        const filePath = path.join(fileCopyDestination, fileName);
        const fileData = JSON.parse(fs.readFileSync(filePathsStorage));

        // Verificar si existe un archivo con el mismo nombre y tipo
        const existingFileIndex = fileData.findIndex(file => file.name === fileName && path.extname(file.name) === path.extname(fileName));

        if (existingFileIndex !== -1) {
            // Si se encuentra un archivo con el mismo nombre y tipo, reemplazarlo
            const existingFilePath = fileData[existingFileIndex].path;
            fs.unlinkSync(existingFilePath); // Eliminar el archivo existente
            fileData.splice(existingFileIndex, 1); // Eliminar la entrada del archivo existente de la lista
        }

        // Decodificar el contenido base64 a datos binarios
        const fileBinary = Buffer.from(fileToAdd.split(',')[1], 'base64');
        fs.writeFileSync(filePath, fileBinary); // Guardar el archivo en el sistema de archivos
        fileData.push({ name: fileName, path: filePath });
        fs.writeFileSync(filePathsStorage, JSON.stringify(fileData));
        
        console.log(`El archivo "${fileName}" se ha agregado o reemplazado correctamente.`);
    } catch (err) {
        console.error('Error adding file path:', err);
    }
});


// Maneja la solicitud para copiar un archivo
ipcMain.handle("copy-file", async (_, fileParams) => {
    const fileToCopy = fileParams.fileToCopy;
    const fileName = fileParams.fileName;
    console.log("copy-file fileToCopy: ", fileToCopy);
    console.log("copy-file fileName: ", fileName);
    console.log("copy-file fileParams: ", fileParams);
    try {
        fs.copyFileSync(fileToCopy, path.join(fileCopyDestination, fileName));
    } catch (err) {
        console.error('Error copying file:', err);
    }
});
let filesInfo = [];

// Maneja la solicitud para obtener la lista de archivos en la carpeta
ipcMain.handle("get-files-in-folder", async () => {
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
    const supportedExtensions = ['.png', '.jpg', '.jpeg', '.ico', '.avif'];
    return supportedExtensions.some(ext => filePath.endsWith(ext));
}

async function convertAvifToPng(avifPath, outputPath) {
    try {
        await sharp(avifPath)
            .png()
            .toFile(outputPath);
        return outputPath;
    } catch (error) {
        console.error("Error converting AVIF to PNG:", error);
        throw error;
    }
}

// Uso en la función de arrastre
ipcMain.handle("on-drag-start", async (event, fileName) => {
    try {
        const fileInfo = filesInfo.find(file => file.name === fileName);
        if (fileInfo) {
            let filePath = fileInfo.path;
            console.log(`Initial filePath: ${filePath}`);

            if (!fs.existsSync(filePath) && filePath.startsWith("data:")) {
                filePath = fileInfo.path;
                console.log(`Updated filePath (base64): ${filePath}`);
            }

            if (fs.existsSync(filePath)) {
                let iconPath = isSupportedImage(filePath) ? filePath : defaultIconPath;

                if (filePath.endsWith('.avif')) {
                    const convertedPath = path.join(path.dirname(filePath), `${path.basename(filePath, '.avif')}.png`);
                    await convertAvifToPng(filePath, convertedPath);
                    iconPath = convertedPath;
                }

                console.log(`Drag filePath exists: ${filePath}`);
                console.log(`iconPath set to: ${iconPath}`);

                event.sender.startDrag({
                    file: filePath,
                    icon: iconPath
                });

                // console.log("on-drag-start: ", fileName);
                // console.log("on-drag-start filePath: ", filePath);
                // console.log("on-drag-start fileInfo: ", fileInfo);
                // console.log("on-drag-start iconPath: ", iconPath);
            } else {
                console.log(`File "${filePath}" does not exist.`);
                throw new Error(`File "${filePath}" does not exist.`);
            }
        } else {
            console.log(`File "${fileName}" not found in filesInfo.`);
        }
    } catch (err) {
        console.error('Error starting drag:', err);
    }
});

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