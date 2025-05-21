class CSVManager {
    static init() {
        const form = document.getElementById('csvUploadForm');
        if (form) {
            form.addEventListener('submit', this.handleUpload.bind(this));
        }
    }

    static async handleUpload(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const fileInput = document.getElementById('csvFile');
        const progressBar = document.querySelector('.progress-bar');
        const progressText = document.getElementById('progressText');
        const uploadStatus = document.getElementById('uploadStatus');
        const uploadProgress = document.getElementById('uploadProgress');

        if (!fileInput || !fileInput.files[0]) {
            this.showError('Please select a CSV file first');
            return;
        }

        try {
            // Validate file type
            const file = fileInput.files[0];
            if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
                throw new Error('Please select a CSV file');
            }

            formData.append('file', file);
            uploadProgress.style.display = 'block';
            uploadStatus.textContent = 'Uploading...';
            uploadStatus.className = '';
            progressBar.style.width = '50%';
            progressText.textContent = '50%';

            const response = await fetch('/process-csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            this.showSuccess(`Processed ${result.questionsProcessed} questions successfully!`);
            progressBar.style.width = '100%';
            progressText.textContent = '100%';

            // Refresh the Q&A tables
            await QnAManager.fetchQnAs();
        } catch (error) {
            console.error('Upload error:', error);
            this.showError(error.message);
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
        } finally {
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                fileInput.value = '';
            }, 2000);
        }
    }

    static showError(message) {
        const uploadStatus = document.getElementById('uploadStatus');
        if (uploadStatus) {
            uploadStatus.textContent = `Error: ${message}`;
            uploadStatus.className = 'error';
        }
    }

    static showSuccess(message) {
        const uploadStatus = document.getElementById('uploadStatus');
        if (uploadStatus) {
            uploadStatus.textContent = message;
            uploadStatus.className = 'success';
        }
    }
}
