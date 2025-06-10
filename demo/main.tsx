import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  MapViewer,
  StandardMapData,
  validateStandardMapData,
  ClusterAlgorithmType,
} from "@ai-map/meta_map";

// 加载示例数据
async function loadMapData(): Promise<StandardMapData> {
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

const Demo: React.FC = () => {
  const [mapData, setMapData] = useState<StandardMapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // MapViewer 属性状态
  const [clusterAlgorithm, setClusterAlgorithm] =
    useState<ClusterAlgorithmType>(ClusterAlgorithmType.DISTANCE);
  const [enableClustering, setEnableClustering] = useState(true);
  const [minClusterSize, setMinClusterSize] = useState(2);
  const [clusterDistance, setClusterDistance] = useState(80);
  const [defaultView, setDefaultView] = useState<"map" | "list">("map");

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
          MapViewer 参数测试
        </h3>

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
              onChange={(e) =>
                setClusterAlgorithm(e.target.value as ClusterAlgorithmType)
              }
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
              <option value={ClusterAlgorithmType.HIERARCHICAL}>
                层次聚类
              </option>
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
              max="500"
              step="10"
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

        {/* 视图设置 */}
        <div style={{ marginBottom: "24px" }}>
          <h4 style={{ margin: "0 0 12px 0", color: "#666" }}>视图设置</h4>

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
              onChange={(e) => setDefaultView(e.target.value as "map" | "list")}
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

        {/* 当前配置显示 */}
        <div
          style={{
            padding: "12px",
            backgroundColor: "#e8f4fd",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#666",
          }}
        >
          <h5 style={{ margin: "0 0 8px 0", color: "#333" }}>当前配置:</h5>
          <div>聚类: {enableClustering ? "启用" : "禁用"}</div>
          <div>算法: {clusterAlgorithm}</div>
          <div>最小大小: {minClusterSize}</div>
          <div>距离: {clusterDistance}m</div>
          <div>视图: {defaultView}</div>
        </div>

        {/* 包信息显示 */}
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            backgroundColor: "#e8f7e8",
            borderRadius: "6px",
            fontSize: "12px",
            color: "#2d5a2d",
          }}
        >
          <h5 style={{ margin: "0 0 8px 0", color: "#1e4e1e" }}>包信息:</h5>
          <div>✅ 使用本地包: @ai-map/meta_map</div>
          <div>✅ 导入测试: 已通过</div>
          <div>✅ 组件加载: 正常</div>
        </div>
      </div>

      {/* 右侧地图区域 */}
      <MapViewer
        mapData={mapData}
        clusterAlgorithm={clusterAlgorithm}
        enableClustering={enableClustering}
        minClusterSize={minClusterSize}
        clusterDistance={clusterDistance}
        defaultView={defaultView}
      />
    </div>
  );
};

// 启动应用
const container = document.getElementById("mapViewer");
if (container) {
  const root = createRoot(container);
  root.render(<Demo />);
} else {
  console.error('找不到 #mapViewer 容器');
}
