class QnAManager {
    static async fetchQnAs() {
        try {
            const response = await fetch('/qna');
            if (!response.ok) {
                throw new Error('Failed to fetch Q&A data');
            }
            const data = await response.json();
            this.updateTables(data);
            this.updateCategoryFilters(data);
        } catch (error) {
            console.error('Error fetching Q&As:', error);
            this.showError('Failed to load Q&A data. Please try refreshing the page.');
        }
    }

    static updateTables(data) {
        ['qnaTableBody', 'libraryTableBody'].forEach(tableId => {
            const table = document.getElementById(tableId);
            if (!table) return;

            if (!data || data.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted">
                            No Q&A entries found. Add some using the form below or upload a CSV file.
                        </td>
                    </tr>
                `;
                return;
            }

            table.innerHTML = data.map(item => `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.question}</td>
                    <td>${item.answer}</td>
                    <td>${item.category || ''}</td>
                    <td>${item.subcategory || ''}</td>
                    ${tableId === 'qnaTableBody' ? 
                        `<td><button class="btn btn-sm btn-danger" onclick="QnAManager.deleteEntry(${item.id})">Delete</button></td>` 
                        : ''}
                </tr>
            `).join('');
        });
    }

    static updateCategoryFilters(data) {
        const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
        ['categoryFilter', 'categoryLibraryFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (!filter) return;

            filter.innerHTML = '<option value="">All Categories</option>' +
                categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        });
    }

    static async deleteEntry(id) {
        if (!confirm('Are you sure you want to delete this entry?')) return;

        try {
            const response = await fetch(`/qna/${id}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete entry');
            await this.fetchQnAs();
        } catch (error) {
            console.error('Error deleting entry:', error);
            this.showError('Failed to delete entry. Please try again.');
        }
    }

    static showError(message) {
        ['qnaTableBody', 'libraryTableBody'].forEach(tableId => {
            const table = document.getElementById(tableId);
            if (table) {
                table.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-danger">${message}</td>
                    </tr>
                `;
            }
        });
    }
}
