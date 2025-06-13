import React, { useState, useEffect } from 'react';
import './App.css';

// 从 meta_map 库导入组件
import { MapViewer, validateMetaMapData, ClusterAlgorithmType } from '@ai-map/meta_map';



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
  const [clusterAlgorithm, setClusterAlgorithm] = useState(ClusterAlgorithmType.HIERARCHICAL);
  const [minClusterSize, setMinClusterSize] = useState(2);
  const [clusterDistance, setClusterDistance] = useState(100);



  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo('📍 正在加载新华宠友地图数据...');

      try {
        const data = await loadXinhuaPetData();

        // 验证数据格式
        // const validation = validateMetaMapData(data);
        // if (!validation.valid) {
        //   throw new Error(`数据验证失败: ${validation.errors?.join(', ')}`);
        // }

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

  // 热更新检测
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        setDebugInfo(`🔄 热更新检测中... - ${new Date().toLocaleTimeString()}`);
      }, 5000);

      return () => clearInterval(interval);
    }
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
      {/* 开发调试面板 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-panel">
          <div className="debug-header">
            <h3>🛠️ 新华宠友地图调试面板</h3>
            <div className="debug-status">
              <div>{debugInfo}</div>
              {mapData && (
                <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
                  📊 {mapData.name} | {mapData.data?.length || 0}个地点 |
                  中心: {mapData.center?.lat?.toFixed(4)}, {mapData.center?.lng?.toFixed(4)}
                </div>
              )}
            </div>
          </div>

          <div className="debug-controls">
            <div className="control-group">
              <label>聚类算法:</label>
              <select
                value={clusterAlgorithm}
                onChange={(e) => setClusterAlgorithm(e.target.value)}
              >
                <option value={ClusterAlgorithmType.NONE}>无聚类</option>
                <option value={ClusterAlgorithmType.BASIC}>基础聚类</option>
                <option value={ClusterAlgorithmType.DISTANCE}>距离聚类</option>
                <option value={ClusterAlgorithmType.DENSITY}>密度聚类</option>
                <option value={ClusterAlgorithmType.HIERARCHICAL}>分层聚类</option>
              </select>
            </div>

            <div className="control-group">
              <label>最小聚类大小:</label>
              <input
                type="number"
                min="2"
                max="20"
                value={minClusterSize}
                onChange={(e) => setMinClusterSize(parseInt(e.target.value) || 2)}
              />
            </div>

            <div className="control-group">
              <label>聚类距离:</label>
              <input
                type="number"
                min="50"
                max="1000"
                step="50"
                value={clusterDistance}
                onChange={(e) => setClusterDistance(parseInt(e.target.value) || 100)}
              />
            </div>

            <button
              onClick={() => window.location.reload()}
              className="reset-btn"
            >
              <i className="fa-solid fa-undo"></i> 重置地图
            </button>
          </div>
        </div>
      )}

      {/* 地图容器 */}
      <div className="map-wrapper">
        <MapViewer
          mapData={mapData}
          clusterAlgorithm={clusterAlgorithm}
          minClusterSize={minClusterSize}
          clusterDistance={clusterDistance}
          defaultView="map"
        />
      </div>
    </div>
  );
}

export default App; 