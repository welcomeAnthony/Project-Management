// Main Application JavaScript for Portfolio Management System

let currentPortfolio = null;
let performanceChart = null;
let allocationChart = null;
let currentEditItemId = null;
let currentEditPortfolioId = null;

// Market indices variables
let marketIndicesData = [];
let currentMarketIndex = 0;
let marketFlipInterval = null;
let marketDataInterval = null;

// Application initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Initialize market indices display
        initializeMarketIndices();
        
        await loadPortfolios();
        await loadDefaultPortfolio();
        setupEventListeners();
        showSection('dashboard');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showAlert('Failed to initialize application', 'danger');
    }
}

// Market Indices Functions
async function initializeMarketIndices() {
    try {
        console.log('🎯 Initializing market indices display...');
        
        // Check if the display element exists
        const flipDisplay = document.getElementById('marketFlipDisplay');
        if (!flipDisplay) {
            console.error('❌ Market flip display element not found!');
            return;
        }
        console.log('✅ Market flip display element found');
        
        // Create tooltip element
        createMarketTooltip();
        
        // Load initial market data
        await loadMarketIndicesData();
        
        // Start the flip display
        startMarketFlipDisplay();
        
        // Set up hover events
        setupMarketHoverEvents();
        
        // Set up interval to refresh data every 10 minutes
        marketDataInterval = setInterval(loadMarketIndicesData, 10 * 60 * 1000);
        
        console.log('✅ Market indices display initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize market indices:', error);
        // Show fallback display
        showMarketFallback();
    }
}

async function loadMarketIndicesData() {
    try {
        console.log('📡 Loading market indices data...');
        const response = await fetch('/api/market/indices');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            marketIndicesData = data.data;
            console.log('✅ Market indices data loaded:', marketIndicesData.length, 'indices');
            console.log('📊 Sample data:', marketIndicesData[0]);
        } else {
            console.warn('⚠️ No market indices data received');
            showMarketFallback();
        }
    } catch (error) {
        console.error('❌ Error loading market indices data:', error);
        showMarketFallback();
    }
}

function startMarketFlipDisplay() {
    const flipDisplay = document.getElementById('marketFlipDisplay');
    if (!flipDisplay) return;
    
    // Clear any existing interval
    if (marketFlipInterval) {
        clearInterval(marketFlipInterval);
    }
    
    // Start with the first index
    currentMarketIndex = 0;
    updateFlipDisplay();
    
    // Set up interval to flip every 10 seconds
    marketFlipInterval = setInterval(() => {
        if (marketIndicesData.length > 0) {
            currentMarketIndex = (currentMarketIndex + 1) % marketIndicesData.length;
            updateFlipDisplay();
        }
    }, 1800);
}

function updateFlipDisplay() {
    const flipDisplay = document.getElementById('marketFlipDisplay');
    if (!flipDisplay || marketIndicesData.length === 0) {
        console.warn('⚠️ Cannot update flip display - element missing or no data');
        return;
    }
    
    const currentData = marketIndicesData[currentMarketIndex];
    if (!currentData) {
        console.warn('⚠️ No data for index:', currentMarketIndex);
        return;
    }
    
    console.log('🔄 Updating flip display with:', currentData.symbol, currentData.price);
    
    // Find existing flip item or create new one
    let flipItem = flipDisplay.querySelector('.flip-item');
    if (!flipItem) {
        flipItem = document.createElement('div');
        flipItem.className = 'flip-item';
        flipDisplay.appendChild(flipItem);
        console.log('➕ Created new flip item');
    }
    
    // Determine change class and sign
    let changeClass = 'neutral';
    let changeSign = '';
    let changeValue = currentData.change;
    
    if (changeValue !== 'N/A' && changeValue !== '--') {
        const changeNum = parseFloat(changeValue);
        if (changeNum > 0) {
            changeClass = 'positive';
            changeSign = '+';
        } else if (changeNum < 0) {
            changeClass = 'negative';
            changeSign = '';
        }
    }
    
    // Create new content
    const newContent = `
        <div class="flip-content">
            <span class="index-name" title="${currentData.name}">${currentData.symbol}</span>
            <span class="index-value">${currentData.price !== 'N/A' ? formatMarketPrice(currentData.price) : 'N/A'}</span>
            <span class="index-change ${changeClass}">
                ${changeValue !== 'N/A' ? `${changeSign}${changeValue}` : 'N/A'}
            </span>
        </div>
    `;
    
    // Add exit animation to current item
    flipItem.classList.add('exit');
    
    // Create new item with new content
    setTimeout(() => {
        flipItem.innerHTML = newContent;
        flipItem.classList.remove('exit');
        flipItem.classList.add('active');
        
        // Remove active class after animation
        setTimeout(() => {
            flipItem.classList.remove('active');
        }, 800);
    }, 400);
}

function formatMarketPrice(price) {
    const num = parseFloat(price);
    if (isNaN(num)) return price;
    
    // Always show full precision with 2 decimal places
    return num.toFixed(2);
}

function createMarketTooltip() {
    // Remove existing tooltip if any
    const existingTooltip = document.getElementById('marketTooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'marketTooltip';
    tooltip.className = 'market-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
}

function setupMarketHoverEvents() {
    const container = document.querySelector('.market-indices-container');
    if (!container) return;
    
    let hoverTimeout;
    
    container.addEventListener('mouseenter', function() {
        // Clear any existing timeout
        clearTimeout(hoverTimeout);
        
        // Show tooltip after a short delay
        hoverTimeout = setTimeout(() => {
            showMarketTooltip();
        }, 300);
    });
    
    container.addEventListener('mouseleave', function() {
        // Clear timeout and hide tooltip
        clearTimeout(hoverTimeout);
        hideMarketTooltip();
    });
    
    // Update tooltip position on mouse move
    container.addEventListener('mousemove', function(e) {
        updateTooltipPosition(e);
    });
}

function showMarketTooltip() {
    if (marketIndicesData.length === 0) return;
    
    const tooltip = document.getElementById('marketTooltip');
    if (!tooltip) return;
    
    // Create tooltip content
    let tooltipContent = '<div class="tooltip-header">Market Indices</div>';
    
    marketIndicesData.forEach(index => {
        let changeClass = 'neutral';
        let changeSign = '';
        
        if (index.change !== 'N/A' && index.change !== '--') {
            const changeNum = parseFloat(index.change);
            if (changeNum > 0) {
                changeClass = 'positive';
                changeSign = '+';
            } else if (changeNum < 0) {
                changeClass = 'negative';
                changeSign = '';
            }
        }
        
        tooltipContent += `
            <div class="tooltip-item">
                <div class="tooltip-symbol">${index.symbol}</div>
                <div class="tooltip-name">${index.name}</div>
                <div class="tooltip-price">$${formatMarketPrice(index.price)}</div>
                <div class="tooltip-change ${changeClass}">
                    ${index.change !== 'N/A' ? `${changeSign}${index.change} (${changeSign}${index.changePercent}%)` : 'N/A'}
                </div>
            </div>
        `;
    });
    
    tooltip.innerHTML = tooltipContent;
    tooltip.style.display = 'block';
}

function hideMarketTooltip() {
    const tooltip = document.getElementById('marketTooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

function updateTooltipPosition(e) {
    const tooltip = document.getElementById('marketTooltip');
    if (!tooltip || tooltip.style.display === 'none') return;
    
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = e.clientX + 15;
    let top = e.clientY - 10;
    
    // Adjust if tooltip would go off screen
    if (left + rect.width > viewportWidth) {
        left = e.clientX - rect.width - 15;
    }
    
    if (top + rect.height > viewportHeight) {
        top = e.clientY - rect.height - 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
}

function showMarketFallback() {
    const flipDisplay = document.getElementById('marketFlipDisplay');
    if (!flipDisplay) return;
    
    flipDisplay.innerHTML = `
        <div class="flip-item active">
            <div class="flip-content">
                <span class="index-name">Market</span>
                <span class="index-value">Data</span>
                <span class="index-change neutral">Loading</span>
            </div>
        </div>
    `;
}

// Cleanup function for market intervals
function cleanupMarketIndices() {
    if (marketFlipInterval) {
        clearInterval(marketFlipInterval);
        marketFlipInterval = null;
    }
    if (marketDataInterval) {
        clearInterval(marketDataInterval);
        marketDataInterval = null;
    }
    
    // Remove tooltip
    const tooltip = document.getElementById('marketTooltip');
    if (tooltip) {
        tooltip.remove();
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
        } else {
            // No portfolios available
            currentPortfolio = null;

            // Clear dashboard portfolio selector
            const dashboardSelect = document.getElementById('dashboardPortfolioSelect');
            if (dashboardSelect) {
                dashboardSelect.value = '';
            }
        }
    } catch (error) {
        console.error('Failed to load default portfolio:', error);
        currentPortfolio = null;
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
                        total_value: currentValue,
                        daily_change: 0,
                        daily_change_percent: 0
                    });
                }
            }
            
            const ctx = document.getElementById('performanceChart').getContext('2d');
            
            if (performanceChart) {
                performanceChart.destroy();
            }
            
            // Get selected view mode from dropdown
            const viewMode = document.getElementById('performanceViewSelect')?.value || 'value';
            const viewModes = viewMode === 'all' ? ['value', 'change', 'percent'] : viewMode.split(',');
            
            // Build datasets based on selected view modes
            const datasets = [];
            
            // Portfolio Value dataset with dynamic colors
            if (viewModes.includes('value')) {
                const portfolioValues = performanceData.map(p => parseFloat(p.total_value) || 0);
                const initialValue = portfolioValues[0] || 0;
                
                // Create dynamic colors based on gain/loss from initial value
                const portfolioColors = portfolioValues.map(value => {
                    return value >= initialValue ? 'rgba(0, 123, 255, 0.8)' : 'rgba(220, 53, 69, 0.8)';
                });
                
                // Create segment colors for the line
                const portfolioSegmentColors = [];
                for (let i = 0; i < portfolioValues.length - 1; i++) {
                    if (portfolioValues[i + 1] >= initialValue) {
                        portfolioSegmentColors.push('rgba(0, 123, 255, 0.8)');
                    } else {
                        portfolioSegmentColors.push('rgba(220, 53, 69, 0.8)');
                    }
                }
                
                datasets.push({
                    label: 'Portfolio Value',
                    data: portfolioValues,
                    borderColor: function(context) {
                        const value = context.parsed?.y || 0;
                        return value >= initialValue ? '#007bff' : '#dc3545';
                    },
                    backgroundColor: function(context) {
                        const value = context.parsed?.y || 0;
                        return value >= initialValue ? 'rgba(0, 123, 255, 0.1)' : 'rgba(220, 53, 69, 0.1)';
                    },
                    segment: {
                        borderColor: function(ctx) {
                            const value = ctx.p1.parsed.y;
                            return value >= initialValue ? '#007bff' : '#dc3545';
                        }
                    },
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    yAxisID: 'y',
                    pointBackgroundColor: portfolioColors,
                    pointBorderColor: portfolioColors
                });
            }
            
            // Daily Change dataset with dynamic colors
            if (viewModes.includes('change')) {
                const dailyChanges = performanceData.map(p => parseFloat(p.daily_change) || 0);
                
                // Create dynamic colors based on positive/negative values
                const changeColors = dailyChanges.map(value => {
                    return value >= 0 ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)';
                });
                
                datasets.push({
                    label: 'Daily Change ($)',
                    data: dailyChanges,
                    borderColor: function(context) {
                        const value = context.parsed?.y || 0;
                        return value >= 0 ? '#28a745' : '#dc3545';
                    },
                    backgroundColor: function(context) {
                        const value = context.parsed?.y || 0;
                        return value >= 0 ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)';
                    },
                    segment: {
                        borderColor: function(ctx) {
                            const value = ctx.p1.parsed.y;
                            return value >= 0 ? '#28a745' : '#dc3545';
                        }
                    },
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: viewModes.includes('value') ? 'y1' : 'y',
                    pointBackgroundColor: changeColors,
                    pointBorderColor: changeColors
                });
            }
            
            // Daily Change Percent dataset with dynamic colors
            if (viewModes.includes('percent')) {
                const dailyChangePercents = performanceData.map(p => parseFloat(p.daily_change_percent) || 0);
                
                // Create dynamic colors based on positive/negative values
                const percentColors = dailyChangePercents.map(value => {
                    return value >= 0 ? 'rgba(23, 162, 184, 0.8)' : 'rgba(220, 53, 69, 0.8)';
                });
                
                datasets.push({
                    label: 'Daily Change (%)',
                    data: dailyChangePercents,
                    borderColor: function(context) {
                        const value = context.parsed?.y || 0;
                        return value >= 0 ? '#17a2b8' : '#dc3545';
                    },
                    backgroundColor: function(context) {
                        const value = context.parsed?.y || 0;
                        return value >= 0 ? 'rgba(23, 162, 184, 0.1)' : 'rgba(220, 53, 69, 0.1)';
                    },
                    segment: {
                        borderColor: function(ctx) {
                            const value = ctx.p1.parsed.y;
                            return value >= 0 ? '#17a2b8' : '#dc3545';
                        }
                    },
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    yAxisID: (viewModes.includes('value') || viewModes.includes('change')) ? 'y2' : 'y',
                    pointBackgroundColor: percentColors,
                    pointBorderColor: percentColors
                });
            }
            
            // Configure chart scales based on visible datasets
            const scales = {};
            
            // Primary y-axis (left side)
            if (viewModes.includes('value')) {
                scales.y = {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: 'Portfolio Value'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                };
            } else if (viewModes.includes('change') && !viewModes.includes('percent')) {
                scales.y = {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Daily Change ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                };
            } else if (viewModes.includes('percent') && !viewModes.includes('change')) {
                scales.y = {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Daily Change (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                };
            }
            
            // Secondary y-axis (right side)
            if (viewModes.includes('value') && viewModes.includes('change')) {
                scales.y1 = {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Daily Change ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: function(context) {
                            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                };
            } else if (viewModes.includes('value') && viewModes.includes('percent')) {
                scales.y1 = {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Daily Change (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: function(context) {
                            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                };
            } else if (viewModes.includes('change') && viewModes.includes('percent') && !viewModes.includes('value')) {
                scales.y = {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Daily Change ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    },
                    grid: {
                        color: function(context) {
                            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                };
                scales.y1 = {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Daily Change (%)'
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: function(context) {
                            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                };
            }
            
            // Third y-axis for "all" option
            if (viewModes.length === 3 || viewMode === 'all') {
                scales.y2 = {
                    type: 'linear',
                    display: false, // Hide to avoid clutter
                    position: 'right',
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false,
                        color: function(context) {
                            return context.tick.value === 0 ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                        }
                    }
                };
            }
            
            performanceChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: performanceData.map(p => formatDate(p.date)),
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    scales: scales,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.dataset.label;
                                    const value = context.parsed.y;
                                    
                                    if (label === 'Portfolio Value') {
                                        return `${label}: ${formatCurrency(value)}`;
                                    } else if (label === 'Daily Change ($)') {
                                        const sign = value >= 0 ? '+' : '';
                                        const color = value >= 0 ? '🟢' : '🔴';
                                        return `${color} ${label}: ${sign}${formatCurrency(value)}`;
                                    } else if (label === 'Daily Change (%)') {
                                        const sign = value >= 0 ? '+' : '';
                                        const color = value >= 0 ? '🟢' : '🔴';
                                        return `${color} ${label}: ${sign}${value.toFixed(2)}%`;
                                    }
                                    return `${label}: ${value}`;
                                },
                                labelColor: function(context) {
                                    const value = context.parsed.y;
                                    if (context.dataset.label === 'Portfolio Value') {
                                        const initialValue = context.dataset.data[0] || 0;
                                        return {
                                            borderColor: value >= initialValue ? '#007bff' : '#dc3545',
                                            backgroundColor: value >= initialValue ? '#007bff' : '#dc3545'
                                        };
                                    } else {
                                        return {
                                            borderColor: value >= 0 ? '#28a745' : '#dc3545',
                                            backgroundColor: value >= 0 ? '#28a745' : '#dc3545'
                                        };
                                    }
                                }
                            }
                        },
                        legend: {
                            labels: {
                                generateLabels: function(chart) {
                                    const original = Chart.defaults.plugins.legend.labels.generateLabels;
                                    const labels = original.call(this, chart);
                                    
                                    labels.forEach(label => {
                                        if (label.text.includes('Daily Change')) {
                                            label.text = `${label.text} (🟢 Gain / 🔴 Loss)`;
                                        }
                                    });
                                    
                                    return labels;
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

// async function loadPerformanceChart() {
//     if (!currentPortfolio) return;
    
//     try {
//         const response = await api.getPortfolioPerformance(currentPortfolio.id, 30);
//         if (response.success) {
//             let performanceData = response.data.performance;
            
//             // If no historical data, create a simple chart with current portfolio value
//             if (!performanceData || performanceData.length === 0) {
//                 const currentDate = new Date();
//                 const currentValue = currentPortfolio.total_value || 0;
                
//                 // Create a simple 7-day chart with current value
//                 performanceData = [];
//                 for (let i = 6; i >= 0; i--) {
//                     const date = new Date(currentDate);
//                     date.setDate(date.getDate() - i);
//                     performanceData.push({
//                         date: date.toISOString().split('T')[0],
//                         total_value: currentValue,
//                         daily_change: 0,
//                         daily_change_percent: 0
//                     });
//                 }
//             }
            
//             const ctx = document.getElementById('performanceChart').getContext('2d');
            
//             if (performanceChart) {
//                 performanceChart.destroy();
//             }
            
//             // Get selected view mode from dropdown
//             const viewMode = document.getElementById('performanceViewSelect')?.value || 'value';
//             const viewModes = viewMode === 'all' ? ['value', 'change', 'percent'] : viewMode.split(',');
            
//             // Build datasets based on selected view modes
//             const datasets = [];
            
//             // Always show portfolio value if selected
//             if (viewModes.includes('value')) {
//                 datasets.push({
//                     label: 'Portfolio Value',
//                     data: performanceData.map(p => parseFloat(p.total_value) || 0),
//                     borderColor: '#007bff',
//                     backgroundColor: 'rgba(0, 123, 255, 0.1)',
//                     borderWidth: 2,
//                     fill: true,
//                     tension: 0.4,
//                     yAxisID: 'y'
//                 });
//             }
            
//             // Add daily change dataset if selected
//             if (viewModes.includes('change')) {
//                 datasets.push({
//                     label: 'Daily Change ($)',
//                     data: performanceData.map(p => parseFloat(p.daily_change) || 0),
//                     borderColor: '#28a745',
//                     backgroundColor: 'rgba(40, 167, 69, 0.1)',
//                     borderWidth: 2,
//                     fill: false,
//                     tension: 0.4,
//                     yAxisID: viewModes.includes('value') ? 'y1' : 'y'
//                 });
//             }
            
//             // Add daily change percent dataset if selected
//             if (viewModes.includes('percent')) {
//                 datasets.push({
//                     label: 'Daily Change (%)',
//                     data: performanceData.map(p => parseFloat(p.daily_change_percent) || 0),
//                     borderColor: '#17a2b8',
//                     backgroundColor: 'rgba(23, 162, 184, 0.1)',
//                     borderWidth: 2,
//                     fill: false,
//                     tension: 0.4,
//                     yAxisID: (viewModes.includes('value') || viewModes.includes('change')) ? 'y2' : 'y'
//                 });
//             }
            
//             // Configure chart scales based on visible datasets
//             const scales = {};
            
//             // Primary y-axis (left side)
//             if (viewModes.includes('value')) {
//                 scales.y = {
//                     type: 'linear',
//                     display: true,
//                     position: 'left',
//                     beginAtZero: false,
//                     title: {
//                         display: true,
//                         text: 'Portfolio Value'
//                     },
//                     ticks: {
//                         callback: function(value) {
//                             return formatCurrency(value);
//                         }
//                     }
//                 };
//             } else if (viewModes.includes('change') && !viewModes.includes('percent')) {
//                 scales.y = {
//                     type: 'linear',
//                     display: true,
//                     position: 'left',
//                     title: {
//                         display: true,
//                         text: 'Daily Change ($)'
//                     },
//                     ticks: {
//                         callback: function(value) {
//                             return formatCurrency(value);
//                         }
//                     }
//                 };
//             } else if (viewModes.includes('percent') && !viewModes.includes('change')) {
//                 scales.y = {
//                     type: 'linear',
//                     display: true,
//                     position: 'left',
//                     title: {
//                         display: true,
//                         text: 'Daily Change (%)'
//                     },
//                     ticks: {
//                         callback: function(value) {
//                             return value.toFixed(2) + '%';
//                         }
//                     }
//                 };
//             }
            
//             // Secondary y-axis (right side)
//             if (viewModes.includes('value') && viewModes.includes('change')) {
//                 scales.y1 = {
//                     type: 'linear',
//                     display: true,
//                     position: 'right',
//                     title: {
//                         display: true,
//                         text: 'Daily Change ($)'
//                     },
//                     ticks: {
//                         callback: function(value) {
//                             return formatCurrency(value);
//                         }
//                     },
//                     grid: {
//                         drawOnChartArea: false
//                     }
//                 };
//             } else if (viewModes.includes('value') && viewModes.includes('percent')) {
//                 scales.y1 = {
//                     type: 'linear',
//                     display: true,
//                     position: 'right',
//                     title: {
//                         display: true,
//                         text: 'Daily Change (%)'
//                     },
//                     ticks: {
//                         callback: function(value) {
//                             return value.toFixed(2) + '%';
//                         }
//                     },
//                     grid: {
//                         drawOnChartArea: false
//                     }
//                 };
//             } else if (viewModes.includes('change') && viewModes.includes('percent') && !viewModes.includes('value')) {
//                 scales.y = {
//                     type: 'linear',
//                     display: true,
//                     position: 'left',
//                     title: {
//                         display: true,
//                         text: 'Daily Change ($)'
//                     },
//                     ticks: {
//                         callback: function(value) {
//                             return formatCurrency(value);
//                         }
//                     }
//                 };
//                 scales.y1 = {
//                     type: 'linear',
//                     display: true,
//                     position: 'right',
//                     title: {
//                         display: true,
//                         text: 'Daily Change (%)'
//                     },
//                     ticks: {
//                         callback: function(value) {
//                             return value.toFixed(2) + '%';
//                         }
//                     },
//                     grid: {
//                         drawOnChartArea: false
//                     }
//                 };
//             }
            
//             // Third y-axis for "all" option
//             if (viewModes.length === 3 || viewMode === 'all') {
//                 scales.y2 = {
//                     type: 'linear',
//                     display: false, // Hide to avoid clutter
//                     position: 'right',
//                     ticks: {
//                         callback: function(value) {
//                             return value.toFixed(2) + '%';
//                         }
//                     },
//                     grid: {
//                         drawOnChartArea: false
//                     }
//                 };
//             }
            
//             performanceChart = new Chart(ctx, {
//                 type: 'line',
//                 data: {
//                     labels: performanceData.map(p => formatDate(p.date)),
//                     datasets: datasets
//                 },
//                 options: {
//                     responsive: true,
//                     maintainAspectRatio: false,
//                     interaction: {
//                         mode: 'index',
//                         intersect: false
//                     },
//                     scales: scales,
//                     plugins: {
//                         tooltip: {
//                             callbacks: {
//                                 label: function(context) {
//                                     const label = context.dataset.label;
//                                     const value = context.parsed.y;
                                    
//                                     if (label === 'Portfolio Value') {
//                                         return `${label}: ${formatCurrency(value)}`;
//                                     } else if (label === 'Daily Change ($)') {
//                                         const sign = value >= 0 ? '+' : '';
//                                         return `${label}: ${sign}${formatCurrency(value)}`;
//                                     } else if (label === 'Daily Change (%)') {
//                                         const sign = value >= 0 ? '+' : '';
//                                         return `${label}: ${sign}${value.toFixed(2)}%`;
//                                     }
//                                     return `${label}: ${value}`;
//                                 }
//                             }
//                         }
//                     }
//                 }
//             });
//         }
//     } catch (error) {
//         console.error('Failed to load performance chart:', error);
//     }
// }

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
    
    // Update the Dashboard portfolio selector
    const dashboardSelect = document.getElementById('dashboardPortfolioSelect');
    if (dashboardSelect) {
        dashboardSelect.innerHTML = '<option value="">Select Portfolio...</option>';
    }
    
    // If no portfolios exist, show appropriate message
    if (!portfolios || portfolios.length === 0) {
        const noPortfolioOption = document.createElement('option');
        noPortfolioOption.value = '';
        noPortfolioOption.textContent = 'No portfolios available';
        noPortfolioOption.disabled = true;
        select.appendChild(noPortfolioOption);
        
        if (dashboardSelect) {
            const noDashboardOption = document.createElement('option');
            noDashboardOption.value = '';
            noDashboardOption.textContent = 'No portfolios available';
            noDashboardOption.disabled = true;
            dashboardSelect.appendChild(noDashboardOption);
        }
        return;
    }
    
    portfolios.forEach(portfolio => {
        // Add to Add Item form selector
        const option = document.createElement('option');
        option.value = portfolio.id;
        option.textContent = portfolio.name;
        select.appendChild(option);
        
        // Add to Dashboard selector
        if (dashboardSelect) {
            const dashOption = document.createElement('option');
            dashOption.value = portfolio.id;
            dashOption.textContent = portfolio.name;
            if (currentPortfolio && portfolio.id === currentPortfolio.id) {
                dashOption.selected = true;
            }
            dashboardSelect.appendChild(dashOption);
        }
    });
}

async function loadPortfoliosSection() {
    try {
        // Initialize portfolio details section
        const portfolioDetailsContainer = document.getElementById('portfolioDetails');
        if (portfolioDetailsContainer) {
            portfolioDetailsContainer.innerHTML = '<p class="text-muted">Select a portfolio to view details</p>';
        }
        
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
    const portfolioDetailsContainer = document.getElementById('portfolioDetails');
    container.innerHTML = '';
    
    // If no portfolios exist, show message and clear details
    if (!portfolios || portfolios.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No Portfolios Found</h5>
                <p class="text-muted">Create your first portfolio to get started</p>
            </div>
        `;
        portfolioDetailsContainer.innerHTML = '<p class="text-muted">No portfolio selected</p>';
        return;
    }
    
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
        // Get portfolio data first
        const response = await api.getPortfolio(portfolioId);
        const portfolio = response.data; // Fix: use response.data instead of response.portfolio
        
        // Set current edit portfolio ID
        currentEditPortfolioId = portfolioId;
        
        // Clear any previous validation states
        const form = document.getElementById('editPortfolioForm');
        form.classList.remove('was-validated');
        
        // Populate the modal form with current data
        document.getElementById('editPortfolioName').value = portfolio.name || '';
        document.getElementById('editPortfolioDescription').value = portfolio.description || '';
        
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('editPortfolioModal'));
        modal.show();
        
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

            // Clear portfolio details section
            const portfolioDetailsContainer = document.getElementById('portfolioDetails');
            portfolioDetailsContainer.innerHTML = '<p class="text-muted">Select a portfolio to view details</p>';

            // Remove active state from portfolio cards
            document.querySelectorAll('.portfolio-card').forEach(card => {
                card.classList.remove('active');
            });

            // Check if this was the current portfolio before clearing the reference
            const wasCurrentPortfolio = currentPortfolio && currentPortfolio.id === portfolioId;

            // If this was the current portfolio, clear the reference
            if (wasCurrentPortfolio) {
                currentPortfolio = null;
            }

            // Always refresh portfolio selectors and lists
            await loadPortfolios();
            await loadPortfoliosSection();

            // If this was the current portfolio, reset to default and refresh dashboard
            if (wasCurrentPortfolio) {
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
    
    // Wait a bit for API to load if it's not available yet
    let retries = 0;
    while (!window.api && retries < 10) {
        console.log('Waiting for API to load...', retries);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }
    
    await loadStocksForSelection();
    document.getElementById('addItemForm').reset();
    clearFormValidation(document.getElementById('addItemForm'));
    
    // Set default date to today
    document.getElementById('purchaseDate').value = new Date().toISOString().split('T')[0];
    
    // Add event listener for symbol selection
    const symbolSelect = document.getElementById('symbol');
    symbolSelect.addEventListener('change', handleSymbolSelection);
}

async function loadStocksForSelection() {
    try {
        let response;
        
        // Check if api object exists and has the method
        if (window.api && typeof window.api.getStocks === 'function') {
            response = await window.api.getStocks(10); // Get latest 10 stocks
        } else {
            console.log('Using direct fetch for stocks');
            // Fallback to direct fetch
            const fetchResponse = await fetch('/api/stocks?limit=10');
            response = await fetchResponse.json();
        }
        
        if (response.success) {
            const symbolSelect = document.getElementById('symbol');
            symbolSelect.innerHTML = '<option value="">Select Symbol</option>';
            
            response.data.forEach(stock => {
                const option = document.createElement('option');
                option.value = stock.symbol;
                option.textContent = `${stock.symbol} - ${stock.name}`;
                option.dataset.stockData = JSON.stringify(stock);
                symbolSelect.appendChild(option);
            });
            
            console.log(`Loaded ${response.data.length} stocks`);
        } else {
            throw new Error(response.message || 'Failed to load stocks');
        }
    } catch (error) {
        console.error('Error loading stocks:', error);
        showAlert('Failed to load stock data: ' + error.message, 'warning');
    }
}

async function handleSymbolSelection(event) {
    const selectedOption = event.target.selectedOptions[0];
    
    if (selectedOption && selectedOption.dataset.stockData) {
        const stockData = JSON.parse(selectedOption.dataset.stockData);
        
        // Auto-fill the form fields
        document.getElementById('name').value = stockData.name || '';
        document.getElementById('sector').value = stockData.sector || '';
        document.getElementById('currentPrice').value = stockData.close_price || '';
        document.getElementById('currency').value = stockData.currency || 'USD';
        
        // Set type to stock by default when selecting from stock list
        document.getElementById('type').value = 'stock';
        
        // Adjust step attribute based on currency
        const currency = stockData.currency || 'USD';
        const purchasePriceField = document.getElementById('purchasePrice');
        const currentPriceField = document.getElementById('currentPrice');
        
        if (currency === 'JPY') {
            // For Japanese Yen, use step of 1 (no decimals)
            purchasePriceField.step = '1';
            currentPriceField.step = '1';
            
            // If there's a current price, round it to integer
            if (stockData.close_price) {
                currentPriceField.value = Math.round(parseFloat(stockData.close_price)).toString();
            }
        } else {
            // For other currencies, use step of 0.01 (2 decimal places)
            purchasePriceField.step = '0.01';
            currentPriceField.step = '0.01';
        }
    } else {
        // Clear the auto-filled fields if no symbol is selected
        document.getElementById('name').value = '';
        document.getElementById('sector').value = '';
        document.getElementById('currentPrice').value = '';
        document.getElementById('currency').value = '';
        document.getElementById('type').value = '';
        
        // Reset step attributes to default
        document.getElementById('purchasePrice').step = '0.01';
        document.getElementById('currentPrice').step = '0.01';
    }
}

// Function to adjust price input step attributes based on currency
function adjustPriceStepForCurrency() {
    const currencyField = document.getElementById('currency');
    const purchasePriceField = document.getElementById('purchasePrice');
    const currentPriceField = document.getElementById('currentPrice');
    
    if (!currencyField || !purchasePriceField || !currentPriceField) {
        return;
    }
    
    const currency = currencyField.value;
    
    if (currency === 'JPY') {
        // For Japanese Yen, use step of 1 (no decimals)
        purchasePriceField.step = '1';
        currentPriceField.step = '1';
        
        // Round existing values to integers if they exist
        if (purchasePriceField.value) {
            purchasePriceField.value = Math.round(parseFloat(purchasePriceField.value)).toString();
        }
        if (currentPriceField.value) {
            currentPriceField.value = Math.round(parseFloat(currentPriceField.value)).toString();
        }
    } else {
        // For other currencies, use step of 0.01 (2 decimal places)
        purchasePriceField.step = '0.01';
        currentPriceField.step = '0.01';
    }
}

async function addPortfolioItem() {
    const form = document.getElementById('addItemForm');
    
    const itemData = {
        portfolio_id: parseInt(document.getElementById('portfolioSelect').value),
        symbol: document.getElementById('symbol').value,
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
            
            // Clear auto-filled readonly fields after reset
            document.getElementById('name').value = '';
            document.getElementById('sector').value = '';
            document.getElementById('currentPrice').value = '';
            document.getElementById('currency').value = '';
            
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

async function showBuyModal(item) {
    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    const modalTitle = document.querySelector('#editItemModal .modal-title');
    const form = document.getElementById('editItemForm');
    
    modalTitle.textContent = `Buy More - ${item.symbol}`;
    

    // Get latest stock data from top_stocks table
    let latestStockData = null;
    let currency = 'USD'; // Default currency
    let currentPrice = item.current_price || item.purchase_price;
    
    try {
        if (window.api && typeof window.api.getStockBySymbol === 'function') {
            const stockResponse = await window.api.getStockBySymbol(item.symbol);
            if (stockResponse.success && stockResponse.data) {
                latestStockData = stockResponse.data;
                currency = latestStockData.currency || 'USD';
                currentPrice = latestStockData.close_price || currentPrice;
            }
        }
    } catch (error) {
        console.warn('Failed to fetch latest stock data:', error);
        // Use item's existing currency if available, otherwise default to USD
        currency = item.currency || 'USD';
    }
    
    // Determine the step value based on currency
    const stepValue = (currency === 'JPY') ? '1' : '0.01';
    const priceValue = (currency === 'JPY') ? 
        Math.round(parseFloat(currentPrice)) : 
        parseFloat(currentPrice).toFixed(2);
    
    const currentPriceDisplay = (currency === 'JPY') ? 
        Math.round(parseFloat(currentPrice)) : 
        parseFloat(currentPrice).toFixed(2);

    
    form.innerHTML = `
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>Current Position:</strong> ${item.quantity} shares at ${currency === 'JPY' ? '¥' : '$'}${parseFloat(item.purchase_price).toFixed(currency === 'JPY' ? 0 : 2)} avg. cost
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Additional Quantity *</label>
                <input type="number" class="form-control" id="buyQuantity" step="0.000001" required placeholder="Enter quantity to buy">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Purchase Price *</label>
                <input type="number" class="form-control" id="buyPrice" step="${stepValue}" required value="${priceValue}" placeholder="Enter purchase price">
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Purchase Date *</label>
                <input type="date" class="form-control" id="buyDate" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Current Price</label>

                <input type="number" class="form-control" id="buyCurrentPrice" step="${stepValue}" value="${currentPriceDisplay}" placeholder="Optional: Update current price">
            </div>
        </div>
        <div class="row">
            <div class="col-md-12 mb-3">
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Currency: ${currency} ${latestStockData ? '(from latest market data)' : '(default)'}
                </small>

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
        
        // First create the transaction record
        const transactionData = {
            portfolio_id: parseInt(currentItem.portfolio_id),
            transaction_type: 'buy',
            symbol: currentItem.symbol,
            asset_name: currentItem.name,
            quantity: buyQuantity,
            price_per_unit: buyPrice,
            total_amount: buyQuantity * buyPrice,
            fees: 0,
            transaction_date: buyDate,
            description: `Additional purchase of ${currentItem.name} (${currentItem.symbol})`,
            status: 'completed'
        };
        
        const transactionResponse = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transactionData)
        });
        
        if (!transactionResponse.ok) {
            throw new Error('Failed to create transaction record');
        }
        
        // Then update the portfolio item
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

async function showSellModal(item) {
    const modal = new bootstrap.Modal(document.getElementById('editItemModal'));
    const modalTitle = document.querySelector('#editItemModal .modal-title');
    const form = document.getElementById('editItemForm');
    
    modalTitle.textContent = `Sell - ${item.symbol}`;
    
    // Get latest stock data from top_stocks table
    let latestStockData = null;
    let currency = 'USD'; // Default currency
    let currentPrice = item.current_price || item.purchase_price;
    
    try {
        if (window.api && typeof window.api.getStockBySymbol === 'function') {
            const stockResponse = await window.api.getStockBySymbol(item.symbol);
            if (stockResponse.success && stockResponse.data) {
                latestStockData = stockResponse.data;
                currency = latestStockData.currency || 'USD';
                currentPrice = latestStockData.close_price || currentPrice;
            }
        }
    } catch (error) {
        console.warn('Failed to fetch latest stock data:', error);
        // Use item's existing currency if available, otherwise default to USD
        currency = item.currency || 'USD';
    }
    
    const currentValue = parseFloat(item.quantity) * parseFloat(currentPrice);
    
    // Determine the step value based on currency
    const stepValue = (currency === 'JPY') ? '1' : '0.01';
    const priceValue = (currency === 'JPY') ? 
        Math.round(parseFloat(currentPrice)) : 
        parseFloat(currentPrice).toFixed(2);
    
    // Determine the step value based on currency
    const stepValue = (item.currency === 'JPY') ? '1' : '0.01';
    const priceValue = (item.currency === 'JPY') ? 
        Math.round(parseFloat(item.current_price || item.purchase_price)) : 
        (item.current_price || item.purchase_price);
    
    form.innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Current Position:</strong> ${item.quantity} shares worth ${currency === 'JPY' ? '¥' : '$'}${currentValue.toFixed(currency === 'JPY' ? 0 : 2)}
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
                <input type="number" class="form-control" id="sellPrice" step="${stepValue}" required value="${priceValue}" placeholder="Enter sell price">
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
        <div class="row">
            <div class="col-md-12 mb-3">
                <small class="text-muted">
                    <i class="fas fa-info-circle me-1"></i>
                    Currency: ${currency} ${latestStockData ? '(from latest market data)' : '(default)'}
                </small>
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
                            <strong>Total Value:</strong> ${currency === 'JPY' ? '¥' : '$'}<span id="previewValue">0.00</span>
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
            // Create sell transaction record for the entire position
            const transactionData = {
                portfolio_id: parseInt(currentItem.portfolio_id),
                transaction_type: 'sell',
                symbol: currentItem.symbol,
                asset_name: currentItem.name || currentItem.symbol, // Fallback to symbol if name is null
                quantity: currentQuantity, // Use actual quantity being sold
                price_per_unit: sellPrice,
                total_amount: currentQuantity * sellPrice,
                fees: 0,
                transaction_date: sellDate,
                description: `Complete sale of ${currentItem.name || currentItem.symbol} (${currentItem.symbol})`,
                status: 'completed'
            };
            
            const transactionResponse = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });
            
            if (!transactionResponse.ok) {
                throw new Error('Failed to create transaction record');
            }
            
            // Delete the entire position
            const deleteResponse = await api.deletePortfolioItem(currentEditItemId);
            if (deleteResponse.success) {
                showAlert(`Successfully sold all ${currentQuantity} shares of ${currentItem.symbol} for $${totalSellValue.toFixed(2)}`, 'success');
                bootstrap.Modal.getInstance(document.getElementById('editItemModal')).hide();
                await loadDashboard();
            }
        } else {
            // Create sell transaction record for partial sale
            const transactionData = {
                portfolio_id: parseInt(currentItem.portfolio_id),
                transaction_type: 'sell',
                symbol: currentItem.symbol,
                asset_name: currentItem.name || currentItem.symbol, // Fallback to symbol if name is null
                quantity: sellQuantity,
                price_per_unit: sellPrice,
                total_amount: sellQuantity * sellPrice,
                fees: 0,
                transaction_date: sellDate,
                description: `Partial sale of ${currentItem.name || currentItem.symbol} (${currentItem.symbol})`,
                status: 'completed'
            };
            
            const transactionResponse = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transactionData)
            });
            
            if (!transactionResponse.ok) {
                throw new Error('Failed to create transaction record');
            }
            
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

// 页面初始化后绑定事件
document.addEventListener('DOMContentLoaded', function() {
    const currencySelect = document.getElementById('currency');
    const purchaseInput = document.getElementById('purchasePrice');
    const currentInput = document.getElementById('currentPrice');

    function updatePriceInputsForCurrency() {
        const isJPY = currencySelect.value === 'JPY';
        if (isJPY) {
            purchaseInput.step = '1';
            purchaseInput.min = '0';
            currentInput.step = '1';
            currentInput.min = '0';
            // Reset values to zero
            purchaseInput.value = '0';
            currentInput.value = '0';
        } else {
            purchaseInput.step = '0.01';
            purchaseInput.min = '0';
            currentInput.step = '0.01';
            currentInput.min = '0';
            // Reset values to zero
            purchaseInput.value = '0';
            currentInput.value = '0';
        }
    }

    // 监听币种变化
    currencySelect.addEventListener('change', updatePriceInputsForCurrency);

    // 只允许输入整数（JPY时）
    function forceIntegerInput(e) {
        if (currencySelect.value === 'JPY') {
            e.target.value = e.target.value.replace(/\D/g, '');
        }
    }
    purchaseInput.addEventListener('input', forceIntegerInput);
    currentInput.addEventListener('input', forceIntegerInput);

    // 初始化时也执行一次
    updatePriceInputsForCurrency();
});

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
    document.getElementById('edit-portfolio-submit').addEventListener('click', async function() {
        try {
            const name = document.getElementById('editPortfolioName').value.trim();
            const description = document.getElementById('editPortfolioDescription').value.trim();
            
            if (!name) {
                showAlert('Portfolio name is required', 'warning');
                return;
            }
            
            // Update portfolio
            await api.updatePortfolio(currentEditPortfolioId, {
                name: name,
                description: description
            });
            
            showAlert('Portfolio updated successfully', 'success');
            
            // If this is the currently selected portfolio, update the current portfolio reference
            if (currentPortfolio && currentPortfolio.id === currentEditPortfolioId) {
                currentPortfolio.name = name;
                currentPortfolio.description = description;
            }
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editPortfolioModal'));
            modal.hide();
            
            // Reload portfolios list
            await loadPortfoliosSection();
            
        } catch (error) {
            showAlert(error.message, 'danger');
        }
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
    
    // Performance chart view selector
    document.getElementById('performanceViewSelect').addEventListener('change', function() {
        loadPerformanceChart();
    });
    
    // Event delegation for dynamically created buttons
    document.addEventListener('click', async function(e) {
        // Buy more button
        if (e.target.closest('.buy-item-btn')) {
            const itemId = e.target.closest('.buy-item-btn').dataset.itemId;
            await buyMoreShares(parseInt(itemId));
        }
        
        // Sell button
        if (e.target.closest('.sell-item-btn')) {
            const itemId = e.target.closest('.sell-item-btn').dataset.itemId;
            await sellShares(parseInt(itemId));
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



// portfolioListSearch
let allPortfolios = [];
async function loadPortfoliosSection() {
    try {
        const response = await api.getPortfolios();
        if (response.success) {
            allPortfolios = response.data;
            renderPortfolioList(allPortfolios);
        }
    } catch (error) {
        console.error('Failed to load portfolios section:', error);
    }
}

function renderPortfolioList(portfolios) {
    displayPortfoliosList(portfolios);
}

document.getElementById('portfolioListSearchBtn').addEventListener('click', function() {
    const query = document.getElementById('portfolioListSearchInput').value.trim().toLowerCase();
    if (!query) {
        renderPortfolioList(allPortfolios);
        return;
    }
    const filtered = allPortfolios.filter(p =>
        p.name && p.name.toLowerCase().includes(query)
    );
    renderPortfolioList(filtered);
});

// enter search
document.getElementById('portfolioListSearchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('portfolioListSearchBtn').click();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    cleanupMarketIndices();
});


// My Portfolios splite page
const myPortfoliosPerPage = 6;
let myPortfoliosCurrentPage = 1;

function renderPortfolioList(portfolios) {
    const total = portfolios.length;
    const totalPages = Math.ceil(total / myPortfoliosPerPage);

    if (myPortfoliosCurrentPage > totalPages && totalPages > 0) {
        myPortfoliosCurrentPage = totalPages;
    } else if (myPortfoliosCurrentPage < 1) {
        myPortfoliosCurrentPage = 1;
    }

    const start = (myPortfoliosCurrentPage - 1) * myPortfoliosPerPage;
    const end = Math.min(start + myPortfoliosPerPage, total);
    const pageData = portfolios.slice(start, end);

    displayPortfoliosList(pageData);

    const info = document.getElementById('portfolioPaginationInfo');
    if (info) {
        if (total === 0) {
            info.textContent = `Showing 0 - 0 of 0 items`;
        } else {
            info.textContent = `Showing ${start + 1} - ${end} of ${total} items`;
        }
    }

    renderPortfolioPaginationControls(totalPages);
}

function renderPortfolioPaginationControls(totalPages) {
    const container = document.getElementById('portfolioPaginationContainer');
    const controls = document.getElementById('portfolioPaginationControls');
    if (!container || !controls) return;

    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    container.style.display = '';

    controls.innerHTML = '';


    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${myPortfoliosCurrentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${myPortfoliosCurrentPage - 1}">Previous</a>`;
    controls.appendChild(prevLi);


    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= myPortfoliosCurrentPage - 1 && i <= myPortfoliosCurrentPage + 1)) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === myPortfoliosCurrentPage ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            controls.appendChild(pageLi);
        } else if (i === myPortfoliosCurrentPage - 2 || i === myPortfoliosCurrentPage + 2) {
            const ellipsisLi = document.createElement('li');
            ellipsisLi.className = 'page-item disabled';
            ellipsisLi.innerHTML = '<span class="page-link">...</span>';
            controls.appendChild(ellipsisLi);
        }
    }


    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${myPortfoliosCurrentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${myPortfoliosCurrentPage + 1}">Next</a>`;
    controls.appendChild(nextLi);


    controls.onclick = function(e) {
        e.preventDefault();
        if (e.target.classList.contains('page-link')) {
            const page = parseInt(e.target.dataset.page);
            if (page && page !== myPortfoliosCurrentPage && page >= 1 && page <= totalPages) {
                myPortfoliosCurrentPage = page;
                renderPortfolioList(allPortfolios);
            }
        }
    };
}

document.getElementById('portfolioListSearchBtn').addEventListener('click', function() {
    myPortfoliosCurrentPage = 1;
    const query = document.getElementById('portfolioListSearchInput').value.trim().toLowerCase();
    if (!query) {
        renderPortfolioList(allPortfolios);
        return;
    }
    const filtered = allPortfolios.filter(p =>
        p.name && p.name.toLowerCase().includes(query)
    );
    renderPortfolioList(filtered);
});
document.getElementById('portfolioListSearchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        myPortfoliosCurrentPage = 1;
        document.getElementById('portfolioListSearchBtn').click();
    }
});

async function loadPortfoliosSection() {
    try {
        const response = await api.getPortfolios();
        if (response.success) {
            allPortfolios = response.data;
            myPortfoliosCurrentPage = 1;
            renderPortfolioList(allPortfolios);
        }
    } catch (error) {
        console.error('Failed to load portfolios section:', error);
    }
}