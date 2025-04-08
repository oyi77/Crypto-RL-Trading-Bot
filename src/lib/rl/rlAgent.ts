import * as tf from '@tensorflow/tfjs';
import { MarketState } from '../types/market';
import { logInfo } from '../utils/logger';

export class RLAgent {
  private learningRate: number;
  private gamma: number;
  private epsilon: number;
  private model: tf.Sequential;
  private stateSize: number;
  private actionSize: number;

  constructor(
    stateSize: number = 10,
    actionSize: number = 3,
    learningRate: number = 0.001,
    gamma: number = 0.95,
    epsilon: number = 0.1
  ) {
    this.stateSize = stateSize;
    this.actionSize = actionSize;
    this.learningRate = learningRate;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.model = this.initializeModel();
  }

  private initializeModel(): tf.Sequential {
    const model = tf.sequential();
    
    // Input layer
    model.add(tf.layers.dense({
      units: 64,
      inputShape: [this.stateSize],
      activation: 'relu'
    }));
    
    // Hidden layers
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    
    // Output layer
    model.add(tf.layers.dense({
      units: this.actionSize,
      activation: 'softmax'
    }));
    
    // Compile the model
    model.compile({
      optimizer: tf.train.adam(this.learningRate),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    return model;
  }

  private stateToTensor(state: MarketState): tf.Tensor {
    // Convert market state to tensor
    const stateArray = [
      state.trend === 'UP' ? 1 : state.trend === 'DOWN' ? -1 : 0,
      state.volatility === 'HIGH' ? 1 : state.volatility === 'MEDIUM' ? 0.5 : 0,
      state.volume === 'HIGH' ? 1 : state.volume === 'MEDIUM' ? 0.5 : 0,
      state.momentum === 'STRONG' ? 1 : state.momentum === 'WEAK' ? -1 : 0,
      state.regime === 'BULL' ? 1 : -1
    ];
    
    return tf.tensor2d([stateArray], [1, this.stateSize]);
  }

  async getAction(state: MarketState): Promise<{ action: number; confidence: number }> {
    const stateTensor = this.stateToTensor(state);
    
    // Exploration
    if (Math.random() < this.epsilon) {
      const randomAction = Math.floor(Math.random() * this.actionSize);
      stateTensor.dispose();
      return { action: randomAction, confidence: 0 };
    }
    
    // Exploitation
    const prediction = this.model.predict(stateTensor) as tf.Tensor;
    const actionProbs = await prediction.data();
    const action = actionProbs.indexOf(Math.max(...actionProbs));
    const confidence = actionProbs[action];
    
    stateTensor.dispose();
    prediction.dispose();
    
    return { action, confidence };
  }

  async learn(
    state: MarketState,
    action: number,
    reward: number,
    nextState: MarketState,
    done: boolean
  ): Promise<void> {
    const stateTensor = this.stateToTensor(state);
    const nextStateTensor = this.stateToTensor(nextState);
    
    // Get current Q-values
    const currentQ = this.model.predict(stateTensor) as tf.Tensor;
    const currentQValues = await currentQ.data();
    
    // Calculate target Q-value
    let targetQValues = [...currentQValues];
    if (done) {
      targetQValues[action] = reward;
    } else {
      const nextQ = this.model.predict(nextStateTensor) as tf.Tensor;
      const nextQValues = await nextQ.data();
      const maxNextQ = Math.max(...nextQValues);
      targetQValues[action] = reward + this.gamma * maxNextQ;
      nextQ.dispose();
    }
    
    // Train the model
    await this.model.fit(stateTensor, tf.tensor2d([targetQValues], [1, this.actionSize]), {
      epochs: 1,
      verbose: 0
    });
    
    // Clean up tensors
    stateTensor.dispose();
    nextStateTensor.dispose();
    currentQ.dispose();
  }

  async saveModel(path: string): Promise<void> {
    try {
      await this.model.save(`localstorage://${path}`);
      logInfo('Model saved successfully', { path });
    } catch (error) {
      logInfo('Error saving model', { error });
    }
  }

  async loadModel(path: string): Promise<void> {
    try {
      const model = await tf.loadLayersModel(`localstorage://${path}`);
      this.model = model as tf.Sequential;
      logInfo('Model loaded successfully', { path });
    } catch (error) {
      logInfo('Error loading model', { error });
      this.model = this.initializeModel();
    }
  }
} 