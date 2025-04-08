import React from 'react';
import { Card, Space, Typography, Table } from 'antd';
import { Trade } from '../../types/trading';

const { Title } = Typography;

interface BacktestResult {
  totalPnL: number;
  averagePnL: number;
  winRate: number;
  totalTrades: number;
  tradeHistory: Trade[];
}

interface BacktestResultsProps {
  results: BacktestResult;
}

export const BacktestResults: React.FC<BacktestResultsProps> = ({ results }) => {
  const columns = [
    {
      title: 'Pair',
      dataIndex: 'pair',
      key: 'pair',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Entry Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toLocaleString()}`,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: 'PnL',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl: number) => (
        <span style={{ color: pnl >= 0 ? 'green' : 'red' }}>
          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
        </span>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Title level={4}>Total PnL</Title>
            <p className={results.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
              {results.totalPnL >= 0 ? '+' : ''}{results.totalPnL.toFixed(2)}%
            </p>
          </div>
          <div>
            <Title level={4}>Win Rate</Title>
            <p>{results.winRate.toFixed(2)}%</p>
          </div>
          <div>
            <Title level={4}>Total Trades</Title>
            <p>{results.totalTrades}</p>
          </div>
          <div>
            <Title level={4}>Average PnL</Title>
            <p className={results.averagePnL >= 0 ? 'text-green-500' : 'text-red-500'}>
              {results.averagePnL >= 0 ? '+' : ''}{results.averagePnL.toFixed(2)}%
            </p>
          </div>
        </div>
      </Card>

      <Card title="Trade History">
        <Table
          dataSource={results.tradeHistory}
          columns={columns}
          rowKey={(record, index) => index.toString()}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </Space>
  );
}; 