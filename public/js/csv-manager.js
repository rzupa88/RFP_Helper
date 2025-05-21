class CSVManager {
    constructor() {
        this.processedData = null;
        this.init();
    }

    init() {
        document.getElementById('processBtn').addEventListener('click', () => this.processCSV());
        document.getElementById('commitBtn').addEventListener('click', () => this.commitToLibrary());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadProcessedCSV());
    }

    async processCSV() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];
        if (!file) {
            this.showStatus('Please select a CSV file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            this.showProgress(true);
            const response = await fetch('/process-csv', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to process CSV');
            }

            const result = await response.json();
            if (result.success) {
                this.processedData = result.data;
                this.displayProcessedResults();
                document.getElementById('commitBtn').disabled = false;
                this.showStatus('Processing complete! Review the answers before committing.', 'success');
            }
        } catch (error) {
            this.showStatus(`Error processing CSV: ${error.message}`, 'error');
        } finally {
            this.showProgress(false);
        }
    }

    displayProcessedResults() {
        const tableBody = document.getElementById('processedTableBody');
        const resultsDiv = document.getElementById('processedResults');
        
        tableBody.innerHTML = this.processedData.map((row, index) => `
            <tr>
                <td>${row.question}</td>
                <td>
                    <textarea class="form-control answer-edit" 
                              data-index="${index}"
                              rows="3">${row.answer}</textarea>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary save-edit" 
                            data-index="${index}">Save Edit</button>
                </td>
            </tr>
        `).join('');

        resultsDiv.style.display = 'block';

        // Add edit handlers
        document.querySelectorAll('.save-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = e.target.dataset.index;
                const newAnswer = document.querySelector(`textarea[data-index="${index}"]`).value;
                this.processedData[index].answer = newAnswer;
                this.showStatus('Answer updated', 'success');
            });
        });
    }

    async commitToLibrary() {
        if (!this.processedData) {
            this.showStatus('No processed data to commit', 'error');
            return;
        }

        try {
            const response = await fetch('/commit-csv', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ data: this.processedData })
            });

            if (!response.ok) {
                throw new Error('Failed to commit to library');
            }

            const result = await response.json();
            if (result.success) {
                this.showStatus('Successfully added to library!', 'success');
                document.getElementById('commitBtn').disabled = true;
                // Refresh the Q&A tables
                await QnAManager.fetchQnAs();
            }
        } catch (error) {
            this.showStatus(`Error committing to library: ${error.message}`, 'error');
        }
    }

    downloadProcessedCSV() {
        if (!this.processedData) {
            this.showStatus('No processed data to download', 'error');
            return;
        }

        const csv = this.convertToCSV(this.processedData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'processed_questions.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    convertToCSV(data) {
        const headers = ['Question', 'Answer'];
        const rows = data.map(row => [row.question, row.answer]);
        return [headers, ...rows]
            .map(row => row.map(str => `"${str.replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('uploadStatus');
        statusDiv.textContent = message;
        statusDiv.className = `alert alert-${type === 'error' ? 'danger' : 'success'}`;
    }

    showProgress(show) {
        const progress = document.getElementById('uploadProgress');
        const progressBar = progress.querySelector('.progress-bar');
        const progressText = progress.querySelector('.progress-text');
        
        progress.style.display = show ? 'block' : 'none';
        if (show) {
            progressBar.style.width = '50%';
            progressText.textContent = 'Processing...';
        } else {
            progressBar.style.width = '0%';
            progressText.textContent = '0%';
        }
    }
}
