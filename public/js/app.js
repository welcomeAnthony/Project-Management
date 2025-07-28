// Main Application JavaScript for Portfolio Management System

let currentPortfolio = null;
let performanceChart = null;
let allocationChart = null;
let currentEditItemId = null;

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        await loadPortfolios();
        await loadDefaultPortfolio();
        setupEventListeners();
        showSection('dashboard');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showAlert('Failed to initialize application', 'danger');
    }
}

// Section management
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.style.display = 'block';
    }
    
    // Load section-specific data
    switch (sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'portfolios':
            loadPortfoliosSection();
            break;
        case 'add-item':
            loadAddItemSection();
            break;
    }
}

// Dashboard functions
async function loadDashboard() {
    if (!currentPortfolio) {
        await loadDefaultPortfolio();
    }
    
    if (currentPortfolio) {
        await Promise.all([
            loadPortfolioSummary(),
            loadPortfolioItems(),
            loadPerformanceChart(),
            loadAllocationChart()
        ]);
    }
}

async function loadDefaultPortfolio() {
    try {
        const response = await api.getPortfolios();
        if (response.success && response.data.length > 0) {
            currentPortfolio = response.data[0];
        }
    } catch (error) {
        console.error('Failed to load default portfolio:', error);
    }
}

async function loadPortfolioSummary() {
    if (!currentPortfolio) return;
    
    try {
        const response = await api.getPortfolioSummary(currentPortfolio.id);
        if (response.success) {
            const { summary } = response.data;
            
            document.getElementById('totalValue').textContent = formatCurrency(summary.total_current_value);
            document.getElementById('totalGain').textContent = formatCurrency(summary.total_gain_loss);
            document.getElementById('totalItems').textContent = summary.total_items;
            document.getElementById('gainPercent').textContent = formatPercent(summary.overall_gain_loss_percent);
            
            // Update gain/loss colors
            const gainElement = document.getElementById('totalGain');
            const percentElement = document.getElementById('gainPercent');
            const gainClass = getGainLossClass(summary.total_gain_loss);
            
            gainElement.parentElement.className = `card text-center ${summary.total_gain_loss >= 0 ? 'bg-success' : 'bg-danger'} text-white`;
            percentElement.parentElement.className = `card text-center ${summary.total_gain_loss >= 0 ? 'bg-success' : 'bg-danger'} text-white`;
        }
    } catch (error) {
        console.error('Failed to load portfolio summary:', error);
    }
}

async function loadPortfolioItems() {
    if (!currentPortfolio) return;
    
    try {
        const response = await api.getPortfolioItems(currentPortfolio.id);
        if (response.success) {
            displayPortfolioItems(response.data.items);
        }
    } catch (error) {
        console.error('Failed to load portfolio items:', error);
    }
}

function displayPortfolioItems(items) {
    const tbody = document.getElementById('portfolioItemsBody');
    tbody.innerHTML = '';
    
    items.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'fade-in-up';
        
        const gainLossClass = getGainLossClass(item.gain_loss_amount);
        
        row.innerHTML = `
            <td><strong>${item.symbol}</strong></td>
            <td>${item.name}</td>
            <td><span class="badge bg-primary ${getAssetTypeBadgeClass(item.type)}">${item.type.toUpperCase()}</span></td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.purchase_price)}</td>
            <td>${formatCurrency(item.current_price || item.purchase_price)}</td>
            <td>${formatCurrency(item.current_value)}</td>
            <td class="${gainLossClass}">
                ${formatCurrency(item.gain_loss_amount || 0)}<br>
                <small>(${formatPercent(item.gain_loss_percent || 0)})</small>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-item-btn" data-item-id="${item.id}" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger delete-item-btn" data-item-id="${item.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Chart functions
async function loadPerformanceChart() {
    if (!currentPortfolio) return;
    
    try {
        const response = await api.getPortfolioPerformance(currentPortfolio.id, 30);
        if (response.success) {
            const performanceData = response.data.performance;
            
            const ctx = document.getElementById('performanceChart').getContext('2d');
            
            if (performanceChart) {
                performanceChart.destroy();
            }
            
            performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: performanceData.map(p => formatDate(p.date)),
                    datasets: [{
                        label: 'Portfolio Value',
                        data: performanceData.map(p => p.total_value),
                        borderColor: '#007bff',
                        backgroundColor: 'rgba(0, 123, 255, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Value: ${formatCurrency(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Failed to load performance chart:', error);
    }
}

async function loadAllocationChart() {
    if (!currentPortfolio) return;
    
    try {
        const response = await api.getPortfolioAllocation(currentPortfolio.id);
        if (response.success) {
            const allocation = response.data.allocations.by_type;
            
            const ctx = document.getElementById('allocationChart').getContext('2d');
            
            if (allocationChart) {
                allocationChart.destroy();
            }
            
            const colors = [
                '#007bff', '#28a745', '#17a2b8', '#6610f2',
                '#fd7e14', '#20c997', '#6c757d', '#dc3545'
            ];
            
            allocationChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: allocation.map(a => a.type.toUpperCase()),
                    datasets: [{
                        data: allocation.map(a => a.percentage),
                        backgroundColor: colors.slice(0, allocation.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label;
                                    const value = context.parsed;
                                    return `${label}: ${value.toFixed(1)}%`;
                                }
                            }
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.error('Failed to load allocation chart:', error);
    }
}

// Portfolio management
async function loadPortfolios() {
    try {
        const response = await api.getPortfolios();
        if (response.success) {
            updatePortfolioSelect(response.data);
        }
    } catch (error) {
        console.error('Failed to load portfolios:', error);
    }
}

function updatePortfolioSelect(portfolios) {
    const select = document.getElementById('portfolioSelect');
    select.innerHTML = '<option value="">Select Portfolio</option>';
    
    portfolios.forEach(portfolio => {
        const option = document.createElement('option');
        option.value = portfolio.id;
        option.textContent = portfolio.name;
        select.appendChild(option);
    });
}

async function loadPortfoliosSection() {
    try {
        const response = await api.getPortfolios();
        if (response.success) {
            displayPortfoliosList(response.data);
        }
    } catch (error) {
        console.error('Failed to load portfolios section:', error);
    }
}

function displayPortfoliosList(portfolios) {
    const container = document.getElementById('portfoliosList');
    container.innerHTML = '';
    
    portfolios.forEach(portfolio => {
        const card = document.createElement('div');
        card.className = 'card portfolio-card mb-3';
        card.onclick = () => selectPortfolio(portfolio);
        
        card.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${portfolio.name}</h5>
                        <p class="card-text text-muted">${portfolio.description || 'No description'}</p>
                        <small class="text-muted">Created: ${formatDate(portfolio.created_at)}</small>
                    </div>
                    <div class="text-end">
                        <h6 class="text-primary">${formatCurrency(portfolio.calculated_value || 0)}</h6>
                        <small class="text-muted">${portfolio.item_count} items</small>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function selectPortfolio(portfolio) {
    currentPortfolio = portfolio;
    
    // Update active portfolio card
    document.querySelectorAll('.portfolio-card').forEach(card => {
        card.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    // Display portfolio details
    displayPortfolioDetails(portfolio);
    
    // Refresh dashboard if currently viewing it
    if (document.getElementById('dashboard-section').style.display !== 'none') {
        loadDashboard();
    }
}

function displayPortfolioDetails(portfolio) {
    const container = document.getElementById('portfolioDetails');
    container.innerHTML = `
        <h6>${portfolio.name}</h6>
        <p class="text-muted">${portfolio.description || 'No description'}</p>
        <hr>
        <div class="row">
            <div class="col-6">
                <small class="text-muted">Total Value</small>
                <div class="fw-bold">${formatCurrency(portfolio.calculated_value || 0)}</div>
            </div>
            <div class="col-6">
                <small class="text-muted">Items</small>
                <div class="fw-bold">${portfolio.item_count}</div>
            </div>
        </div>
        <div class="mt-3">
            <button class="btn btn-sm btn-outline-primary me-2 edit-portfolio-btn" data-portfolio-id="${portfolio.id}">
                <i class="fas fa-edit me-1"></i>Edit
            </button>
            <button class="btn btn-sm btn-outline-danger delete-portfolio-btn" data-portfolio-id="${portfolio.id}">
                <i class="fas fa-trash me-1"></i>Delete
            </button>
        </div>
    `;
}

// Portfolio CRUD operations
function showCreatePortfolioModal() {
    const modal = new bootstrap.Modal(document.getElementById('createPortfolioModal'));
    document.getElementById('createPortfolioForm').reset();
    clearFormValidation(document.getElementById('createPortfolioForm'));
    modal.show();
}

async function createPortfolio() {
    const form = document.getElementById('createPortfolioForm');
    const formData = new FormData(form);
    
    const portfolioData = {
        name: document.getElementById('portfolioName').value,
        description: document.getElementById('portfolioDescription').value
    };
    
    // Validate form
    const errors = validateForm(form, {
        portfolioName: [{ required: true, label: 'Portfolio Name' }]
    });
    
    if (errors.length > 0) {
        showAlert(errors.join('<br>'), 'danger');
        return;
    }
    
    try {
        const response = await api.createPortfolio(portfolioData);
        if (response.success) {
            showAlert('Portfolio created successfully', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('createPortfolioModal'));
            modal.hide();
            
            await loadPortfolios();
            await loadPortfoliosSection();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Portfolio edit and delete functions
async function editPortfolio(portfolioId) {
    try {
        // For now, show an alert - you can implement a modal later
        const portfolioName = prompt('Enter new portfolio name:');
        if (portfolioName && portfolioName.trim()) {
            await api.updatePortfolio(portfolioId, { 
                name: portfolioName.trim(),
                description: `Updated portfolio: ${portfolioName.trim()}`
            });
            showAlert('Portfolio updated successfully', 'success');
            await loadPortfoliosSection();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function confirmDeletePortfolio(portfolioId) {
    try {
        if (confirm('Are you sure you want to delete this portfolio? This action cannot be undone.')) {
            await api.deletePortfolio(portfolioId);
            showAlert('Portfolio deleted successfully', 'success');
            await loadPortfoliosSection();
            // If this was the current portfolio, reset to default
            if (currentPortfolio && currentPortfolio.id === portfolioId) {
                await loadDefaultPortfolio();
                await loadDashboard();
            }
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Portfolio item management
async function loadAddItemSection() {
    await loadPortfolios();
    document.getElementById('addItemForm').reset();
    clearFormValidation(document.getElementById('addItemForm'));
    
    // Set default date to today
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
}

async function addPortfolioItem() {
    const form = document.getElementById('addItemForm');
    
    const itemData = {
        portfolio_id: parseInt(document.getElementById('portfolioSelect').value),
        symbol: document.getElementById('symbol').value.toUpperCase(),
        name: document.getElementById('name').value,
        type: document.getElementById('type').value,
        quantity: parseFloat(document.getElementById('quantity').value),
        purchase_price: parseFloat(document.getElementById('purchasePrice').value),
        current_price: document.getElementById('currentPrice').value ? parseFloat(document.getElementById('currentPrice').value) : null,
        purchase_date: document.getElementById('purchaseDate').value,
        sector: document.getElementById('sector').value || null,
        currency: document.getElementById('currency').value
    };
    
    // Validate form
    const errors = validateForm(form, {
        portfolioSelect: [{ required: true, label: 'Portfolio' }],
        symbol: [{ required: true, label: 'Symbol' }],
        name: [{ required: true, label: 'Name' }],
        type: [{ required: true, label: 'Type' }],
        quantity: [{ required: true, type: 'number', min: 0, label: 'Quantity' }],
        purchasePrice: [{ required: true, type: 'number', min: 0, label: 'Purchase Price' }],
        purchaseDate: [{ required: true, type: 'date', label: 'Purchase Date' }]
    });
    
    if (errors.length > 0) {
        showAlert(errors.join('<br>'), 'danger');
        return;
    }
    
    try {
        const response = await api.createPortfolioItem(itemData);
        if (response.success) {
            showAlert('Portfolio item added successfully', 'success');
            form.reset();
            clearFormValidation(form);
            
            // Always refresh dashboard and portfolio data after adding an item
            // This ensures the UI is updated regardless of which portfolio the item was added to
            await Promise.all([
                loadDashboard(),
                loadPortfolios() // Refresh portfolio list as well
            ]);
            
            // If we're currently viewing the portfolios section, refresh that too
            const currentSection = document.querySelector('.content-section[style*="block"]');
            if (currentSection && currentSection.id === 'portfolios-section') {
                await loadPortfoliosSection();
            }
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Item editing
async function editItem(itemId) {
    try {
        const response = await api.getPortfolioItem(itemId);
        if (response.success) {
            currentEditItemId = itemId;
            populateEditForm(response.data);
            const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
            modal.show();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function populateEditForm(item) {
    const form = document.getElementById('editItemForm');
    form.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Symbol *</label>
                <input type="text" class="form-control" id="editSymbol" value="${item.symbol}" required>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Name *</label>
                <input type="text" class="form-control" id="editName" value="${item.name}" required>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Type *</label>
                <select class="form-select" id="editType" required>
                    <option value="stock" ${item.type === 'stock' ? 'selected' : ''}>Stock</option>
                    <option value="bond" ${item.type === 'bond' ? 'selected' : ''}>Bond</option>
                    <option value="etf" ${item.type === 'etf' ? 'selected' : ''}>ETF</option>
                    <option value="mutual_fund" ${item.type === 'mutual_fund' ? 'selected' : ''}>Mutual Fund</option>
                    <option value="crypto" ${item.type === 'crypto' ? 'selected' : ''}>Cryptocurrency</option>
                    <option value="cash" ${item.type === 'cash' ? 'selected' : ''}>Cash</option>
                    <option value="other" ${item.type === 'other' ? 'selected' : ''}>Other</option>
                </select>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Sector</label>
                <input type="text" class="form-control" id="editSector" value="${item.sector || ''}">
            </div>
        </div>
        <div class="row">
            <div class="col-md-4 mb-3">
                <label class="form-label">Quantity *</label>
                <input type="number" class="form-control" id="editQuantity" step="0.000001" value="${item.quantity}" required>
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label">Purchase Price *</label>
                <input type="number" class="form-control" id="editPurchasePrice" step="0.01" value="${item.purchase_price}" required>
            </div>
            <div class="col-md-4 mb-3">
                <label class="form-label">Current Price</label>
                <input type="number" class="form-control" id="editCurrentPrice" step="0.01" value="${item.current_price || ''}">
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Purchase Date *</label>
                <input type="date" class="form-control" id="editPurchaseDate" value="${formatDateForInput(item.purchase_date)}" required>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Currency</label>
                <select class="form-select" id="editCurrency">
                    <option value="USD" ${item.currency === 'USD' ? 'selected' : ''}>USD</option>
                    <option value="EUR" ${item.currency === 'EUR' ? 'selected' : ''}>EUR</option>
                    <option value="GBP" ${item.currency === 'GBP' ? 'selected' : ''}>GBP</option>
                    <option value="JPY" ${item.currency === 'JPY' ? 'selected' : ''}>JPY</option>
                    <option value="CAD" ${item.currency === 'CAD' ? 'selected' : ''}>CAD</option>
                </select>
            </div>
        </div>
    `;
}

async function updateItem() {
    if (!currentEditItemId) return;
    
    const form = document.getElementById('editItemForm');
    
    const itemData = {
        symbol: document.getElementById('editSymbol').value.toUpperCase(),
        name: document.getElementById('editName').value,
        type: document.getElementById('editType').value,
        quantity: parseFloat(document.getElementById('editQuantity').value),
        purchase_price: parseFloat(document.getElementById('editPurchasePrice').value),
        current_price: document.getElementById('editCurrentPrice').value ? parseFloat(document.getElementById('editCurrentPrice').value) : null,
        purchase_date: document.getElementById('editPurchaseDate').value,
        sector: document.getElementById('editSector').value || null,
        currency: document.getElementById('editCurrency').value
    };
    
    try {
        const response = await api.updatePortfolioItem(currentEditItemId, itemData);
        if (response.success) {
            showAlert('Portfolio item updated successfully', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editItemModal'));
            modal.hide();
            
            await loadDashboard();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function deleteItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
        const response = await api.deletePortfolioItem(itemId);
        if (response.success) {
            showAlert('Portfolio item deleted successfully', 'success');
            await loadDashboard();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

// Event listeners
function setupEventListeners() {
    // Navigation event listeners
    document.getElementById('nav-dashboard').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('dashboard');
        updateNavigation(this);
    });
    
    document.getElementById('nav-portfolios').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('portfolios');
        updateNavigation(this);
    });
    
    document.getElementById('nav-add-item').addEventListener('click', function(e) {
        e.preventDefault();
        showSection('add-item');
        updateNavigation(this);
    });
    
    // Create portfolio button
    document.getElementById('create-portfolio-btn').addEventListener('click', function() {
        showCreatePortfolioModal();
    });
    
    // Create portfolio form submit
    document.getElementById('create-portfolio-submit').addEventListener('click', function() {
        createPortfolio();
    });
    
    // Update item form submit
    document.getElementById('update-item-submit').addEventListener('click', function() {
        updateItem();
    });
    
    // Add item form submission
    document.getElementById('addItemForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addPortfolioItem();
    });
    
    // Auto-fill current price when purchase price changes
    document.getElementById('purchasePrice').addEventListener('input', function() {
        const currentPriceField = document.getElementById('currentPrice');
        if (!currentPriceField.value) {
            currentPriceField.value = this.value;
        }
    });
    
    // Symbol input formatting
    document.getElementById('symbol').addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });
    
    // Event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        // Edit item button
        if (e.target.closest('.edit-item-btn')) {
            const itemId = e.target.closest('.edit-item-btn').dataset.itemId;
            editItem(parseInt(itemId));
        }
        
        // Delete item button
        if (e.target.closest('.delete-item-btn')) {
            const itemId = e.target.closest('.delete-item-btn').dataset.itemId;
            deleteItem(parseInt(itemId));
        }
        
        // Edit portfolio button
        if (e.target.closest('.edit-portfolio-btn')) {
            const portfolioId = e.target.closest('.edit-portfolio-btn').dataset.portfolioId;
            editPortfolio(parseInt(portfolioId));
        }
        
        // Delete portfolio button
        if (e.target.closest('.delete-portfolio-btn')) {
            const portfolioId = e.target.closest('.delete-portfolio-btn').dataset.portfolioId;
            confirmDeletePortfolio(parseInt(portfolioId));
        }
    });
}

// Utility function to format date for HTML date input (yyyy-MM-dd)
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

// Helper function to update navigation active state
function updateNavigation(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Utility function to refresh all data
async function refreshAll() {
    try {
        showLoading(true);
        await Promise.all([
            loadPortfolios(),
            loadDashboard(),
            loadPortfoliosSection()
        ]);
        showAlert('Data refreshed successfully', 'success');
    } catch (error) {
        showAlert('Failed to refresh data', 'danger');
    } finally {
        showLoading(false);
    }
}
