import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { MapViewer, StandardMapData, validateStandardMapData } from "../src";

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

  return <MapViewer mapData={mapData} />;
};

// 启动应用
const container = document.getElementById("mapViewer");
if (container) {
  const root = createRoot(container);
  root.render(<Demo />);
}
