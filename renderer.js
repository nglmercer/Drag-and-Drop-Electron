const fileContainer = document.getElementById("file-container");
const filesList = document.getElementById("files-list");

const listItemStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "5px",
    padding: "5px",
    backgroundColor: "#BBC1C6"
};

document.addEventListener("DOMContentLoaded", () => {
    updateFilesList();
});

fileContainer.addEventListener("dragover", handleDragOver);
fileContainer.addEventListener("drop", handleFileDrop);

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
        await addFileToList(file);
    }
    await updateFilesList();
}

async function addFileToList(file) {
    filesList.innerHTML += file.name + "<br>";
    await window.api.copyFile({ fileToCopy: file.path, fileName: file.name });
}

async function updateFilesList() {
    const filesInfo = await window.api.getFilesInFolder();
    filesList.innerHTML = "";
    filesInfo.forEach(fileInfo => {
        const item = createFileListItem(fileInfo);
        filesList.appendChild(item);
    });
}

function createFileListItem(fileInfo) {
    const item = document.createElement("li");
    applyStyles(item, listItemStyle);

    const preview = createFilePreview(fileInfo);
    const fileNameText = createFileNameText(fileInfo.name);
    const deleteButton = createDeleteButton(fileInfo.name, item);

    item.appendChild(preview);
    item.appendChild(fileNameText);
    item.appendChild(deleteButton);

    item.classList.add("unselectable");
    item.draggable = true;
    item.ondragstart = (event) => handleDragStart(event, fileInfo.name);

    return item;
}

function applyStyles(element, styles) {
    Object.assign(element.style, styles);
}

function createFilePreview(fileInfo) {
    const fileExtension = fileInfo.name.split('.').pop().toLowerCase();
    let preview;

    if (['jpg', 'jpeg', 'png', 'gif','svg', 'webp'].includes(fileExtension)) {
        preview = document.createElement("img");
        preview.src = `file://${fileInfo.path}`;
        preview.style.width = "300px";
        preview.style.height = "auto";
    } else if (fileExtension === 'mp4' || fileExtension === 'mov' || fileExtension === 'webm') {
        preview = document.createElement("video");
        preview.src = `file://${fileInfo.path}`;
        preview.style.width = "300px";
        preview.style.height = "auto";
        preview.controls = true;
    } else {
        preview = document.createElement("span");
        preview.textContent = "Preview not available ";
    }

    return preview;
}

function createFileNameText(fileName) {
    const fileNameText = document.createElement("span");
    fileNameText.textContent = fileName;
    return fileNameText;
}

function createDeleteButton(fileName, listItem) {
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Eliminar";
    deleteButton.addEventListener("click", () => handleDeleteButtonClick(fileName, listItem));
    return deleteButton;
}

async function handleDeleteButtonClick(fileName, listItem) {
    try {
        await window.api.deleteFile(fileName);
        filesList.removeChild(listItem);
        await updateFilesList();
    } catch (error) {
        console.error(`Error deleting file "${fileName}":`, error);
    }
}

function handleDragStart(event, fileName) {
    event.preventDefault();
    window.api.startDrag(fileName);
}
