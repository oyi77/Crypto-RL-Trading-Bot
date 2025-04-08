// WebSocket connection
const ws = new WebSocket(`ws://${window.location.hostname}:3001`);

// Chart instances
let priceChart;
let indicatorChart;

// Initialize charts
function initializeCharts() {
    // Price Chart
    const priceCtx = document.getElementById('priceChart').getContext('2d');
    priceChart = new Chart(priceCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Price',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                },
                {
                    label: 'Bollinger Upper',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    borderDash: [5, 5],
                    tension: 0.1
                },
                {
                    label: 'Bollinger Lower',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    borderDash: [5, 5],
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });

    // Indicator Chart
    const indicatorCtx = document.getElementById('indicatorChart').getContext('2d');
    indicatorChart = new Chart(indicatorCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'RSI',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    yAxisID: 'y',
                    tension: 0.1
                },
                {
                    label: 'MACD',
                    data: [],
                    borderColor: 'rgb(54, 162, 235)',
                    yAxisID: 'y1',
                    tension: 0.1
                },
                {
                    label: 'PPO',
                    data: [],
                    borderColor: 'rgb(75, 192, 192)',
                    yAxisID: 'y1',
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: 100
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Update metrics display
function updateMetrics(data) {
    // Performance metrics
    document.getElementById('balance').textContent = data.performance.balance.toFixed(2);
    document.getElementById('equity').textContent = data.performance.equity.toFixed(2);
    document.getElementById('drawdown').textContent = (data.performance.drawdown * 100).toFixed(2) + '%';
    document.getElementById('winRate').textContent = (data.performance.winRate * 100).toFixed(2) + '%';
    document.getElementById('tradeCount').textContent = data.performance.tradeCount;

    // RL metrics
    document.getElementById('epsilon').textContent = data.rlMetrics.epsilon.toFixed(4);
    document.getElementById('bufferSize').textContent = data.rlMetrics.bufferSize;
    document.getElementById('agentCount').textContent = data.rlMetrics.agentCount;

    // Technical indicators
    if (data.indicators) {
        document.getElementById('rsi').textContent = data.indicators.rsi.toFixed(2);
        document.getElementById('macd').textContent = data.indicators.macd.histogram.toFixed(4);
        document.getElementById('ppo').textContent = data.indicators.ppo.toFixed(4);
        document.getElementById('atr').textContent = data.indicators.atr.toFixed(4);
    }
}

// Update charts
function updateCharts(data) {
    if (!data.state || !data.indicators) return;

    const timestamp = new Date().toLocaleTimeString();

    // Update price chart
    priceChart.data.labels.push(timestamp);
    priceChart.data.datasets[0].data.push(data.state.price);
    priceChart.data.datasets[1].data.push(data.indicators.bollingerBands.upper);
    priceChart.data.datasets[2].data.push(data.indicators.bollingerBands.lower);

    // Update indicator chart
    indicatorChart.data.labels.push(timestamp);
    indicatorChart.data.datasets[0].data.push(data.indicators.rsi);
    indicatorChart.data.datasets[1].data.push(data.indicators.macd.histogram);
    indicatorChart.data.datasets[2].data.push(data.indicators.ppo);

    // Limit data points to last 50
    const maxPoints = 50;
    if (priceChart.data.labels.length > maxPoints) {
        priceChart.data.labels.shift();
        priceChart.data.datasets.forEach(dataset => dataset.data.shift());
    }
    if (indicatorChart.data.labels.length > maxPoints) {
        indicatorChart.data.labels.shift();
        indicatorChart.data.datasets.forEach(dataset => dataset.data.shift());
    }

    priceChart.update();
    indicatorChart.update();
}

// Update signals table
function updateSignalsTable(signal) {
    const table = document.getElementById('signalsTable');
    const row = table.insertRow(0);
    
    const timeCell = row.insertCell(0);
    const actionCell = row.insertCell(1);
    const confidenceCell = row.insertCell(2);
    const sizeCell = row.insertCell(3);
    const reasonCell = row.insertCell(4);

    timeCell.textContent = new Date().toLocaleTimeString();
    actionCell.textContent = signal.action;
    confidenceCell.textContent = (signal.confidence * 100).toFixed(2) + '%';
    sizeCell.textContent = signal.size.toFixed(4);
    reasonCell.textContent = signal.reason;

    // Limit to last 10 signals
    if (table.rows.length > 10) {
        table.deleteRow(10);
    }
}

// WebSocket event handlers
ws.onopen = () => {
    console.log('Connected to dashboard server');
    initializeCharts();
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    if (data.type === 'init') {
        updateMetrics(data.data);
    } else if (data.type === 'update') {
        updateMetrics(data.data);
        updateCharts(data.data);
    } else if (data.type === 'signal') {
        updateSignalsTable(data.data);
    }
};

ws.onerror = (error) => {
    console.error('WebSocket error:', error);
};

ws.onclose = () => {
    console.log('Disconnected from dashboard server');
}; 