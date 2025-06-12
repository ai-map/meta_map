import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

// 从主包导入组件和必要的工具
import MapViewer, { validateStandardMapData, ClusterAlgorithmType } from "@ai-map/meta_map";

// 加载示例数据
async function loadMapData() {
  try {
    const response = await fetch("./xinhua_pet.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 验证数据格式
    const validation = validateStandardMapData(data);
    if (!validation.valid) {
      throw new Error(`数据验证失败: ${validation.errors?.join(", ")}`);
    }

    return data;
  } catch (error) {
    console.error("加载地图数据失败:", error);
    throw error;
  }
}

const Demo = () => {
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MapViewer 属性状态
  const [clusterAlgorithm, setClusterAlgorithm] = useState(ClusterAlgorithmType.DISTANCE);
  const [enableClustering, setEnableClustering] = useState(true);
  const [minClusterSize, setMinClusterSize] = useState(2);
  const [clusterDistance, setClusterDistance] = useState(80);
  const [defaultView, setDefaultView] = useState("map");

  // 加载数据
  useEffect(() => {
    loadMapData()
      .then((data) => {
        setMapData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="demo-loading">
        <div className="loading-container">
          <div className="loading-logo">🗺️</div>
          <h2>正在加载地图数据...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="demo-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>加载失败</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="demo-error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h3>数据错误</h3>
          <p>地图数据不可用</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* 左侧控制面板 */}
      <div
        style={{
          width: "40%",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
          MapViewer 参数测试 (JavaScript 版本)
        </h3>

        {/* 包状态指示 */}
        <div style={{ 
          marginBottom: "24px", 
          padding: "12px", 
          backgroundColor: "#e8f5e8", 
          borderRadius: "6px",
          border: "1px solid #4caf50"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            fontSize: "14px", 
            color: "#2e7d32" 
          }}>
            <span style={{ marginRight: "8px" }}>✅</span>
            <strong>本地包状态：已连接</strong>
          </div>
          <div style={{ fontSize: "12px", color: "#388e3c", marginTop: "4px" }}>
            使用 file:../ 引用本地 @ai-map/meta_map 包
          </div>
        </div>

        {/* 聚类设置 */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#666" }}>聚类设置</h4>

          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              启用聚类:
            </label>
            <input
              type="checkbox"
              checked={enableClustering}
              onChange={(e) => setEnableClustering(e.target.checked)}
              style={{ transform: "scale(1.2)" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              聚类算法:
            </label>
            <select
              value={clusterAlgorithm}
              onChange={(e) => setClusterAlgorithm(e.target.value)}
              disabled={!enableClustering}
              style={{
                width: "100%",
                padding: "6px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: enableClustering ? "white" : "#f0f0f0",
              }}
            >
              <option value={ClusterAlgorithmType.DISTANCE}>距离聚类</option>
              <option value={ClusterAlgorithmType.DENSITY}>密度聚类</option>
              <option value={ClusterAlgorithmType.HIERARCHICAL}>层次聚类</option>
              <option value={ClusterAlgorithmType.NONE}>无聚类</option>
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              最小聚类大小: {minClusterSize}
            </label>
            <input
              type="range"
              min="2"
              max="10"
              value={minClusterSize}
              onChange={(e) => setMinClusterSize(parseInt(e.target.value))}
              disabled={!enableClustering}
              style={{
                width: "100%",
                opacity: enableClustering ? 1 : 0.5,
              }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              聚类距离: {clusterDistance}m
            </label>
            <input
              type="range"
              min="20"
              max="200"
              value={clusterDistance}
              onChange={(e) => setClusterDistance(parseInt(e.target.value))}
              disabled={!enableClustering}
              style={{
                width: "100%",
                opacity: enableClustering ? 1 : 0.5,
              }}
            />
          </div>
        </div>

        {/* 显示设置 */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#666" }}>显示设置</h4>

          <div style={{ marginBottom: "12px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "14px",
              }}
            >
              默认视图:
            </label>
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value)}
              style={{
                width: "100%",
                padding: "6px",
                border: "1px solid #ccc",
                borderRadius: "4px",
              }}
            >
              <option value="map">地图视图</option>
              <option value="list">列表视图</option>
            </select>
          </div>
        </div>

        {/* 统计信息 */}
        <div style={{
          backgroundColor: "#f8f9fa",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #e9ecef"
        }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#666" }}>数据统计</h4>
          <div style={{ fontSize: "14px", lineHeight: "1.6" }}>
            <div>📍 总点位数: <strong>{mapData.points?.length || 0}</strong></div>
            <div>🏷️ 分类数: <strong>{mapData.categories?.length || 0}</strong></div>
            <div>📊 聚类算法: <strong>
              {clusterAlgorithm === ClusterAlgorithmType.DISTANCE && "距离聚类"}
              {clusterAlgorithm === ClusterAlgorithmType.DENSITY && "密度聚类"}
              {clusterAlgorithm === ClusterAlgorithmType.HIERARCHICAL && "层次聚类"}
              {clusterAlgorithm === ClusterAlgorithmType.NONE && "无聚类"}
            </strong></div>
          </div>
        </div>
      </div>

      {/* 右侧地图区域 */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapViewer
          mapData={mapData}
          clusterAlgorithm={clusterAlgorithm}
          enableClustering={enableClustering}
          minClusterSize={minClusterSize}
          clusterDistance={clusterDistance}
          defaultView={defaultView}
          onPointSelect={(point) => {
            console.log("选中点位:", point);
          }}
          onMapReady={() => {
            console.log("地图已准备就绪");
          }}
        />
      </div>
    </div>
  );
};

// 渲染应用
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Demo />); 