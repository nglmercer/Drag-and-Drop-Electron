document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileList = document.getElementById('file-list');

    dropArea.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropArea.classList.add('highlight');
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('highlight');
    });

    let existingFiles = [];
    dropArea.addEventListener('drop', async (event) => {
        event.preventDefault();
        dropArea.classList.remove('highlight');

        const files = event.dataTransfer.files;
        for (const file of files) {
            console.log('info:', file); // Aquí se imprime el path o la URL del archivo
            console.log('file.existingFiles', existingFiles);
            let fileExists = existingFiles.some(existingFile => 
                existingFile.name === file.name && existingFile.size === file.size
            );

            if (fileExists) {
                console.log(`El archivo "${file.name}" ya existe y tiene el mismo tamaño.`);
                alert(`El archivo "${file.name}" ya existe y tiene el mismo tamaño.`);
                continue;
            }

            if (file.path) {
                // Si el archivo tiene un path, no es necesario leerlo como Data URL
                const fileParams = { fileName: file.name, filePath: file.path };
                const confirmation = confirm(`¿Desea agregar el archivo "${file.name}"?`);
                if (confirmation) {
                    const result = await window.api.addFilePath(fileParams);
                    if (result.success) {
                        loadFileList();
                    } else {
                        alert(`Error al agregar el archivo: ${result.error}`);
                    }
                }
            } else {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const fileParams = { fileToAdd: e.target.result, fileName: file.name };
                    const confirmation = confirm(`¿Desea agregar el archivo "${file.name}"?`);
                    if (confirmation) {
                        const result = await window.api.addFilePath(fileParams);
                        if (result.success) {
                            loadFileList();
                        } else {
                            alert(`Error al agregar el archivo: ${result.error}`);
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    });

    const loadFileList = async () => {
        const files = await window.api.getFilesInFolder();
        existingFiles = files; // Asegurarse de que existingFiles sea un array plano
        console.log('loadFileList', files);
        fileList.innerHTML = files.map(file => `
            <div class="file-item">
                <span>${file.name}</span>
                <button onclick="deleteFile('${file.name}')">Delete</button>
                ${getMediaElement(file.path, file.type)}
            </div>
        `).join('');
    };

    const getMediaElement = (filePath, fileType) => {
        if (fileType) {
            if (fileType.startsWith('image/')) {
                return `<img src="${filePath}" class="file-thumbnail" />`;
            } else if (fileType.startsWith('video/')) {
                return `<video controls class="file-thumbnail">
                            <source src="${filePath}" type="${fileType}">
                            Your browser does not support the video tag.
                        </video>`;
            } else {
                return `<span>Unsupported file type</span>`;
            }
        } else {
            return `<img src="${filePath}" class="file-thumbnail" />`;
        }
    };

    window.deleteFile = async (fileName) => {
        await window.api.deleteFile(fileName);
        loadFileList();
    };

    loadFileList();
});
