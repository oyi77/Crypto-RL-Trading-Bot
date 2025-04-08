import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Button, Space, Layout, Input } from 'antd';
import { PaperExchange } from '../lib/exchange/paperExchange';
import { logInfo } from '../lib/utils/logger';
import { SearchOutlined } from '@ant-design/icons';
import { TradingSignal } from './TradingSignal';
import { MarketData } from '../types/trading';

const { Header, Content } = Layout;
const { Option } = Select;

interface TradingMetricsProps {
  marketData: Record<string, MarketData>;
}

export const TradingMetrics: React.FC<TradingMetricsProps> = ({ marketData }) => {
  const [exchange] = useState(new PaperExchange());
  const [balance, setBalance] = useState(0);
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [price, setPrice] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const connectExchange = async () => {
      try {
        await exchange.connect();
        setIsConnected(true);
        const currentBalance = await exchange.getBalance();
        setBalance(currentBalance);
        logInfo('Exchange connected successfully');
      } catch (error) {
        logInfo('Failed to connect to exchange');
      }
    };

    connectExchange();
  }, [exchange]);

  useEffect(() => {
    if (!isConnected) return;

    const fetchPrice = async () => {
      try {
        const ticker = await exchange.getTicker(selectedPair);
        setPrice(ticker.last);
      } catch (error) {
        logInfo('Failed to fetch price');
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [exchange, selectedPair, isConnected]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const handlePairChange = (value: string) => {
    setSelectedPair(value);
  };

  const handleRefreshSignal = () => {
    // Implement signal refresh logic
    console.log('Refreshing signal for', selectedPair);
  };

  const pairs = Object.keys(marketData).filter(pair => 
    pair.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Layout style={{ background: 'transparent' }}>
      <Header style={{ 
        background: '#fff', 
        padding: '16px', 
        height: 'auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Space>
          <Input
            placeholder="Enter trading pair..."
            value={searchValue}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          <Select 
            value={selectedPair}
            onChange={handlePairChange}
            style={{ width: 200 }}
            showSearch
            filterOption={(input, option) =>
              (option?.value as string).toLowerCase().includes(input.toLowerCase())
            }
          >
            {pairs.map(pair => (
              <Option key={pair} value={pair}>{pair}</Option>
            ))}
          </Select>
        </Space>
      </Header>
      <Content>
        <TradingSignal 
          symbol={selectedPair}
          onRefresh={handleRefreshSignal}
        />
      </Content>
      <div>
        <Card title="Trading Status" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Exchange Status"
                value={isConnected ? 'Connected' : 'Disconnected'}
                valueStyle={{ color: isConnected ? 'green' : 'red' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Balance"
                value={balance}
                precision={2}
                prefix="$"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Selected Pair"
                value={selectedPair}
              />
            </Col>
          </Row>
        </Card>

        <Card title="Market Data" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Current Price"
                  value={price}
                  precision={2}
                  prefix="$"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="24h Change"
                  value={0}
                  precision={2}
                  suffix="%"
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="24h Volume"
                  value={0}
                  precision={2}
                  prefix="$"
                />
              </Col>
            </Row>
          </Space>
        </Card>
      </div>
    </Layout>
  );
}; 