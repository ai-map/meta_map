import React, { useEffect, useState } from 'react';
import './App.css';

// 从 dist 目录直接导入组件
import { ClusterAlgorithmType, MapViewer, validateMetaMapData } from './dist';

// 加载新华宠友地图数据
const loadXinhuaPetData = async () => {
  try {
    const response = await fetch('/xinhua_pet.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data;
  } catch (error) {
    console.error('加载新华宠友地图数据失败:', error);
    throw error;
  }
};

function App() {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  // 聚类参数控制
  const [clusterAlgorithm] = useState(ClusterAlgorithmType.HIERARCHICAL);
  const [minClusterSize] = useState(2);
  const [clusterDistance] = useState(100);

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo('📍 正在加载新华宠友地图数据...');

      try {
        const data = await loadXinhuaPetData();

        // 验证数据格式
        const validation = validateMetaMapData(data);
        if (!validation.valid) {
          throw new Error(`数据验证失败: ${validation.errors?.join(', ')}`);
        }

        setMapData(data);
        setDebugInfo(`✅ ${data.name || '地图数据'}加载成功 (${data.data?.length || 0}个地点) - ${new Date().toLocaleTimeString()}`);
        setLoading(false);
      } catch (err) {
        console.error('数据加载错误:', err);
        setError(err.message);
        setDebugInfo(`❌ 数据加载失败: ${err.message}`);
        setLoading(false);
      }
    };

    loadData();
  }, []);


  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <div>正在加载地图数据...</div>
          <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
            {debugInfo}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div><strong>新华宠友地图加载失败</strong></div>
          <div style={{ fontSize: '14px', marginTop: '8px', marginBottom: '16px' }}>{error}</div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重新加载
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <MapViewer
        mapData={mapData}
        clusterAlgorithm={clusterAlgorithm}
        minClusterSize={minClusterSize}
        clusterDistance={clusterDistance}
        defaultView="map"
      />
    </div>
  );
}

export default App; 