import { useState, useEffect } from 'react';
import { TradingPair, MarketData } from '../types/trading';
import { PaperExchange } from '../lib/exchange/paperExchange';

export const useMarketData = (exchange: PaperExchange) => {
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTradingPairs = async () => {
      try {
        const pairs = await exchange.getTradingPairs();
        setTradingPairs(pairs);
      } catch (error) {
        console.error('Error fetching trading pairs:', error);
      }
    };

    fetchTradingPairs();
  }, [exchange]);

  useEffect(() => {
    if (tradingPairs.length === 0) return;

    const updateMarketData = async () => {
      try {
        const newMarketData: Record<string, MarketData> = {};
        
        for (const pair of tradingPairs) {
          const data = await exchange.getMarketData(pair.symbol);
          newMarketData[pair.symbol] = data;
        }

        setMarketData(newMarketData);
        setLoading(false);
      } catch (error) {
        console.error('Error updating market data:', error);
      }
    };

    updateMarketData();
    const interval = setInterval(updateMarketData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [exchange, tradingPairs]);

  return { tradingPairs, marketData, loading };
}; 