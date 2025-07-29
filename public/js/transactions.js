// Transaction Management JavaScript for Portfolio Management System

let currentPage = 1;
const itemsPerPage = 15;
let currentFilters = {};
let currentEditTransactionId = null;
let allPortfolios = [];

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeTransactionsPage();
});

async function initializeTransactionsPage() {
    try {
        await loadPortfolios();
        await loadTransactions();
        await loadTransactionStats();
        setupEventListeners();
    } catch (error) {
        console.error('Failed to initialize transactions page:', error);
        showAlert('Failed to initialize page', 'danger');
    }
}

// Load portfolios for dropdowns
async function loadPortfolios() {
    try {
        console.log('Loading portfolios...');
        const response = await api.getPortfolios();
        if (response.success) {
            allPortfolios = response.data;
            console.log('Loaded portfolios:', allPortfolios);
            updatePortfolioSelects();
        }
    } catch (error) {
        console.error('Failed to load portfolios:', error);
    }
}

function updatePortfolioSelects() {
    const portfolioFilter = document.getElementById('portfolioFilter');
    
    if (!portfolioFilter) {
        console.error('Portfolio filter element not found');
        return;
    }
    
    // Clear existing options completely
    portfolioFilter.innerHTML = '';
    
    // Add the default "All Portfolios" option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'All Portfolios';
    portfolioFilter.appendChild(defaultOption);
    
    // Add each portfolio option
    allPortfolios.forEach(portfolio => {
        const filterOption = document.createElement('option');
        filterOption.value = portfolio.id;
        filterOption.textContent = portfolio.name;
        portfolioFilter.appendChild(filterOption);
    });
    
    console.log('Portfolio filter updated with', allPortfolios.length, 'portfolios');
}

// Load transactions with pagination and filters
async function loadTransactions() {
    try {
        showLoading(true);
        
        const queryParams = new URLSearchParams({
            page: currentPage,
            limit: itemsPerPage,
            ...currentFilters
        });
        
        const response = await fetch(`/api/transactions?${queryParams}`);
        const data = await response.json();
        
        if (data.success) {
            displayTransactions(data.data.transactions);
            updatePaginationControls(data.data.pagination);
        } else {
            throw new Error(data.message || 'Failed to load transactions');
        }
    } catch (error) {
        console.error('Failed to load transactions:', error);
        showAlert('Failed to load transactions', 'danger');
    } finally {
        showLoading(false);
    }
}

function displayTransactions(transactions) {
    const tbody = document.getElementById('transactionsBody');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted py-4">
                    <i class="fas fa-inbox fa-2x mb-2"></i><br>
                    No transactions found
                </td>
            </tr>
        `;
        return;
    }
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaction.transaction_date)}</td>
            <td><span class="badge bg-${getTransactionTypeBadgeClass(transaction.transaction_type)}">${transaction.transaction_type.toUpperCase()}</span></td>
            <td><strong>${transaction.symbol}</strong></td>
            <td>${transaction.asset_name}</td>
            <td>${formatNumber(transaction.quantity)}</td>
            <td>${formatCurrency(transaction.price_per_unit)}</td>
            <td class="${getAmountClass(transaction.total_amount)}">${formatCurrency(transaction.total_amount)}</td>
            <td>${formatCurrency(transaction.fees)}</td>
            <td><span class="badge bg-${getStatusBadgeClass(transaction.status)}">${transaction.status.toUpperCase()}</span></td>
            <td>
                <button class="btn btn-outline-primary btn-sm view-transaction-btn" data-transaction-id="${transaction.id}" title="View Details">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners to view buttons
    document.querySelectorAll('.view-transaction-btn').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-transaction-id');
            viewTransactionDetails(parseInt(transactionId));
        });
    });
}

function getTransactionTypeBadgeClass(type) {
    const classes = {
        'buy': 'success',
        'sell': 'danger',
        'dividend': 'info',
        'split': 'warning',
        'transfer': 'secondary',
        'fee': 'dark',
        'deposit': 'primary',
        'withdrawal': 'warning'
    };
    return classes[type] || 'secondary';
}

function getStatusBadgeClass(status) {
    const classes = {
        'completed': 'success',
        'pending': 'warning',
        'cancelled': 'danger'
    };
    return classes[status] || 'secondary';
}

function getAmountClass(amount) {
    return parseFloat(amount) >= 0 ? 'text-success' : 'text-danger';
}

// Update pagination controls
function updatePaginationControls(pagination) {
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');
    
    if (pagination.total === 0) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    const startItem = (pagination.page - 1) * pagination.limit + 1;
    const endItem = Math.min(pagination.page * pagination.limit, pagination.total);
    paginationInfo.textContent = `Showing ${startItem} - ${endItem} of ${pagination.total} transactions`;
    
    paginationControls.innerHTML = '';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${!pagination.hasPrev ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.page - 1}">Previous</a>`;
    paginationControls.appendChild(prevLi);
    
    // Page numbers
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === pagination.page ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        paginationControls.appendChild(pageLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${!pagination.hasNext ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${pagination.page + 1}">Next</a>`;
    paginationControls.appendChild(nextLi);
    
    // Add click event listeners
    paginationControls.addEventListener('click', handlePaginationClick);
}

function handlePaginationClick(event) {
    event.preventDefault();
    
    if (event.target.classList.contains('page-link')) {
        const page = parseInt(event.target.dataset.page);
        if (page && page !== currentPage) {
            currentPage = page;
            loadTransactions();
        }
    }
}

// Load transaction statistics
async function loadTransactionStats() {
    try {
        const response = await fetch('/api/transactions/recent?limit=100');
        const data = await response.json();
        
        if (data.success) {
            const transactions = data.data.transactions;
            
            // Calculate stats
            const totalTransactions = transactions.length;
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            
            const monthlyTransactions = transactions.filter(t => {
                const transactionDate = new Date(t.created_at);
                return transactionDate.getMonth() === currentMonth && 
                       transactionDate.getFullYear() === currentYear;
            }).length;
            
            const totalInvested = transactions
                .filter(t => t.transaction_type === 'buy')
                .reduce((sum, t) => sum + parseFloat(t.total_amount), 0);
            
            const totalFees = transactions
                .reduce((sum, t) => sum + parseFloat(t.fees || 0), 0);
            
            // Update UI
            document.getElementById('totalTransactions').textContent = totalTransactions;
            document.getElementById('monthlyTransactions').textContent = monthlyTransactions;
            document.getElementById('totalInvested').textContent = formatCurrency(totalInvested);
            document.getElementById('totalFees').textContent = formatCurrency(totalFees);
        }
    } catch (error) {
        console.error('Failed to load transaction stats:', error);
    }
}

// Show transaction details modal
async function viewTransactionDetails(transactionId) {
    try {
        const response = await fetch(`/api/transactions/${transactionId}`);
        const data = await response.json();
        
        if (data.success) {
            const transaction = data.data;
            const detailsContent = document.getElementById('transactionDetailsContent');
            
            detailsContent.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Basic Information</h6>
                        <table class="table table-sm">
                            <tr><td><strong>ID:</strong></td><td>${transaction.id}</td></tr>
                            <tr><td><strong>Portfolio:</strong></td><td>${transaction.portfolio_name || 'N/A'}</td></tr>
                            <tr><td><strong>Type:</strong></td><td><span class="badge bg-${getTransactionTypeBadgeClass(transaction.transaction_type)}">${transaction.transaction_type.toUpperCase()}</span></td></tr>
                            <tr><td><strong>Status:</strong></td><td><span class="badge bg-${getStatusBadgeClass(transaction.status)}">${transaction.status.toUpperCase()}</span></td></tr>
                            <tr><td><strong>Date:</strong></td><td>${formatDate(transaction.transaction_date)}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Asset Information</h6>
                        <table class="table table-sm">
                            <tr><td><strong>Symbol:</strong></td><td><strong>${transaction.symbol}</strong></td></tr>
                            <tr><td><strong>Asset Name:</strong></td><td>${transaction.asset_name}</td></tr>
                            <tr><td><strong>Quantity:</strong></td><td>${formatNumber(transaction.quantity)}</td></tr>
                            <tr><td><strong>Price per Unit:</strong></td><td>${formatCurrency(transaction.price_per_unit)}</td></tr>
                            <tr><td><strong>Total Amount:</strong></td><td class="${getAmountClass(transaction.total_amount)}">${formatCurrency(transaction.total_amount)}</td></tr>
                        </table>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <h6>Additional Details</h6>
                        <table class="table table-sm">
                            <tr><td><strong>Fees:</strong></td><td>${formatCurrency(transaction.fees)}</td></tr>
                            <tr><td><strong>Reference Number:</strong></td><td>${transaction.reference_number || 'N/A'}</td></tr>
                            <tr><td><strong>Description:</strong></td><td>${transaction.description || 'N/A'}</td></tr>
                            <tr><td><strong>Created:</strong></td><td>${formatDateTime(transaction.created_at)}</td></tr>
                            <tr><td><strong>Updated:</strong></td><td>${formatDateTime(transaction.updated_at)}</td></tr>
                        </table>
                    </div>
                </div>
            `;
            
            const modal = new bootstrap.Modal(document.getElementById('transactionDetailsModal'));
            modal.show();
        }
    } catch (error) {
        console.error('Failed to load transaction details:', error);
        showAlert('Failed to load transaction details', 'danger');
    }
}

// Apply filters
function applyFilters() {
    currentFilters = {};
    
    const portfolioId = document.getElementById('portfolioFilter').value;
    const type = document.getElementById('typeFilter').value;
    const symbol = document.getElementById('symbolFilter').value.trim();
    const dateFrom = document.getElementById('dateFromFilter').value;
    const dateTo = document.getElementById('dateToFilter').value;
    
    if (portfolioId) currentFilters.portfolio_id = portfolioId;
    if (type) currentFilters.transaction_type = type;
    if (symbol) currentFilters.symbol = symbol.toUpperCase();
    if (dateFrom) currentFilters.date_from = dateFrom;
    if (dateTo) currentFilters.date_to = dateTo;
    
    currentPage = 1;
    loadTransactions();
}

function clearFilters() {
    currentFilters = {};
    currentPage = 1;
    
    document.getElementById('portfolioFilter').value = '';
    document.getElementById('typeFilter').value = '';
    document.getElementById('symbolFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    
    loadTransactions();
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Export button
    document.getElementById('exportTransactions').addEventListener('click', exportTransactions);
    
    // Symbol input formatting
    document.getElementById('symbolFilter').addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
}

// Export transactions (placeholder)
function exportTransactions() {
    showAlert('Export functionality will be implemented soon', 'info');
}

// Utility functions
function formatNumber(number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 6
    }).format(parseFloat(number));
}

function formatDateTime(dateTimeString) {
    return new Date(dateTimeString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showLoading(show = true) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}
