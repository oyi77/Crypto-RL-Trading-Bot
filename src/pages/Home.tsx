import React from 'react';
import { Layout, Typography, Button, Card, Row, Col, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BarChartOutlined, LineChartOutlined, RobotOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigation = (tab: string) => {
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Title level={3} style={{ margin: '16px 0' }}>
          Crypto Trading Assistant
        </Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card>
              <Title level={2}>Welcome to Crypto Trading Assistant</Title>
              <Paragraph>
                A powerful tool for automated cryptocurrency trading, backtesting, and strategy optimization.
                Monitor real-time market data, execute trades, and optimize your strategies with machine learning.
              </Paragraph>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              title={
                <Space>
                  <BarChartOutlined />
                  Backtesting
                </Space>
              } 
              hoverable
              style={{ height: '100%' }}
            >
              <Paragraph>
                Test your trading strategies against historical data to evaluate performance.
                Analyze results and optimize your approach before going live.
              </Paragraph>
              <Button 
                type="primary" 
                onClick={() => handleNavigation('backtest')}
                style={{ marginTop: '16px' }}
              >
                Start Backtesting
              </Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              title={
                <Space>
                  <LineChartOutlined />
                  Live Trading
                </Space>
              } 
              hoverable
              style={{ height: '100%' }}
            >
              <Paragraph>
                Execute trades in real-time with automated strategies and risk management.
                Monitor positions and performance with real-time updates.
              </Paragraph>
              <Button 
                type="primary" 
                onClick={() => handleNavigation('trading')}
                style={{ marginTop: '16px' }}
              >
                Start Trading
              </Button>
            </Card>
          </Col>
          <Col span={8}>
            <Card 
              title={
                <Space>
                  <RobotOutlined />
                  Learning
                </Space>
              } 
              hoverable
              style={{ height: '100%' }}
            >
              <Paragraph>
                Monitor and optimize your trading strategies using machine learning.
                View performance metrics and adjust parameters for better results.
              </Paragraph>
              <Button 
                type="primary" 
                onClick={() => handleNavigation('learning')}
                style={{ marginTop: '16px' }}
              >
                View Metrics
              </Button>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}; 