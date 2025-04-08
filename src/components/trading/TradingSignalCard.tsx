import React from 'react';
import { Card, Typography, Table, Tag, Space, Divider } from 'antd';
import { TradingSignal } from '../../types/trading';

const { Title, Text } = Typography;

interface TradingSignalCardProps {
  signal: TradingSignal;
}

export const TradingSignalCard: React.FC<TradingSignalCardProps> = ({ signal }) => {
  const {
    pair,
    type,
    entry,
    stopLoss,
    takeProfit,
    technicalAnalysis,
    timestamp,
    exchange,
    leverage,
    capital
  } = signal;

  const biasData = [
    { parameter: 'Status', value: type, status: type },
    { parameter: 'Entry', value: `$${entry.toLocaleString()}`, status: '' },
    { parameter: 'Stop Loss (SL)', value: `$${stopLoss.toLocaleString()}`, status: '' },
    { parameter: 'Take Profit (TP)', value: `$${takeProfit.toLocaleString()}`, status: '' },
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
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div className="flex justify-between items-center">
          <div>
            <Title level={4} style={{ margin: 0 }}>{pair}</Title>
            <Text type="secondary">
              {new Date(timestamp).toLocaleString()} | {exchange} | {leverage}x | ${capital}
            </Text>
          </div>
          <Tag color={type === 'LONG' ? 'green' : 'red'} style={{ fontSize: '16px', padding: '4px 12px' }}>
            {type}
          </Tag>
        </div>

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card size="small" className="bg-gray-50">
              <Text strong>EMA Status</Text>
              <br />
              <Text>{technicalAnalysis.emaStatus}</Text>
            </Card>
            <Card size="small" className="bg-gray-50">
              <Text strong>Candlestick Pattern</Text>
              <br />
              <Text>{technicalAnalysis.candlestickPattern}</Text>
            </Card>
            <Card size="small" className="bg-gray-50">
              <Text strong>MACD</Text>
              <br />
              <Text>{technicalAnalysis.macd}</Text>
            </Card>
            <Card size="small" className="bg-gray-50">
              <Text strong>Volume Insight</Text>
              <br />
              <Text>{technicalAnalysis.volumeInsight}</Text>
            </Card>
            <Card size="small" className="bg-gray-50">
              <Text strong>RSI</Text>
              <br />
              <Text>{technicalAnalysis.rsi}</Text>
            </Card>
            <Card size="small" className="bg-gray-50">
              <Text strong>Support & Resistance</Text>
              <br />
              <Text>{technicalAnalysis.supportResistance}</Text>
            </Card>
          </div>
        </div>
      </Space>
    </Card>
  );
};
