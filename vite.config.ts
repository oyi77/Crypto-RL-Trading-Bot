import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { vitePluginNodePreGyp } from './vite-plugin-node-pre-gyp';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vitePluginNodePreGyp()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: [
        'mock-aws-s3',
        'aws-sdk',
        'nock',
        '@mapbox/node-pre-gyp',
        'node-pre-gyp',
        'http-proxy-agent',
        'https-proxy-agent',
        'socks-proxy-agent',
        '@tensorflow/tfjs-node'
      ],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          antd: ['antd', '@ant-design/icons'],
          tfjs: ['@tensorflow/tfjs']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: [
      'mock-aws-s3',
      'aws-sdk',
      'nock',
      '@mapbox/node-pre-gyp',
      'node-pre-gyp',
      'http-proxy-agent',
      'https-proxy-agent',
      'socks-proxy-agent',
      '@tensorflow/tfjs-node'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis'
  }
});
