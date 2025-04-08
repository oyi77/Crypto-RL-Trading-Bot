import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
        },
        components: {
          Layout: {
            bodyBg: '#141414',
            headerBg: '#1f1f1f',
            siderBg: '#1f1f1f',
          },
          Card: {
            colorBgContainer: '#1f1f1f',
          },
          Table: {
            colorBgContainer: '#1f1f1f',
          }
        }
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
