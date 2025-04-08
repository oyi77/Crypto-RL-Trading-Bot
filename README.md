# Crypto Trading Assistant

An advanced crypto trading bot that uses Reinforcement Learning (PPO) to make trading decisions. The bot features real-time market analysis, risk management, and automatic learning capabilities.

## Features

- **Reinforcement Learning**: Uses Proximal Policy Optimization (PPO) to learn from trading experiences
- **Real Market Data**: Connects to Binance for real-time market data
- **Paper Trading**: Test strategies with real market data without risking real money
- **Risk Management**: Advanced position sizing and risk controls
- **Market Analysis**: Technical indicators, market state analysis, and correlation tracking
- **Performance Tracking**: Comprehensive metrics and decision analysis
- **Automatic Learning**: Continuous improvement through experience

## Prerequisites

- Node.js 16+ or Bun runtime
- Binance account (for real trading)
- API keys (for real trading)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/crypto-trading-assistant.git
cd crypto-trading-assistant
```

2. Install dependencies:
```bash
bun install
```

3. Create environment file:
```bash
cp .env.example .env
```

## Configuration

Edit the `.env` file with your settings:

```env
# Trading Configuration
SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT
TIMEFRAME=1h
INITIAL_CAPITAL=10000

# Risk Management
MAX_RISK_PER_TRADE=0.02
MAX_LEVERAGE=10
STOP_LOSS_DISTANCE=0.02
TAKE_PROFIT_DISTANCE=0.04
TRAILING_STOP_DISTANCE=0.01
MAX_OPEN_POSITIONS=5

# Training Configuration
BATCH_SIZE=64
EPOCHS=10
VALIDATION_SPLIT=0.2
MIN_TRADES=100
MIN_WIN_RATE=0.55
MAX_DRAWDOWN=0.2
RETRAIN_INTERVAL=86400000

# Binance API (for real trading)
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
```

## Paper Trading & RL Learning Configuration

### Essential Settings for Paper Trading

1. **Basic Trading Configuration**:
```env
# Trading pairs to monitor and trade
SYMBOLS=BTCUSDT,ETHUSDT,BNBUSDT  # Start with 1-3 pairs for testing

# Timeframe for analysis and trading
TIMEFRAME=1h  # Options: 1m, 5m, 15m, 1h, 4h, 1d

# Initial capital for paper trading
INITIAL_CAPITAL=10000  # Start with a reasonable amount for testing
```

2. **Risk Management Settings**:
```env
# Maximum risk per trade (as percentage of capital)
MAX_RISK_PER_TRADE=0.02  # 2% risk per trade

# Maximum leverage to use
MAX_LEVERAGE=5  # Start with lower leverage for testing

# Stop loss and take profit distances (as percentage)
STOP_LOSS_DISTANCE=0.02  # 2% stop loss
TAKE_PROFIT_DISTANCE=0.04  # 4% take profit
TRAILING_STOP_DISTANCE=0.01  # 1% trailing stop

# Maximum number of concurrent positions
MAX_OPEN_POSITIONS=3  # Start with fewer positions
```

### RL Learning Configuration

1. **Training Parameters**:
```env
# Batch size for training
BATCH_SIZE=64  # Number of experiences to train on at once

# Number of training epochs
EPOCHS=10  # Number of times to iterate over the batch

# Validation split for training
VALIDATION_SPLIT=0.2  # 20% of data used for validation

# Minimum trades before retraining
MIN_TRADES=100  # Minimum number of trades to collect before training

# Performance thresholds
MIN_WIN_RATE=0.55  # Minimum win rate to consider strategy successful
MAX_DRAWDOWN=0.2  # Maximum allowed drawdown (20%)

# Retraining interval in milliseconds (24 hours)
RETRAIN_INTERVAL=86400000
```

2. **RL State Configuration**:
```env
# State window size (number of candles to look back)
STATE_WINDOW=50  # How many past candles to consider

# Technical indicators to include in state
INDICATORS=EMA,MACD,RSI,VOLUME  # Indicators to use for decision making

# Market conditions to consider
MARKET_CONDITIONS=TREND,VOLATILITY,VOLUME  # Market aspects to analyze
```

### Starting Paper Trading with RL

1. **Initial Setup**:
```bash
# 1. Create .env file
cp .env.example .env

# 2. Edit .env with your settings
# Start with conservative values:
SYMBOLS=BTCUSDT
TIMEFRAME=1h
INITIAL_CAPITAL=10000
MAX_RISK_PER_TRADE=0.02
MAX_LEVERAGE=5
```

2. **Start Paper Trading**:
```bash
bun run src/scripts/runPaperTrading.ts
```

3. **Monitor Learning Progress**:
- The bot will log training metrics every RETRAIN_INTERVAL
- Check logs/training.log for detailed learning statistics
- Monitor win rate and drawdown in logs/portfolio.log

### RL Learning Process

1. **Data Collection Phase**:
- Bot collects trading experiences
- Minimum MIN_TRADES required before first training
- Experiences stored in memory for training

2. **Training Phase**:
- Occurs every RETRAIN_INTERVAL
- Uses collected experiences to update policy
- Validates performance on separate dataset

3. **Performance Monitoring**:
- Tracks win rate and drawdown
- Adjusts strategy if performance drops
- Logs learning progress and metrics

### Optimizing RL Learning

1. **For Faster Learning**:
```env
# Reduce batch size for more frequent updates
BATCH_SIZE=32

# Increase training frequency
RETRAIN_INTERVAL=43200000  # 12 hours

# Lower minimum trades requirement
MIN_TRADES=50
```

2. **For More Stable Learning**:
```env
# Increase batch size for more stable updates
BATCH_SIZE=128

# Increase epochs for better convergence
EPOCHS=20

# Higher minimum trades for more data
MIN_TRADES=200
```

3. **For Better Performance**:
```env
# Stricter performance requirements
MIN_WIN_RATE=0.6
MAX_DRAWDOWN=0.15

# More frequent validation
VALIDATION_SPLIT=0.3
```

## Running the Bot

### Paper Trading Mode

Paper trading uses real market data but simulates trades without using real money. This is perfect for testing strategies.

1. Start the paper trading bot:
```bash
bun run src/scripts/runPaperTrading.ts
```

The bot will:
- Connect to Binance for real market data
- Simulate trades using real prices
- Track positions and PnL
- Log performance metrics every 5 minutes
- Provide a comprehensive summary when stopped

### Real Trading Mode

For real trading, you'll need Binance API credentials.

1. Set up your Binance API keys in `.env`:
```env
BINANCE_API_KEY=your_api_key
BINANCE_API_SECRET=your_api_secret
```

2. Start the real trading bot:
```bash
bun run src/scripts/runRealTrading.ts
```

### Monitoring

The bot logs various information:

1. **Portfolio Metrics** (every 5 minutes):
   - Total value
   - Unrealized PnL
   - Realized PnL
   - Win rate
   - Profit factor
   - Sharpe ratio
   - Maximum drawdown

2. **Trading Decisions**:
   - Entry/exit points
   - Position sizes
   - Risk assessments
   - Market conditions

3. **Performance Analysis**:
   - Decision accuracy
   - Market condition performance
   - Risk-adjusted returns

### Stopping the Bot

Press `Ctrl+C` to stop the bot gracefully. It will:
1. Close all open positions
2. Save the current state
3. Log a final performance summary

## Risk Management

The bot includes several risk management features:

1. **Position Sizing**:
   - Maximum risk per trade
   - Dynamic position sizing based on volatility
   - Leverage limits

2. **Stop Losses**:
   - Fixed stop losses
   - Trailing stops
   - Take profit targets

3. **Portfolio Limits**:
   - Maximum open positions
   - Correlation-based position limits
   - Daily loss limits

## Reinforcement Learning

The bot uses PPO (Proximal Policy Optimization) to learn from trading experiences:

1. **State Representation**:
   - Price data
   - Volume
   - Technical indicators
   - Market conditions

2. **Action Space**:
   - LONG
   - SHORT
   - HOLD

3. **Reward Function**:
   - PnL-based rewards
   - Risk-adjusted returns
   - Time-based penalties

4. **Training Process**:
   - Automatic retraining
   - Experience replay
   - Policy optimization

## Troubleshooting

Common issues and solutions:

1. **API Connection Issues**:
   - Check your API keys
   - Verify network connection
   - Ensure correct permissions

2. **Performance Issues**:
   - Reduce number of symbols
   - Increase timeframe
   - Optimize batch size

3. **Memory Issues**:
   - Clear old logs
   - Reduce history length
   - Optimize data structures

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License - see LICENSE file for details
# Crypto-RL-Trading-Bot
