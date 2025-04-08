import React from 'react';
import { Card, Space, Typography, Progress } from 'antd';
import { Line } from '@ant-design/plots';

const { Title } = Typography;

export interface LearningMetricsProps {
  episodeRewards: number[];
  explorationRate: number;
  learningRate: number;
  totalEpisodes: number;
  currentEpisode: number;
  averageReward: number;
  bestReward: number;
}

export const LearningMetrics: React.FC<LearningMetricsProps> = ({
  episodeRewards,
  explorationRate,
  learningRate,
  totalEpisodes,
  currentEpisode,
  averageReward,
  bestReward,
}) => {
  const config = {
    data: episodeRewards.map((reward, index) => ({
      episode: index + 1,
      reward,
    })),
    xField: 'episode',
    yField: 'reward',
    smooth: true,
    xAxis: {
      title: {
        text: 'Episode',
      },
    },
    yAxis: {
      title: {
        text: 'Reward',
      },
    },
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Title level={4}>Progress</Title>
            <Progress
              percent={Math.round((currentEpisode / totalEpisodes) * 100)}
              format={() => `${currentEpisode}/${totalEpisodes}`}
            />
          </div>
          <div>
            <Title level={4}>Exploration Rate</Title>
            <Progress
              percent={explorationRate}
              status="active"
              strokeColor="#1890ff"
            />
          </div>
          <div>
            <Title level={4}>Learning Rate</Title>
            <p>{learningRate.toExponential(2)}</p>
          </div>
          <div>
            <Title level={4}>Best Reward</Title>
            <p>{bestReward.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card title="Training Progress">
        <Line {...config} />
      </Card>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Title level={4}>Average Reward</Title>
            <p>{averageReward.toFixed(2)}</p>
          </div>
          <div>
            <Title level={4}>Episodes Completed</Title>
            <p>{currentEpisode} / {totalEpisodes}</p>
          </div>
        </div>
      </Card>
    </Space>
  );
}; 