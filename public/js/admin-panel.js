class AdminPanel {
    static init() {
        this.setupEventListeners();
        this.initializeManagers();
        QnAManager.fetchQnAs();
    }

    static setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Sidebar navigation
        document.querySelectorAll('.sidebar .nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleNavigation(e.target);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Category filter
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        }
    }

    static initializeManagers() {
        CSVManager.init();
        ChatbotManager.init();
    }

    static switchTab(tabId) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab and activate its button
        const selectedTab = document.getElementById(tabId);
        const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);

        if (selectedTab) {
            selectedTab.style.display = 'block';
            selectedTab.classList.add('active');
        }
        if (selectedButton) selectedButton.classList.add('active');
    }

    static handleNavigation(target) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active-tab');
        });
        
        // Add active class to clicked nav link
        target.classList.add('active-tab');
        
        const section = target.dataset.section;
        
        if (section === 'chat') {
            // Hide tab buttons and all other content
            document.querySelector('.tabs').style.display = 'none';
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            // Show chat section
            document.getElementById('chat').style.display = 'block';
        } else if (section === 'add') {
            // Show tab buttons and restore tab content
            document.querySelector('.tabs').style.display = 'block';
            document.getElementById('chat').style.display = 'none';
            this.switchTab('add');
        }
    }

    static toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.textContent = newTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
        }
    }

    static toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    static handleSearch(searchTerm) {
        const searchText = searchTerm.toLowerCase();
        document.querySelectorAll('#qnaTableBody tr').forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchText) ? '' : 'none';
        });
    }

    static handleCategoryFilter(category) {
        document.querySelectorAll('#qnaTableBody tr').forEach(row => {
            const categoryCell = row.children[3]; // Assuming category is in the 4th column
            if (categoryCell) {
                row.style.display = !category || categoryCell.textContent === category ? '' : 'none';
            }
        });
    }
}
