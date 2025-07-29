// Theme Manager for Portfolio Management System

class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || 'light';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupThemeToggle();
    }

    getStoredTheme() {
        return localStorage.getItem('portfolio-theme');
    }

    setStoredTheme(theme) {
        localStorage.setItem('portfolio-theme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        this.updateThemeToggle();
        // Removed updateBootstrapClasses to prevent conflicts
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    setupThemeToggle() {
        // Find or create theme toggle button
        let themeToggle = document.getElementById('theme-toggle');
        
        if (!themeToggle) {
            // Create theme toggle if it doesn't exist
            themeToggle = this.createThemeToggle();
            this.addThemeToggleToNavbar(themeToggle);
        }

        // Add event listener
        const toggleInput = themeToggle.querySelector('input');
        if (toggleInput) {
            toggleInput.addEventListener('change', () => this.toggleTheme());
        }
    }

    createThemeToggle() {
        const themeToggleContainer = document.createElement('li');
        themeToggleContainer.className = 'nav-item d-flex align-items-center ms-3';
        
        themeToggleContainer.innerHTML = `
            <label class="theme-switcher" id="theme-toggle" title="Toggle Dark/Light Theme">
                <input type="checkbox" ${this.currentTheme === 'dark' ? 'checked' : ''}>
                <span class="theme-slider">
                    <i class="fas fa-sun theme-icon sun"></i>
                    <i class="fas fa-moon theme-icon moon"></i>
                </span>
            </label>
        `;
        
        return themeToggleContainer;
    }

    addThemeToggleToNavbar(themeToggle) {
        // Try to find the navbar
        const navbar = document.querySelector('.navbar-nav');
        if (navbar) {
            navbar.appendChild(themeToggle);
        } else {
            // Fallback: add to end of navbar
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse) {
                const navList = document.createElement('ul');
                navList.className = 'navbar-nav ms-auto';
                navList.appendChild(themeToggle);
                navbarCollapse.appendChild(navList);
            }
        }
    }

    updateThemeToggle() {
        const toggleInput = document.querySelector('#theme-toggle input');
        if (toggleInput) {
            toggleInput.checked = this.currentTheme === 'dark';
        }
    }

    // Method to manually set theme (useful for admin page or other contexts)
    setTheme(theme) {
        if (theme === 'light' || theme === 'dark') {
            this.applyTheme(theme);
        }
    }

    // Get current theme
    getTheme() {
        return this.currentTheme;
    }
}

// Global theme manager instance
let themeManager;

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    themeManager = new ThemeManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeManager;
}
