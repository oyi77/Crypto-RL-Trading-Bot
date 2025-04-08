import React from 'react';
import { Card, Form, Select, DatePicker, InputNumber, Button } from 'antd';
import { availablePairs } from '../../lib/constants/mockData';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface BacktestConfigProps {
  onStartBacktest: (config: BacktestConfig) => void;
  isLoading?: boolean;
}

export interface BacktestConfig {
  pair: string;
  timeframe: string;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
}

export const BacktestConfig: React.FC<BacktestConfigProps> = ({ onStartBacktest, isLoading = false }) => {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    const [startDate, endDate] = values.dateRange;
    const config: BacktestConfig = {
      pair: values.pair,
      timeframe: values.timeframe,
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
      initialBalance: values.initialBalance,
    };
    onStartBacktest(config);
  };

  return (
    <Card title="Backtest Configuration">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          pair: 'BTC/USDT',
          timeframe: '1h',
          initialBalance: 10000,
          dateRange: [dayjs().subtract(1, 'year'), dayjs()],
        }}
      >
        <Form.Item
          name="pair"
          label="Trading Pair"
          rules={[{ required: true, message: 'Please select a trading pair' }]}
        >
          <Select options={availablePairs.map(pair => ({ label: pair, value: pair }))} />
        </Form.Item>

        <Form.Item
          name="timeframe"
          label="Timeframe"
          rules={[{ required: true, message: 'Please select a timeframe' }]}
        >
          <Select
            options={[
              { label: '1 minute', value: '1m' },
              { label: '5 minutes', value: '5m' },
              { label: '15 minutes', value: '15m' },
              { label: '1 hour', value: '1h' },
              { label: '4 hours', value: '4h' },
              { label: '1 day', value: '1d' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Please select a date range' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            showTime
          />
        </Form.Item>

        <Form.Item
          name="initialBalance"
          label="Initial Balance (USDT)"
          rules={[{ required: true, message: 'Please enter initial balance' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1}
            step={100}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading} block>
            Start Backtest
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}; 