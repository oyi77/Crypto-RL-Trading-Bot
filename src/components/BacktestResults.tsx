import React from 'react';
import { Card, Statistic, Table } from 'antd';
import { Line } from '@ant-design/charts';
import { formatCurrency, formatPercent } from '../utils/formatters';

interface BacktestResult {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  averagePnL: number;
  equityCurve: Array<{ timestamp: number; equity: number }>;
  tradeHistory: Array<{
    timestamp: number;
    type: string;
    price: number;
    size: number;
    pnl: number;
  }>;
}

interface BacktestResultsProps {
  results?: BacktestResult;
}

export const BacktestResults: React.FC<BacktestResultsProps> = ({ results }) => {
  if (!results) {
    return null;
  }

  const { totalPnL, winRate, totalTrades, averagePnL, equityCurve, tradeHistory } = results;

  const equityData = equityCurve.map((point) => ({
    date: new Date(point.timestamp).toLocaleDateString(),
    value: point.equity
  }));

  const columns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleDateString()
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <span style={{ color: type === 'buy' ? '#52c41a' : '#f5222d' }}>
          {type.toUpperCase()}
        </span>
      )
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => formatCurrency(price)
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size'
    },
    {
      title: 'PnL',
      dataIndex: 'pnl',
      key: 'pnl',
      render: (pnl: number) => (
        <span style={{ color: pnl >= 0 ? '#52c41a' : '#f5222d' }}>
          {formatCurrency(pnl)}
        </span>
      )
    }
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <Statistic
              title="Total PnL"
              value={totalPnL}
              precision={2}
              valueStyle={{ color: totalPnL >= 0 ? '#52c41a' : '#f5222d' }}
              formatter={(value) => formatCurrency(value as number)}
            />
            <Statistic
              title="Win Rate"
              value={winRate}
              precision={2}
              suffix="%"
              valueStyle={{ color: winRate >= 50 ? '#52c41a' : '#f5222d' }}
            />
            <Statistic
              title="Total Trades"
              value={totalTrades}
            />
            <Statistic
              title="Average PnL"
              value={averagePnL}
              precision={2}
              valueStyle={{ color: averagePnL >= 0 ? '#52c41a' : '#f5222d' }}
              formatter={(value) => formatCurrency(value as number)}
            />
          </div>
        </Card>
      </div>

      <Card title="Equity Curve" style={{ marginBottom: 24 }}>
        <Line
          data={equityData}
          xField="date"
          yField="value"
          point={{ size: 2 }}
          tooltip={{
            formatter: (datum) => {
              return { name: 'Equity', value: formatCurrency(datum.value) };
            }
          }}
        />
      </Card>

      <Card title="Trade History">
        <Table
          dataSource={tradeHistory}
          columns={columns}
          rowKey="timestamp"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
}; 