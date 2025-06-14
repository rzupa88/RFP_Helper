class AdminPanel {
    static init() {
        this.setupEventListeners();
        this.initializeManagers();
        this.initializeSettings();
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
        this.csvManager = new CSVManager();
        this.chatbotManager = new ChatbotManager();
    }

    static initializeSettings() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const currentTheme = localStorage.getItem('theme') || 'light';
            document.documentElement.setAttribute('data-theme', currentTheme);
            themeToggle.textContent = currentTheme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
            
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Confidence slider
        const confidenceSlider = document.getElementById('minConfidence');
        const confidenceValue = document.getElementById('confidenceValue');
        if (confidenceSlider && confidenceValue) {
            const savedConfidence = localStorage.getItem('minConfidence') || '25';
            confidenceSlider.value = savedConfidence;
            confidenceValue.textContent = savedConfidence;

            confidenceSlider.addEventListener('input', (e) => {
                confidenceValue.textContent = e.target.value;
                localStorage.setItem('minConfidence', e.target.value);
            });
        }

        // Default category
        const defaultCategory = document.getElementById('defaultCategory');
        if (defaultCategory) {
            const savedCategory = localStorage.getItem('defaultCategory') || 'CSV Upload';
            defaultCategory.value = savedCategory;

            defaultCategory.addEventListener('change', (e) => {
                localStorage.setItem('defaultCategory', e.target.value);
            });
        }
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
        
        // Hide all sections first
        document.querySelector('.tabs').style.display = 'none';
        document.querySelectorAll('.tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById('chat').style.display = 'none';
        
        const section = target.dataset.section;
        
        if (section === 'chat') {
            // Show chat section
            document.getElementById('chat').style.display = 'block';
        } else if (section === 'add') {
            // Show library sections and activate "Add Q&A" tab
            document.querySelector('.tabs').style.display = 'block';
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById('add').style.display = 'block';
        } else if (section === 'settings') {
            // Show settings section
            document.getElementById('settings').style.display = 'block';
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
