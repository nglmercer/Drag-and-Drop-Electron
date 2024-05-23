document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileList = document.getElementById('file-list');
    // console.log('cargando datos');
    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.classList.add('highlight');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('highlight');
    });

    dropArea.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropArea.classList.remove('highlight');
        
        const files = event.dataTransfer.files;
        for (const file of files) {
            console.log('info:', file); // Aquí se imprime el path o la URL del archivo
            const reader = new FileReader();
            reader.onload = async (e) => {
                const fileParams = { fileToAdd: e.target.result, fileName: file.name };
                const confirmation = confirm(`¿Desea agregar el archivo "${file.name}"?`);
                if (confirmation) {
                    await window.api.addFilePath(fileParams);
                    loadFileList();
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    const loadFileList = async () => {
        const files = await window.api.getFilesInFolder();
        console.log('loadFileList', files);
        fileList.innerHTML = files.map(file => `
            <div class="file-item">
                <span>${file.name}</span>
                <button onclick="deleteFile('${file.name}')">Delete</button>
                <img src="${file.path}" class="file-thumbnail" />
            </div>
        `).join('');
    };

    window.deleteFile = async (fileName) => {
        await window.api.deleteFile(fileName);
        loadFileList();
    };

    loadFileList();
});
