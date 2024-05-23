// fileHandler.js
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

const addOrReplaceFile = (fileToAdd, fileName, destination) => {
    const fileData = store.get('fileData', []);
    const filePath = path.join(destination, fileName);

    const existingFileIndex = fileData.findIndex(file => file.name === fileName && path.extname(file.name) === path.extname(fileName));

    if (existingFileIndex !== -1) {
        const existingFilePath = fileData[existingFileIndex].path;
        fs.unlinkSync(existingFilePath);
        fileData.splice(existingFileIndex, 1);
    }

    const fileBinary = Buffer.from(fileToAdd.split(',')[1], 'base64');
    fs.writeFileSync(filePath, fileBinary);
    fileData.push({ name: fileName, path: filePath });
    store.set('fileData', fileData);

    return filePath;
};

const getFilesInfo = () => {
    const fileData = store.get('fileData', []);
    return fileData.map(file => ({
        name: file.name,
        path: file.path,
        size: fs.existsSync(file.path) ? fs.statSync(file.path).size : 0,
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
    getFilesInfo,
    deleteFile,
};
