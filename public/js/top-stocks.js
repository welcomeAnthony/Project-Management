// Top Stocks Chart Management
let availableSymbols = [];
let currentChart = null;

// Load data when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Load symbols directly without loading animation
    loadAvailableSymbols();
    
    // Add event listeners for select elements
    document.getElementById('stockSelect').addEventListener('change', updateChart);
    document.getElementById('attributeSelect').addEventListener('change', updateChart);
    document.getElementById('periodSelect').addEventListener('change', updateChart);
});

async function loadAvailableSymbols() {
    try {
        console.log('Loading available symbols...');
        const response = await fetch('/api/top-stocks/symbols');
        const data = await response.json();
        
        console.log('Symbols API response:', data);
        
        if (data.success && data.data && data.data.length > 0) {
            availableSymbols = data.data;
            populateStockSelect(data.data);
            
            // Auto-select first stock and load chart
            if (data.data.length > 0) {
                document.getElementById('stockSelect').value = data.data[0].symbol;
                console.log('Auto-selecting first stock:', data.data[0].symbol);
                updateChart();
            }
        } else {
            console.error('Failed to load symbols:', data);
            showNoData();
        }
    } catch (error) {
        console.error('Error loading symbols:', error);
        showNoData();
    }
}

function populateStockSelect(symbols) {
    const select = document.getElementById('stockSelect');
    select.innerHTML = '<option value="">Select a stock...</option>';
    
    symbols.forEach(stock => {
        const option = document.createElement('option');
        option.value = stock.symbol;
        option.textContent = `${stock.symbol} - ${stock.name}`;
        select.appendChild(option);
    });
}

async function updateChart() {
    const stockSelect = document.getElementById('stockSelect');
    const attributeSelect = document.getElementById('attributeSelect');
    const periodSelect = document.getElementById('periodSelect');
    
    const selectedStock = stockSelect.value;
    const selectedAttribute = attributeSelect.value;
    const selectedPeriod = periodSelect.value;
    
    console.log('Updating chart for:', selectedStock, selectedAttribute, selectedPeriod);
    
    if (!selectedStock) {
        showNoData();
        return;
    }
    
    try {
        const url = `/api/top-stocks/chart/${selectedStock}?attribute=${selectedAttribute}&days=${selectedPeriod}`;
        console.log('Fetching chart data from:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('Chart API response:', data);
        
        if (data.success && data.data && data.data.length > 0) {
            displayChart(data);
        } else {
            console.warn('No chart data received:', data);
            showNoData();
        }
    } catch (error) {
        console.error('Error loading chart data:', error);
        showNoData();
    }
}

function displayChart(data) {
    // Hide no data message and show the chart canvas directly
    document.getElementById('noDataArea').style.display = 'none';
    document.getElementById('stockChart').style.display = 'block';
    
    const ctx = document.getElementById('stockChart').getContext('2d');
    
    // Destroy existing chart
    if (currentChart) {
        currentChart.destroy();
    }
    
    const isVolumeChart = data.attribute === 'volume';
    const chartColor = isVolumeChart ? '#ffc107' : '#007bff';
    const chartBorderColor = isVolumeChart ? '#e0a800' : '#0056b3';
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.data.map(item => {
                const date = new Date(item.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: getAttributeDisplayName(data.attribute),
                data: data.data.map(item => parseFloat(item.value)),
                borderColor: chartBorderColor,
                backgroundColor: chartColor + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: chartBorderColor,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    borderColor: chartBorderColor,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y;
                            if (isVolumeChart) {
                                return `Volume: ${formatVolume(value)}`;
                            } else {
                                return `${getAttributeDisplayName(data.attribute)}: $${formatNumber(value)}`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        maxTicksLimit: 10
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            if (isVolumeChart) {
                                return formatVolume(value);
                            } else {
                                return '$' + formatNumber(value);
                            }
                        }
                    }
                }
            }
        }
    });
}

function getAttributeDisplayName(attribute) {
    const names = {
        'close_price': 'Closing Price',
        'open_price': 'Opening Price',
        'high_price': 'Daily High',
        'low_price': 'Daily Low',
        'volume': 'Trading Volume'
    };
    return names[attribute] || attribute;
}

function showNoData() {
    document.getElementById('stockChart').style.display = 'none';
    document.getElementById('noDataArea').style.display = 'flex';
}

function formatNumber(num) {
    if (!num) return 'N/A';
    return Number(num).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatVolume(volume) {
    if (!volume) return 'N/A';
    
    if (volume >= 1e9) {
        return (volume / 1e9).toFixed(1) + 'B';
    } else if (volume >= 1e6) {
        return (volume / 1e6).toFixed(1) + 'M';
    } else if (volume >= 1e3) {
        return (volume / 1e3).toFixed(1) + 'K';
    }
    
    return volume.toLocaleString();
}
