import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Button } from 'antd';
import { RLAgent } from '../lib/rl/rlAgent';
import { logInfo } from '../lib/utils/logger';

export const LearningMetrics: React.FC = () => {
  const [agent] = useState(new RLAgent());
  const [episode, setEpisode] = useState(0);
  const [totalEpisodes, setTotalEpisodes] = useState(100);
  const [averageReward, setAverageReward] = useState(0);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    const loadModel = async () => {
      try {
        await agent.loadModel();
        logInfo('Model loaded successfully');
      } catch (error) {
        logInfo('No saved model found, starting fresh');
      }
    };

    loadModel();
  }, [agent]);

  const startTraining = async () => {
    setIsTraining(true);
    try {
      // Simulate training progress
      for (let i = 0; i < totalEpisodes; i++) {
        setEpisode(i + 1);
        setAverageReward(Math.random() * 100); // Simulated reward
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      await agent.saveModel();
      logInfo('Training completed and model saved');
    } catch (error) {
      logInfo('Training failed');
    } finally {
      setIsTraining(false);
    }
  };

  return (
    <div>
      <Card title="Learning Progress" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Current Episode"
              value={episode}
              suffix={`/ ${totalEpisodes}`}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Average Reward"
              value={averageReward}
              precision={2}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Training Status"
              value={isTraining ? 'Training' : 'Idle'}
              valueStyle={{ color: isTraining ? 'green' : 'gray' }}
            />
          </Col>
        </Row>
        <Progress
          percent={(episode / totalEpisodes) * 100}
          status={isTraining ? 'active' : 'normal'}
          style={{ marginTop: 16 }}
        />
        <Button
          type="primary"
          onClick={startTraining}
          loading={isTraining}
          style={{ marginTop: 16 }}
          block
        >
          {isTraining ? 'Training...' : 'Start Training'}
        </Button>
      </Card>

      <Card title="Model Performance">
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Exploration Rate"
              value={agent.getEpsilon() * 100}
              precision={2}
              suffix="%"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Learning Rate"
              value={agent.getLearningRate()}
              precision={6}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Discount Factor"
              value={agent.getGamma()}
              precision={2}
            />
          </Col>
        </Row>
      </Card>
    </div>
  );
}; 