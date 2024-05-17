document.addEventListener('DOMContentLoaded', () => {
    const fileContainer = document.getElementById("file-container");
    const filesList = document.getElementById("files-list");

    fileContainer.addEventListener("dragover", handleDragOver);
    fileContainer.addEventListener("drop", handleFileDrop);

    updateFilesList();
});

async function handleDragOver(event) {
    event.stopPropagation();
    event.preventDefault();
    console.log("dragover Event", event.dataTransfer.files);
}

async function handleFileDrop(event) {
    event.stopPropagation();
    event.preventDefault();
    console.log("drop Event", event.dataTransfer.files);
    const files = event.dataTransfer.files;
    for (const file of files) {
        await window.api.addFilePath({ fileToAdd: file.path, fileName: file.name });
    }
    await updateFilesList();
}

async function updateFilesList() {
    try {
        const filesInfo = await window.api.getFilesInFolder();
        const filesList = document.getElementById("files-list");
        filesList.innerHTML = ""; // Limpiar la lista antes de actualizarla

        filesInfo.forEach(fileInfo => {
            const listItem = createFileListItem(fileInfo);
            filesList.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error getting files in folder:', error);
    }
}

function createFileListItem(fileInfo) {
    const item = document.createElement("li");
    item.className = "file-item unselectable";
    item.draggable = true;

    let thumbnail;
    if (isImage(fileInfo.path)) {
        thumbnail = document.createElement("img");
        thumbnail.src = `file://${fileInfo.path}`;
        thumbnail.className = "file-thumbnail";
    } else if (isVideo(fileInfo.path)) {
        thumbnail = document.createElement("video");
        thumbnail.src = `file://${fileInfo.path}`;
        thumbnail.className = "file-thumbnail";
        thumbnail.controls = true; // Agregar controles de video
    } else {
        thumbnail = document.createElement("img");
        thumbnail.src = `default-icon.png`; // Usa una miniatura por defecto para otros archivos
        thumbnail.className = "file-thumbnail";
    }

    const fileNameText = document.createElement("span");
    fileNameText.textContent = fileInfo.name;
    fileNameText.className = "file-name";

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.className = "delete-button";
    deleteButton.addEventListener("click", () => handleDeleteFile(fileInfo.name));

    item.appendChild(thumbnail);
    item.appendChild(fileNameText);
    item.appendChild(deleteButton);
    item.addEventListener('dragstart', (event) => {
        event.preventDefault();
        window.api.startDrag(fileInfo.name);
    });

    return item;
}

// Función para detectar si el archivo es una imagen
function isImage(filePath) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg'];
    return imageExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
}

// Función para detectar si el archivo es un video
function isVideo(filePath) {
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
    return videoExtensions.some(ext => filePath.toLowerCase().endsWith(ext));
}

async function handleDeleteFile(fileName) {
    try {
        await window.api.deleteFile(fileName);
        await updateFilesList();
    } catch (error) {
        console.error(`Error deleting file "${fileName}":`, error);
    }
}
