// Global variables
let chart, rsiChart, candlestickSeries, emaLine, rsiLine;
let autoUpdateInterval;
let currentSymbolIndex = 0;
let watchlistSymbols = [];

// Initialize charts
function initializeCharts() {
    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
    
    const chartOptions = {
        layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: isDarkMode ? '#f1f5f9' : '#334155',
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
        },
        grid: {
            vertLines: {
                color: isDarkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                style: 1,
            },
            horzLines: {
                color: isDarkMode ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
                style: 1,
            },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
            vertLine: {
                color: isDarkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)',
                width: 1,
                style: 2,
            },
            horzLine: {
                color: isDarkMode ? 'rgba(148, 163, 184, 0.4)' : 'rgba(100, 116, 139, 0.4)',
                width: 1,
                style: 2,
            },
        },
        timeScale: {
            visible: false,
            borderColor: isDarkMode ? '#475569' : '#cbd5e1',
            timeVisible: true,
            secondsVisible: false,
        },
        rightPriceScale: {
            borderColor: isDarkMode ? '#475569' : '#cbd5e1',
            scaleMargins: {
                top: 0.1,
                bottom: 0.2,
            },
        },
        width: document.getElementById('chart').clientWidth,
        height: document.getElementById('chart').clientHeight,
    };

    const rsiChartOptions = {
        ...chartOptions,
        timeScale: {
            ...chartOptions.timeScale,
            visible: true,
        },
        width: document.getElementById('rsiChart').clientWidth,
        height: document.getElementById('rsiChart').clientHeight,
    };

    // Create charts
    chart = LightweightCharts.createChart(document.getElementById('chart'), chartOptions);
    rsiChart = LightweightCharts.createChart(document.getElementById('rsiChart'), rsiChartOptions);

    // Add series
    candlestickSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
        upColor: '#10b981',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
    });

    emaLine = chart.addSeries(LightweightCharts.LineSeries, {
        color: '#3b82f6',
        lineWidth: 2,
        lineStyle: 0,
    });

    rsiLine = rsiChart.addSeries(LightweightCharts.LineSeries, {
        color: '#8b5cf6',
        lineWidth: 2,
        lineStyle: 0,
    });

    // Sync charts
    syncVisibleLogicalRange(chart, rsiChart);
    setupCrosshairSync();
}

// Fetch data function
async function fetchData(ticker, timeframe, emaPeriod, rsiPeriod) {
    try {
        const response = await fetch(`/api/data/${ticker}/${timeframe}/${emaPeriod}/${rsiPeriod}`);
        const data = await response.json();
        
        candlestickSeries.setData(data.candlestick);
        emaLine.setData(data.ema);
        rsiLine.setData(data.rsi);
        
        // Update current symbol in ticker input
        document.getElementById('ticker').value = ticker;
        
    } catch (error) {
        console.error('Error fetching data:', error);
        showNotification('Error fetching data', 'error');
    }
}

// Load watchlist with enhanced UI
async function loadWatchlist() {
    const watchlistItems = document.getElementById('watchlistItems');
    
    // Show loading state
    watchlistItems.innerHTML = `
        <div class="flex justify-center items-center p-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span class="ml-3 text-sm text-slate-600 dark:text-slate-400">Loading quotes...</span>
        </div>
    `;
    
    try {
        const response = await fetch('/api/symbols');
        const symbolsData = await response.json();
        watchlistSymbols = symbolsData;
        
        watchlistItems.innerHTML = '';
        
        if (symbolsData.length === 0) {
            watchlistItems.innerHTML = `
                <div class="text-center p-8">
                    <i class="fas fa-chart-line text-4xl text-slate-300 dark:text-slate-600 mb-4"></i>
                    <p class="text-sm text-slate-500 dark:text-slate-400">No symbols in watchlist</p>
                    <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">Add your first symbol above</p>
                </div>
            `;
            return;
        }
        
        symbolsData.forEach((symbolData, index) => {
            const item = createWatchlistItem(symbolData, index);
            watchlistItems.appendChild(item);
        });
        
        // Set first item as active if none selected
        if (watchlistItems.children.length > 0) {
            setActiveSymbol(0);
        }
        
    } catch (error) {
        console.error('Error loading watchlist:', error);
        watchlistItems.innerHTML = `
            <div class="text-center p-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <p class="text-sm text-red-600 dark:text-red-400">Error loading watchlist</p>
                <button onclick="loadWatchlist()" class="btn btn-sm btn-outline btn-primary mt-2">
                    <i class="fas fa-redo mr-2"></i>Retry
                </button>
            </div>
        `;
    }
}

// Create watchlist item with modern design
function createWatchlistItem(symbolData, index) {
    const item = document.createElement('div');
    item.className = 'watchlist-item p-4 rounded-xl cursor-pointer group relative overflow-hidden';
    item.dataset.index = index;
    item.dataset.symbol = symbolData.symbol;
    
    const price = symbolData.price ? symbolData.price.toFixed(2) : 'N/A';
    const changePercent = symbolData.change ? symbolData.change.toFixed(2) : 0;
    const isPositive = changePercent > 0;
    const changeClass = isPositive ? 'price-positive' : (changePercent < 0 ? 'price-negative' : 'text-slate-500');
    const changeIcon = isPositive ? 'caret-up' : (changePercent < 0 ? 'caret-down' : 'minus');
    
    item.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                        ${symbolData.symbol.charAt(0)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-800 dark:text-slate-200 text-sm">${symbolData.symbol}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${symbolData.name || 'Yahoo Finance'}</p>
                    </div>
                </div>
            </div>
            <div class="text-right ml-3">
                <div class="font-semibold text-slate-800 dark:text-slate-200 text-sm">$${price}</div>
                <div class="text-xs ${changeClass} px-2 py-1 rounded-full flex items-center gap-1">
                    <i class="fas fa-${changeIcon}"></i>
                    ${Math.abs(changePercent)}%
                </div>
            </div>
        </div>
        <button class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full delete-symbol" data-id="${symbolData.id}">
            <i class="fas fa-times text-red-500 text-xs"></i>
        </button>
    `;
    
    // Add click handler
    item.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-symbol')) {
            setActiveSymbol(index);
            fetchData(symbolData.symbol, 
                document.getElementById('timeframe').value,
                document.getElementById('emaPeriod').value,
                document.getElementById('rsiPeriod').value
            );
        }
    });
    
    // Add delete handler
    const deleteBtn = item.querySelector('.delete-symbol');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeSymbol(symbolData.id, item);
    });
    
    return item;
}

// Set active symbol with visual feedback
function setActiveSymbol(index) {
    currentSymbolIndex = index;
    
    // Remove active class from all items
    document.querySelectorAll('.watchlist-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected item
    const activeItem = document.querySelector(`[data-index="${index}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Keyboard navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            
            if (watchlistSymbols.length === 0) return;
            
            if (e.key === 'ArrowUp') {
                currentSymbolIndex = currentSymbolIndex > 0 ? currentSymbolIndex - 1 : watchlistSymbols.length - 1;
            } else {
                currentSymbolIndex = currentSymbolIndex < watchlistSymbols.length - 1 ? currentSymbolIndex + 1 : 0;
            }
            
            setActiveSymbol(currentSymbolIndex);
            const symbol = watchlistSymbols[currentSymbolIndex];
            fetchData(symbol.symbol,
                document.getElementById('timeframe').value,
                document.getElementById('emaPeriod').value,
                document.getElementById('rsiPeriod').value
            );
            
            showNavigationHint();
        }
    });
}

// Show navigation hint
function showNavigationHint() {
    const hint = document.getElementById('navigationHint');
    hint.classList.add('show');
    setTimeout(() => {
        hint.classList.remove('show');
    }, 2000);
}

// Add symbol function
async function addSymbol() {
    const symbolInput = document.getElementById('newSymbol');
    const symbolError = document.getElementById('symbolError');
    const symbol = symbolInput.value.trim().toUpperCase();
    
    symbolError.classList.add('hidden');
    symbolError.textContent = '';
    
    if (!symbol) {
        showError('Please enter a symbol');
        return;
    }
    
    const addBtn = document.getElementById('addSymbolBtn');
    const originalContent = addBtn.innerHTML;
    addBtn.innerHTML = '<div class="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>';
    addBtn.disabled = true;
    
    try {
        const response = await fetch('/api/symbols', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symbol: symbol }),
        });
        
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
        } else {
            symbolInput.value = '';
            loadWatchlist();
            showNotification(`${symbol} added to watchlist`, 'success');
        }
    } catch (error) {
        console.error('Error adding symbol:', error);
        showError('Error adding symbol. Please try again.');
    } finally {
        addBtn.innerHTML = originalContent;
        addBtn.disabled = false;
    }
}

// Remove symbol function
async function removeSymbol(symbolId, element) {
    // Animate removal
    element.style.transform = 'translateX(-100%)';
    element.style.opacity = '0';
    
    setTimeout(() => element.remove(), 300);
    
    try {
        const response = await fetch(`/api/symbols/${symbolId}`, { method: 'DELETE' });
        if (response.ok) {
            loadWatchlist();
            showNotification('Symbol removed from watchlist', 'success');
        } else {
            loadWatchlist(); // Reload on error
        }
    } catch (error) {
        console.error('Error removing symbol:', error);
        loadWatchlist(); // Reload on error
    }
}

// Show error in form
function showError(message) {
    const symbolError = document.getElementById('symbolError');
    symbolError.textContent = message;
    symbolError.classList.remove('hidden');
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-slide-up ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Sync visible logical range between charts
function syncVisibleLogicalRange(chart1, chart2) {
    chart1.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
        chart2.timeScale().setVisibleLogicalRange(timeRange);
    });

    chart2.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
        chart1.timeScale().setVisibleLogicalRange(timeRange);
    });
}

// Setup crosshair sync
function setupCrosshairSync() {
    function getCrosshairDataPoint(series, param) {
        if (!param.time) return null;
        const dataPoint = param.seriesData.get(series);
        return dataPoint || null;
    }

    function syncCrosshair(chart, series, dataPoint) {
        if (dataPoint) {
            chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
            return;
        }
        chart.clearCrosshairPosition();
    }

    chart.subscribeCrosshairMove(param => {
        const dataPoint = getCrosshairDataPoint(candlestickSeries, param);
        syncCrosshair(rsiChart, rsiLine, dataPoint);
    });

    rsiChart.subscribeCrosshairMove(param => {
        const dataPoint = getCrosshairDataPoint(rsiLine, param);
        syncCrosshair(chart, candlestickSeries, dataPoint);
    });
}

// Theme toggle functionality
function setupThemeToggle() {
    document.getElementById('themeToggle').addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const darkIcon = document.querySelector('.dark-icon');
        const lightIcon = document.querySelector('.light-icon');
        
        if (currentTheme === 'light') {
            document.body.setAttribute('data-theme', 'dark');
            darkIcon.classList.add('hidden');
            lightIcon.classList.remove('hidden');
            updateChartsTheme(true);
        } else {
            document.body.setAttribute('data-theme', 'light');
            darkIcon.classList.remove('hidden');
            lightIcon.classList.add('hidden');
            updateChartsTheme(false);
        }
    });
}

// Update charts theme
function updateChartsTheme(isDark) {
    const themeOptions = {
        layout: {
            background: { type: 'solid', color: 'transparent' },
            textColor: isDark ? '#f1f5f9' : '#334155',
        },
        grid: {
            vertLines: {
                color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
            },
            horzLines: {
                color: isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(226, 232, 240, 0.5)',
            },
        },
        rightPriceScale: {
            borderColor: isDark ? '#475569' : '#cbd5e1',
        },
        timeScale: {
            borderColor: isDark ? '#475569' : '#cbd5e1',
        },
    };
    
    chart.applyOptions(themeOptions);
    rsiChart.applyOptions(themeOptions);
}

// Handle window resize
function setupWindowResize() {
    window.addEventListener('resize', () => {
        chart.resize(document.getElementById('chart').clientWidth, document.getElementById('chart').clientHeight);
        rsiChart.resize(document.getElementById('rsiChart').clientWidth, document.getElementById('rsiChart').clientHeight);
    });
}

// Auto-update functionality
function setupAutoUpdate() {
    document.getElementById('autoUpdate').addEventListener('change', (event) => {
        if (event.target.checked) {
            const frequency = document.getElementById('updateFrequency').value * 1000;
            autoUpdateInterval = setInterval(() => {
                const ticker = document.getElementById('ticker').value;
                const timeframe = document.getElementById('timeframe').value;
                const emaPeriod = document.getElementById('emaPeriod').value;
                const rsiPeriod = document.getElementById('rsiPeriod').value;
                fetchData(ticker, timeframe, emaPeriod, rsiPeriod);
            }, frequency);
        } else {
            clearInterval(autoUpdateInterval);
        }
    });
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    loadWatchlist();
    setupKeyboardNavigation();
    setupThemeToggle();
    setupWindowResize();
    setupAutoUpdate();
    
    // Event listeners
    document.getElementById('fetchData').addEventListener('click', () => {
        const ticker = document.getElementById('ticker').value;
        const timeframe = document.getElementById('timeframe').value;
        const emaPeriod = document.getElementById('emaPeriod').value;
        const rsiPeriod = document.getElementById('rsiPeriod').value;
        fetchData(ticker, timeframe, emaPeriod, rsiPeriod);
    });
    
    document.getElementById('addSymbolBtn').addEventListener('click', addSymbol);
    document.getElementById('newSymbol').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addSymbol();
    });
    
    document.getElementById('refreshWatchlist').addEventListener('click', loadWatchlist);
    
    // Load initial data
    fetchData('NVDA', '1d', 20, 14);
    
    // Show navigation hint after a delay
    setTimeout(showNavigationHint, 2000);
});