import React from 'react';
import { Card, Typography, Table, Button, Tag, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface TradingSignalProps {
  symbol: string;
  onRefresh: () => void;
}

interface BiasData {
  parameter: string;
  value: string | number;
  status: string;
}

interface TechnicalData {
  title: string;
  description: string;
  value?: string;
}

export const TradingSignal: React.FC<TradingSignalProps> = ({ symbol, onRefresh }) => {
  // Example data - replace with real data from your trading system
  const biasData: BiasData[] = [
    { parameter: 'Status', value: 'LONG', status: 'LONG' },
    { parameter: 'Entry', value: '$83,468.29', status: '' },
    { parameter: 'Stop Loss (SL)', value: '$81,154.29', status: '' },
    { parameter: 'Take Profit (TP)', value: '$88,096.29', status: '' },
  ];

  const technicalAnalysis: TechnicalData[] = [
    {
      title: 'EMA Status',
      description: 'EMA 12 > EMA 26 = bullish'
    },
    {
      title: 'Candlestick Pattern',
      description: 'Bullish Engulfing'
    },
    {
      title: 'MACD',
      description: 'MACD above signal = bullish'
    },
    {
      title: 'Volume Insight',
      description: 'Rising volume = trend confirmation'
    },
    {
      title: 'RSI',
      description: 'RSI 65 = bullish'
    },
    {
      title: 'Support & Resistance',
      description: 'S: $81,154.29, R: $88,096.29'
    }
  ];

  const columns = [
    {
      title: 'Parameter',
      dataIndex: 'parameter',
      key: 'parameter',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => status ? (
        <Tag color={status === 'LONG' ? 'green' : 'red'}>
          {status}
        </Tag>
      ) : null,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Title level={4}>Live Trading Signal for {symbol}</Title>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={onRefresh}
          >
            Refresh Signal
          </Button>
        </div>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={5} style={{ marginBottom: 16 }}>Bias Pasar</Title>
            <Table 
              dataSource={biasData} 
              columns={columns} 
              pagination={false}
              size="small"
            />
          </div>

          <div>
            <Title level={5} style={{ marginBottom: 16 }}>Analisis Teknis</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              {technicalAnalysis.map((analysis, index) => (
                <Card key={index} size="small">
                  <Text strong>{analysis.title}</Text>
                  <br />
                  <Text>{analysis.description}</Text>
                </Card>
              ))}
            </Space>
          </div>
        </Space>
 