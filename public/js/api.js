// API Client for Portfolio Management System

class ApiClient {
    constructor(baseURL = 'http://localhost:3000/api') {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Portfolio methods
    async getPortfolios() {
        return this.request('/portfolios');
    }

    async getPortfolio(id) {
        return this.request(`/portfolios/${id}`);
    }

    async createPortfolio(portfolioData) {
        return this.request('/portfolios', {
            method: 'POST',
            body: portfolioData
        });
    }

    async updatePortfolio(id, portfolioData) {
        return this.request(`/portfolios/${id}`, {
            method: 'PUT',
            body: portfolioData
        });
    }

    async deletePortfolio(id) {
        return this.request(`/portfolios/${id}`, {
            method: 'DELETE'
        });
    }

    async getPortfolioPerformance(id, days = 30) {
        return this.request(`/portfolios/${id}/performance?days=${days}`);
    }

    async getPortfolioSummary(id) {
        return this.request(`/portfolios/${id}/summary`);
    }

    // Portfolio Item methods
    async getPortfolioItems(portfolioId) {
        return this.request(`/portfolios/${portfolioId}/items`);
    }

    async getPortfolioItem(id) {
        return this.request(`/items/${id}`);
    }

    async createPortfolioItem(itemData) {
        return this.request('/items', {
            method: 'POST',
            body: itemData
        });
    }

    async updatePortfolioItem(id, itemData) {
        return this.request(`/items/${id}`, {
            method: 'PUT',
            body: itemData
        });
    }

    async deletePortfolioItem(id) {
        return this.request(`/items/${id}`, {
            method: 'DELETE'
        });
    }

    async updatePrice(symbol, price) {
        return this.request('/items/price', {
            method: 'PUT',
            body: { symbol, price }
        });
    }

    async getPortfolioAllocation(portfolioId) {
        return this.request(`/portfolios/${portfolioId}/allocation`);
    }
}

// Create global API client instance
const api = new ApiClient();

// Utility functions for API responses
function showAlert(message, type = 'info', duration = 5000) {
    const alertContainer = document.getElementById('alert-container');
    const alertId = 'alert-' + Date.now();
    
    const alertHTML = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    alertContainer.insertAdjacentHTML('beforeend', alertHTML);
    
    // Auto dismiss after duration
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, duration);
}

function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function showLoading(show = true) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

function formatPercent(value, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
        style: 'percent',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value / 100);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getAssetTypeBadgeClass(type) {
    return `asset-type-${type}`;
}

function getGainLossClass(value) {
    return value >= 0 ? 'gain-positive' : 'gain-negative';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Error handling wrapper for async functions
function handleAsync(asyncFn) {
    return async function(...args) {
        try {
            showLoading(true);
            return await asyncFn.apply(this, args);
        } catch (error) {
            console.error('Error:', error);
            showAlert(error.message || 'An error occurred', 'danger');
            throw error;
        } finally {
            showLoading(false);
        }
    };
}

// Validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validateRequired(value) {
    return value !== null && value !== undefined && value.toString().trim() !== '';
}

function validateNumber(value, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
}

function validateDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
}

// Form validation
function validateForm(formElement, rules) {
    const errors = [];
    
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
        const field = formElement.querySelector(`[name="${fieldName}"], #${fieldName}`);
        if (!field) continue;
        
        const value = field.value;
        
        for (const rule of fieldRules) {
            if (rule.required && !validateRequired(value)) {
                errors.push(`${rule.label || fieldName} is required`);
                field.classList.add('is-invalid');
                break;
            }
            
            if (rule.type === 'number' && value && !validateNumber(value, rule.min, rule.max)) {
                errors.push(`${rule.label || fieldName} must be a valid number${rule.min !== undefined ? ` (min: ${rule.min})` : ''}${rule.max !== undefined ? ` (max: ${rule.max})` : ''}`);
                field.classList.add('is-invalid');
                break;
            }
            
            if (rule.type === 'date' && value && !validateDate(value)) {
                errors.push(`${rule.label || fieldName} must be a valid date`);
                field.classList.add('is-invalid');
                break;
            }
            
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    }
    
    return errors;
}

// Clear form validation
function clearFormValidation(formElement) {
    const inputs = formElement.querySelectorAll('.form-control, .form-select');
    inputs.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });
}

// Local storage helpers
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
    }
}
