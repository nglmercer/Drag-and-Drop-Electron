const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const mime = require('mime-types');

const store = new Store();

const generateUniqueFileName = (filePath) => {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);

    let newFilePath = filePath;
    let counter = 1;

    while (fs.existsSync(newFilePath)) {
        newFilePath = path.join(dir, `${baseName} (${counter})${ext}`);
        counter++;
    }

    return newFilePath;
};

const addOrReplaceFile = (fileToAdd, fileName, destination) => {
    const fileData = store.get('fileData', []);
    let filePath = path.join(destination, fileName);

    const existingFileIndex = fileData.findIndex(file => file.name === fileName && path.extname(file.name) === path.extname(fileName));

    if (existingFileIndex !== -1) {
        filePath = generateUniqueFileName(filePath);
    }

    const fileBinary = Buffer.from(fileToAdd.split(',')[1], 'base64');
    fs.writeFileSync(filePath, fileBinary);
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';
    fileData.push({ name: path.basename(filePath), path: filePath, type: mimeType });
    store.set('fileData', fileData);

    return filePath;
};

const registerFile = (filePath, fileName) => {
    const fileData = store.get('fileData', []);
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';
    fileData.push({ name: path.basename(filePath), path: filePath, type: mimeType });
    store.set('fileData', fileData);

    return filePath;
};

const getFilesInfo = () => {
    const fileData = store.get('fileData', []);
    return fileData.map(file => ({
        name: file.name,
        path: file.path,
        size: fs.existsSync(file.path) ? fs.statSync(file.path).size : 0,
        type: file.type,
        isDirectory: fs.existsSync(file.path) ? fs.statSync(file.path).isDirectory() : false
    }));
};

const deleteFile = (fileName) => {
    const fileData = store.get('fileData', []);
    const updatedFileData = fileData.filter(file => file.name !== fileName);
    store.set('fileData', updatedFileData);

    return updatedFileData;
};

module.exports = {
    addOrReplaceFile,
    registerFile,
    getFilesInfo,
    deleteFile,
};
