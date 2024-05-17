const { ipcRenderer, contextBridge } = require("electron");

const api = {
    // copyFile: (fileParams) => {
    //     ipcRenderer.invoke("copy-file", fileParams);
    // },
    // getFilesInFolder: () => {return ipcRenderer.invoke("get-files-in-folder")},
    // startDrag: (fileName => { ipcRenderer.invoke("on-drag-start", fileName)}),
    // deletefile: (fileName) => {
    //     ipcRenderer.invoke("delete-file", fileName);
    //     console.log(fileName);
    // },
    addFilePath: (fileParams) => ipcRenderer.invoke('add-file-path', fileParams),
    getFilesInFolder: () => ipcRenderer.invoke('get-files-in-folder'),
    startDrag: (fileName) => ipcRenderer.invoke('on-drag-start', fileName),
    deleteFile: (fileName) => ipcRenderer.invoke('delete-file', fileName)    
    

}

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

contextBridge.exposeInMainWorld("api", api);