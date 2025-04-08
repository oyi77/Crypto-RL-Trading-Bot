import React from 'react';
import { Card, Typography, Button } from 'antd';
import { BarChart2, LineChart, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

export const Welcome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-8">
      <div className="mb-12">
        <Title level={1} className="text-white">Welcome to Crypto Trading Assistant</Title>
        <Paragraph className="text-gray-300">
          A powerful tool for automated cryptocurrency trading, backtesting, and strategy optimization. Monitor real-time market data, execute trades, and optimize your strategies with machine learning.
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-800 text-white hover:bg-gray-700 transition-colors">
          <div className="flex flex-col items-start gap-4">
            <BarChart2 size={24} />
            <Title level={3} className="text-white">Backtesting</Title>
            <Paragraph className="text-gray-300">
              Test your trading strategies against historical data to evaluate performance. Analyze results and optimize your approach before going live.
            </Paragraph>
            <Button 
              type="primary"
              onClick={() => navigate('/dashboard?tab=backtest')}
              className="mt-auto"
            >
              Start Backtesting
            </Button>
          </div>
        </Card>

        <Card className="bg-gray-800 text-white hover:bg-gray-700 transition-colors">
          <div className="flex flex-col items-start gap-4">
            <LineChart size={24} />
            <Title level={3} className="text-white">Live Trading</Title>
            <Paragraph className="text-gray-300">
              Execute trades in real-time with automated strategies and risk management. Monitor positions and performance with real-time updates.
            </Paragraph>
            <Button 
              type="primary"
              onClick={() => navigate('/dashboard?tab=live')}
              className="mt-auto"
            >
              Start Trading
            </Button>
          </div>
        </Card>

        <Card className="bg-gray-800 text-white hover:bg-gray-700 transition-colors">
          <div className="flex flex-col items-start gap-4">
            <Brain size={24} />
            <Title level={3} className="text-white">Learning</Title>
            <Paragraph className="text-gray-300">
              Monitor and optimize your trading strategies using machine learning. View performance metrics and adjust parameters for better results.
            </Paragraph>
            <Button 
              type="primary"
              onClick={() => navigate('/dashboard?tab=learning')}
              className="mt-auto"
            >
              View Metrics
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}; 