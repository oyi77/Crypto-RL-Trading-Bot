import React from 'react';
import { Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface Trade {
  id: string;
  symbol: string;
  side: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  timestamp: string;
}

const columns: ColumnsType<Trade> = [
  {
    title: 'Symbol',
    dataIndex: 'symbol',
    key: 'symbol',
  },
  {
    title: 'Side',
    dataIndex: 'side',
    key: 'side',
    render: (side: string) => (
      <Tag color={side === 'LONG' ? 'green' : 'red'}>
        {side}
      </Tag>
    ),
  },
  {
    title: 'Entry Price',
    dataIndex: 'entryPrice',
    key: 'entryPrice',
    render: (value: number) => value.toFixed(2),
  },
  {
    title: 'Exit Price',
    dataIndex: 'exitPrice',
    key: 'exitPrice',
    render: (value: number) => value.toFixed(2),
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
    render: (value: number) => (
      <Tag color={value >= 0 ? 'green' : 'red'}>
        {value.toFixed(2)}
      </Tag>
    ),
  },
  {
    title: 'Time',
    dataIndex: 'timestamp',
    key: 'timestamp',
  },
];

interface TradeHistoryProps {
  trades: Trade[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ trades }) => {
  return (
    <Table
      columns={columns}
      dataSource={trades}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      scroll={{ x: true }}
    />
  );
}; 