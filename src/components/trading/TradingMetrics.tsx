import React from 'react';
import { Card, Row, Col, Statistic, Table } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { TradingSignal } from '../../types/trading';

interface TradingMetricsProps {
  balance: number;
  pnl: number;
  winRate: number;
  totalTrades: number;
  openPositions: number;
  recentSignals: TradingSignal[];
}

export const TradingMetrics: React.FC<TradingMetricsProps> = ({
  balance,
  pnl,
  winRate,
  totalTrades,
  openPositions,
  recentSignals,
}) => {
  const columns = [
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp).toLocaleString(),
    },
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
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => price.toFixed(2),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => size.toFixed(4),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Balance"
              value={balance}
              precision={2}
              prefix="$"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="PnL"
              value={pnl}
              precision={2}
              prefix={pnl >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix="%"
              valueStyle={{ color: pnl >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Win Rate"
              value={winRate}
              precision={2}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Total Trades"
              value={totalTrades}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Open Positions"
              value={openPositions}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Signals" style={{ marginTop: 16 }}>
        <Table
          dataSource={recentSignals}
          columns={columns}
          pagination={{ pageSize: 5 }}
          rowKey={(record) => `${record.timestamp}-${record.pair}-${record.type}`}
        />
      </Card>
    </div>
  );
}; 