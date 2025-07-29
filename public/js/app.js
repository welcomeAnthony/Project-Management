// Main Application JavaScript for Portfolio Management System

let currentPortfolio = null;
let performanceChart = null;
let allocationChart = null;
let currentEditItemId = null;
let currentEditPortfolioId = null;

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
            
            // Update dashboard portfolio selector
            const dashboardSelect = document.getElementById('dashboardPortfolioSelect');
            if (dashboardSelect && currentPortfolio) {
                dashboardSelect.value = currentPortfolio.id;
            }
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
            
            // Update gain/loss card colors dynamically
            const gainCard = document.getElementById('gainLossCard');
            const percentCard = document.getElementById('percentCard');
            
            // Remove existing color classes
            gainCard.classList.remove('positive', 'negative', 'neutral');
            percentCard.classList.remove('positive', 'negative', 'neutral');
            
            // Add appropriate color class based on gain/loss
            if (summary.total_gain_loss > 0) {
                gainCard.classList.add('positive');
                percentCard.classList.add('positive');
            } else if (summary.total_gain_loss < 0) {
                gainCard.classList.add('negative');
                percentCard.classList.add('negative');
            } else {
                gainCard.classList.add('neutral');
                percentCard.classList.add('neutral');
            }
        }
    } catch (error) {
        console.error('Failed to load portfolio summary:', error);
    }
}

// Pagination variables
let allPortfolioItems = [];
let currentPage = 1;
const itemsPerPage = 8;

async function loadPortfolioItems() {
    if (!currentPortfolio) return;
    
    try {
        const response = await api.getPortfolioItems(currentPortfolio.id);
        if (response.success) {
            allPortfolioItems = response.data.items;
            currentPage = 1; // Reset to first page
            displayPortfolioItemsWithPagination();
        }
    } catch (error) {
        console.error('Failed to load portfolio items:', error);
    }
}

function displayPortfolioItemsWithPagination() {
    const totalItems = allPortfolioItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Adjust current page if it's beyond the available pages
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    } else if (currentPage < 1) {
        currentPage = 1;
    }
    
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    // Get items for current page
    const currentPageItems = allPortfolioItems.slice(startIndex, endIndex);
    
    // Display items
    displayPortfolioItems(currentPageItems);
    
    // Update pagination controls
    updatePaginationControls(totalItems, totalPages);
}

function updatePaginationControls(totalItems, totalPages) {
    const paginationContainer = document.getElementById('paginationContainer');
    const paginationInfo = document.getElementById('paginationInfo');
    const paginationControls = document.getElementById('paginationControls');
    
    if (totalItems === 0) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    // Show pagination container
    paginationContainer.style.display = 'flex';
    
    // Update info text
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    paginationInfo.textContent = `Showing ${startItem} - ${endItem} of ${totalItems} items`;
    
    // Clear existing pagination buttons
    paginationControls.innerHTML = '';
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>`;
    paginationControls.appendChild(prevLi);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        // Show first page, last page, current page, and pages around current page
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            paginationControls.appendChild(pageLi);
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            // Add ellipsis
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = '<span class="page-link">...</span>';
            paginationControls.appendChild(ellipsisLi);
        }
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>`;
    paginationControls.appendChild(nextLi);
    
    // Add click event listeners to pagination links
    paginationControls.addEventListener('click', handlePaginationClick);
}

function handlePaginationClick(event) {
    event.preventDefault();
    
    if (event.target.classList.contains('page-link')) {
        const newPage = parseInt(event.target.dataset.page);
        if (newPage && newPage !== currentPage) {
            currentPage = newPage;
            displayPortfolioItemsWithPagination();
        }
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
                    <button class="btn btn-outline-success buy-item-btn" data-item-id="${item.id}" title="Buy More">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-outline-danger sell-item-btn" data-item-id="${item.id}" title="Sell">
                        <i class="fas fa-minus"></i>
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
            let performanceData = response.data.performance;
            
            // If no historical data, create a simple chart with current portfolio value
            if (!performanceData || performanceData.length === 0) {
                const currentDate = new Date();
                const currentValue = currentPortfolio.total_value || 0;
                
                // Create a simple 7-day chart with current value
                performanceData = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(currentDate);
                    date.setDate(date.getDate() - i);
                    performanceData.push({
                        date: date.toISOString().split('T')[0],
                        total_value: currentValue
                    });
                }
            }
            
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
                        data: performanceData.map(p => parseFloat(p.total_value) || 0),
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
    // Update the Add Item form portfolio selector
    const select = document.getElementById('portfolioSelect');
    select.innerHTML = '<option value="">Select Portfolio</option>';
    
    portfolios.forEach(portfolio => {
        const option = document.createElement('option');
        option.value = portfolio.id;
        option.textContent = portfolio.name;
        select.appendChild(option);
    });
    
    // Update the Dashboard portfolio selector
    const dashboardSelect = document.getElementById('dashboardPortfolioSelect');
    if (dashboardSelect) {
        dashboardSelect.innerHTML = '<option value="">Select Portfolio...</option>';
        
        portfolios.forEach(portfolio => {
            const option = document.createElement('option');
            option.value = portfolio.id;
            option.textContent = portfolio.name;
            if (currentPortfolio && portfolio.id === currentPortfolio.id) {
                option.selected = true;
            }
            dashboardSelect.appendChild(option);
        });
    }
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

// Switch to a specific portfolio
async function switchToPortfolio(portfolioId) {
    try {
        showLoading(true);
        const response = await api.getPortfolio(portfolioId);
        if (response.success) {
            currentPortfolio = response.data;
            await loadDashboard();
            showAlert(`Switched to portfolio: ${currentPortfolio.name}`, 'success');
        }
    } catch (error) {
        showAlert('Failed to switch portfolio: ' + error.message, 'danger');
    } finally {
        showLoading(false);
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
    
    // Check if portfolio has items to determine if delete should be enabled
    const hasItems = portfolio.item_count > 0;
    const deleteButtonClass = hasItems ? 'btn-outline-secondary disabled' : 'btn-outline-danger';
    const deleteButtonTitle = hasItems ? 'Cannot delete portfolio with items' : 'Delete portfolio';
    
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
            <button class="btn btn-sm ${deleteButtonClass} delete-portfolio-btn" 
                    data-portfolio-id="${portfolio.id}" 
                    title="${deleteButtonTitle}"
                    ${hasItems ? 'disabled' : ''}>
                <i class="fas fa-trash me-1"></i>Delete
            </button>
        </div>
        ${hasItems ? '<small class="text-muted mt-2 d-block"><i class="fas fa-info-circle me-1"></i>Remove all items before deleting this portfolio</small>' : ''}
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
        // Get the portfolio details first
        const portfolioResponse = await api.getPortfolio(portfolioId);
        if (!portfolioResponse.success) {
            showAlert('Failed to get portfolio details', 'danger');
            return;
        }
        
        const portfolio = portfolioResponse.data;
        currentEditPortfolioId = portfolioId;
        
        // Show the edit modal with current data
        showEditPortfolioModal(portfolio);
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function showEditPortfolioModal(portfolio) {
    const modal = new bootstrap.Modal(document.getElementById('editPortfolioModal'));
    const form = document.getElementById('editPortfolioForm');
    
    // Populate the form with current data
    document.getElementById('editPortfolioName').value = portfolio.name;
    document.getElementById('editPortfolioDescription').value = portfolio.description || '';
    
    // Clear any previous validation
    clearFormValidation(form);
    
    modal.show();
}

async function updatePortfolio() {
    const form = document.getElementById('editPortfolioForm');
    
    const portfolioData = {
        name: document.getElementById('editPortfolioName').value.trim(),
        description: document.getElementById('editPortfolioDescription').value.trim()
    };
    
    // Validate form
    const errors = validateForm(form, {
        editPortfolioName: [{ required: true, label: 'Portfolio Name' }]
    });
    
    if (errors.length > 0) {
        showAlert(errors.join('<br>'), 'danger');
        return;
    }
    
    try {
        const response = await api.updatePortfolio(currentEditPortfolioId, portfolioData);
        if (response.success) {
            showAlert('Portfolio updated successfully', 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPortfolioModal'));
            modal.hide();
            
            // Refresh the portfolios section
            await loadPortfoliosSection();
            
            // Update current portfolio if it was the one being edited
            if (currentPortfolio && currentPortfolio.id === currentEditPortfolioId) {
                currentPortfolio = { ...currentPortfolio, ...portfolioData };
                await loadDashboard();
            }
            
            // Reset the edit ID
            currentEditPortfolioId = null;
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function confirmDeletePortfolio(portfolioId) {
    try {
        // Get the portfolio details first to check item count
        const portfolioResponse = await api.getPortfolio(portfolioId);
        if (!portfolioResponse.success) {
            showAlert('Failed to get portfolio details', 'danger');
            return;
        }
        
        const portfolio = portfolioResponse.data;
        
        // Check if portfolio has any items
        if (portfolio.item_count > 0) {
            showAlert(`Cannot delete portfolio "${portfolio.name}" because it contains ${portfolio.item_count} item(s). Please remove all items first.`, 'warning');
            return;
        }
        
        if (confirm(`Are you sure you want to delete the portfolio "${portfolio.name}"? This action cannot be undone.`)) {
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

// Buy/Sell functionality
async function buyMoreShares(itemId) {
    try {
        const response = await api.getPortfolioItem(itemId);
        if (response.success) {
            const item = response.data;
            currentEditItemId = itemId;
            showBuyModal(item);
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function showBuyModal(item) {
    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    const modalTitle = document.querySelector('#editItemModal .modal-title');
    const form = document.getElementById('editItemForm');
    
    modalTitle.textContent = `Buy More - ${item.symbol}`;
    
    form.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Current Position:</strong> ${item.quantity} shares at $${parseFloat(item.purchase_price).toFixed(2)} avg. cost
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Additional Quantity *</label>
                <input type="number" class="form-control" id="buyQuantity" step="0.000001" required placeholder="Enter quantity to buy">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Purchase Price *</label>
                <input type="number" class="form-control" id="buyPrice" step="0.01" required value="${item.current_price || item.purchase_price}" placeholder="Enter purchase price">
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Purchase Date *</label>
                <input type="date" class="form-control" id="buyDate" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Current Price</label>
                <input type="number" class="form-control" id="buyCurrentPrice" step="0.01" value="${item.current_price || ''}" placeholder="Optional: Update current price">
            </div>
        </div>
    `;
    
    // Update the submit button to handle buy logic
    const submitBtn = document.getElementById('update-item-submit');
    submitBtn.textContent = 'Buy Shares';
    submitBtn.onclick = handleBuyShares;
    
    modal.show();
}

async function handleBuyShares() {
    const buyQuantity = parseFloat(document.getElementById('buyQuantity').value);
    const buyPrice = parseFloat(document.getElementById('buyPrice').value);
    const buyDate = document.getElementById('buyDate').value;
    const newCurrentPrice = document.getElementById('buyCurrentPrice').value;
    
    if (!buyQuantity || !buyPrice || !buyDate) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    try {
        // Get current item data
        const response = await api.getPortfolioItem(currentEditItemId);
        if (!response.success) {
            throw new Error('Failed to get current item data');
        }
        
        const currentItem = response.data;
        const currentQuantity = parseFloat(currentItem.quantity);
        const currentAvgPrice = parseFloat(currentItem.purchase_price);
        
        // Calculate new weighted average purchase price
        const totalValue = (currentQuantity * currentAvgPrice) + (buyQuantity * buyPrice);
        const newTotalQuantity = currentQuantity + buyQuantity;
        const newAvgPrice = totalValue / newTotalQuantity;
        
        // Prepare update data
        const updateData = {
            quantity: newTotalQuantity,
            purchase_price: newAvgPrice,
            purchase_date: buyDate // Use latest purchase date
        };
        
        // Update current price if provided
        if (newCurrentPrice) {
            updateData.current_price = parseFloat(newCurrentPrice);
        }
        
        const updateResponse = await api.updatePortfolioItem(currentEditItemId, updateData);
        if (updateResponse.success) {
            showAlert(`Successfully bought ${buyQuantity} more shares of ${currentItem.symbol}`, 'success');
            bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
            await loadDashboard();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function sellShares(itemId) {
    try {
        const response = await api.getPortfolioItem(itemId);
        if (response.success) {
            const item = response.data;
            currentEditItemId = itemId;
            showSellModal(item);
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function showSellModal(item) {
    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    const modalTitle = document.querySelector('#editItemModal .modal-title');
    const form = document.getElementById('editItemForm');
    
    modalTitle.textContent = `Sell - ${item.symbol}`;
    
    const currentValue = parseFloat(item.quantity) * parseFloat(item.current_price || item.purchase_price);
    
    form.innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Current Position:</strong> ${item.quantity} shares worth $${currentValue.toFixed(2)}
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Quantity to Sell *</label>
                <input type="number" class="form-control" id="sellQuantity" step="0.000001" required max="${item.quantity}" placeholder="Enter quantity to sell">
                <small class="form-text text-muted">Maximum: ${item.quantity} shares</small>
                <div class="invalid-feedback" id="quantityError" style="display: none;">
                    You cannot sell more than ${item.quantity} shares
                </div>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Sell Price *</label>
                <input type="number" class="form-control" id="sellPrice" step="0.01" required value="${item.current_price || item.purchase_price}" placeholder="Enter sell price">
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Sell Date *</label>
                <input type="date" class="form-control" id="sellDate" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="col-md-6 mb-3">
                <div class="form-check mt-4">
                    <input class="form-check-input" type="checkbox" id="sellAll" ${parseFloat(item.quantity) <= 1 ? 'checked' : ''}>
                    <label class="form-check-label" for="sellAll">
                        Sell entire position
                    </label>
                </div>
            </div>
        </div>
        <div class="row" id="sellPreview" style="display: none;">
            <div class="col-12">
                <div class="alert alert-info">
                    <h6>Transaction Preview:</h6>
                    <div class="row">
                        <div class="col-md-4">
                            <strong>Selling:</strong> <span id="previewQuantity">0</span> shares
                        </div>
                        <div class="col-md-4">
                            <strong>Total Value:</strong> $<span id="previewValue">0.00</span>
                        </div>
                        <div class="col-md-4">
                            <strong>Remaining:</strong> <span id="previewRemaining">0</span> shares
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add event listener for sell all checkbox
    document.getElementById('sellAll').addEventListener('change', function() {
        const sellQuantityInput = document.getElementById('sellQuantity');
        if (this.checked) {
            sellQuantityInput.value = item.quantity;
            sellQuantityInput.readOnly = true;
        } else {
            sellQuantityInput.readOnly = false;
            sellQuantityInput.value = '';
        }
        updateSellPreview(item);
    });
    
    // Add real-time validation for quantity input
    document.getElementById('sellQuantity').addEventListener('input', function() {
        validateSellQuantity(item, this);
        updateSellPreview(item);
    });
    
    // Add event listener for price changes to update preview
    document.getElementById('sellPrice').addEventListener('input', function() {
        updateSellPreview(item);
    });
    
    // Function to validate sell quantity
    function validateSellQuantity(item, input) {
        const sellQuantity = parseFloat(input.value);
        const maxQuantity = parseFloat(item.quantity);
        const quantityError = document.getElementById('quantityError');
        const submitBtn = document.getElementById('update-item-submit');
        
        if (sellQuantity > maxQuantity) {
            input.classList.add('is-invalid');
            quantityError.style.display = 'block';
            submitBtn.disabled = true;
        } else {
            input.classList.remove('is-invalid');
            quantityError.style.display = 'none';
            submitBtn.disabled = false;
        }
    }
    
    // Function to update sell preview
    function updateSellPreview(item) {
        const sellQuantity = parseFloat(document.getElementById('sellQuantity').value) || 0;
        const sellPrice = parseFloat(document.getElementById('sellPrice').value) || 0;
        const maxQuantity = parseFloat(item.quantity);
        
        if (sellQuantity > 0 && sellPrice > 0) {
            const totalValue = sellQuantity * sellPrice;
            const remainingShares = Math.max(0, maxQuantity - sellQuantity);
            
            document.getElementById('previewQuantity').textContent = sellQuantity.toFixed(6);
            document.getElementById('previewValue').textContent = totalValue.toFixed(2);
            document.getElementById('previewRemaining').textContent = remainingShares.toFixed(6);
            document.getElementById('sellPreview').style.display = 'block';
        } else {
            document.getElementById('sellPreview').style.display = 'none';
        }
    }
    
    // Update the submit button to handle sell logic
    const submitBtn = document.getElementById('update-item-submit');
    submitBtn.textContent = 'Sell Shares';
    submitBtn.onclick = handleSellShares;
    
    modal.show();
}

async function handleSellShares() {
    const sellQuantity = parseFloat(document.getElementById('sellQuantity').value);
    const sellPrice = parseFloat(document.getElementById('sellPrice').value);
    const sellDate = document.getElementById('sellDate').value;
    const sellAll = document.getElementById('sellAll').checked;
    
    // Validation
    if (!sellQuantity || !sellPrice || !sellDate) {
        showAlert('Please fill in all required fields', 'warning');
        return;
    }
    
    if (sellQuantity <= 0) {
        showAlert('Sell quantity must be greater than 0', 'danger');
        return;
    }
    
    if (sellPrice <= 0) {
        showAlert('Sell price must be greater than 0', 'danger');
        return;
    }
    
    try {
        // Get current item data
        const response = await api.getPortfolioItem(currentEditItemId);
        if (!response.success) {
            throw new Error('Failed to get current item data');
        }
        
        const currentItem = response.data;
        const currentQuantity = parseFloat(currentItem.quantity);
        
        // Enhanced validation with specific error messages
        if (sellQuantity > currentQuantity) {
            showAlert(`Cannot sell ${sellQuantity} shares. You only own ${currentQuantity} shares of ${currentItem.symbol}`, 'danger');
            
            // Highlight the invalid input
            const sellQuantityInput = document.getElementById('sellQuantity');
            sellQuantityInput.classList.add('is-invalid');
            document.getElementById('quantityError').style.display = 'block';
            return;
        }
        
        // Confirmation dialog with detailed information
        const totalSellValue = sellQuantity * sellPrice;
        const remainingShares = currentQuantity - sellQuantity;
        const confirmMessage = sellAll || sellQuantity >= currentQuantity 
            ? `Are you sure you want to sell ALL ${currentQuantity} shares of ${currentItem.symbol} for $${totalSellValue.toFixed(2)}? This will completely remove this position from your portfolio.`
            : `Are you sure you want to sell ${sellQuantity} shares of ${currentItem.symbol} for $${totalSellValue.toFixed(2)}? You will have ${remainingShares.toFixed(6)} shares remaining.`;
            
        if (!confirm(confirmMessage)) {
            return;
        }
        
        if (sellAll || sellQuantity >= currentQuantity) {
            // Delete the entire position
            const deleteResponse = await api.deletePortfolioItem(currentEditItemId);
            if (deleteResponse.success) {
                showAlert(`Successfully sold all ${currentQuantity} shares of ${currentItem.symbol} for $${totalSellValue.toFixed(2)}`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
                await loadDashboard();
            }
        } else {
            // Reduce quantity
            const newQuantity = currentQuantity - sellQuantity;
            const updateData = {
                quantity: newQuantity,
                current_price: sellPrice // Update current price with sell price
            };
            
            const updateResponse = await api.updatePortfolioItem(currentEditItemId, updateData);
            if (updateResponse.success) {
                showAlert(`Successfully sold ${sellQuantity} shares of ${currentItem.symbol} for $${totalSellValue.toFixed(2)}. ${newQuantity.toFixed(6)} shares remaining.`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
                await loadDashboard();
            }
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
    
    // Edit portfolio form submit
    document.getElementById('edit-portfolio-submit').addEventListener('click', function() {
        updatePortfolio();
    });
    
    // Update item form submit
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
    
    // Dashboard portfolio selector
    document.getElementById('dashboardPortfolioSelect').addEventListener('change', async function() {
        const portfolioId = parseInt(this.value);
        if (portfolioId) {
            await switchToPortfolio(portfolioId);
        }
    });
    
    // Event delegation for dynamically created buttons
    document.addEventListener('click', function(e) {
        // Buy more button
        if (e.target.closest('.buy-item-btn')) {
            const itemId = e.target.closest('.buy-item-btn').dataset.itemId;
            buyMoreShares(parseInt(itemId));
        }
        
        // Sell button
        if (e.target.closest('.sell-item-btn')) {
            const itemId = e.target.closest('.sell-item-btn').dataset.itemId;
            sellShares(parseInt(itemId));
        }
        
        // Edit portfolio button
        if (e.target.closest('.edit-portfolio-btn')) {
            const portfolioId = e.target.closest('.edit-portfolio-btn').dataset.portfolioId;
            editPortfolio(parseInt(portfolioId));
        }
        
        // Delete portfolio button - only if not disabled
        if (e.target.closest('.delete-portfolio-btn') && !e.target.closest('.delete-portfolio-btn').disabled) {
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

//new
// 假设 allPortfolioItems 存储所有项目，displayPortfolioItems(items) 渲染表格
document.getElementById('portfolioSearchBtn').addEventListener('click', function() {
    const query = document.getElementById('portfolioSearchInput').value.trim().toLowerCase();
    if (!query) {
        displayPortfolioItemsWithPagination(); // 显示全部
        return;
    }
    const filtered = allPortfolioItems.filter(item =>
        (item.symbol && item.symbol.toLowerCase().includes(query)) ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.type && item.type.toLowerCase().includes(query))
    );
    displayPortfolioItems(filtered);
});

// 支持回车搜索
document.getElementById('portfolioSearchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('portfolioSearchBtn').click();
    }
});
