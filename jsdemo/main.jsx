import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

// 从主包导入组件和必要的工具
import { MapViewer, validateMetaMapData } from "@ai-map/meta_map";

// 加载示例数据
async function loadMapData() {
  try {
    const response = await fetch("./xinhua_pet.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // 验证数据格式
    const validation = validateMetaMapData(data);
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
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#666"
      }}>
        <div>
          <div style={{ fontSize: "48px", marginBottom: "16px", textAlign: "center" }}>🗺️</div>
          <div>正在加载地图数据...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#d32f2f"
      }}>
        <div>
          <div style={{ fontSize: "48px", marginBottom: "16px", textAlign: "center" }}>⚠️</div>
          <div><strong>加载失败</strong></div>
          <div style={{ fontSize: "14px", marginTop: "8px" }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
        color: "#d32f2f"
      }}>
        <div>
          <div style={{ fontSize: "48px", marginBottom: "16px", textAlign: "center" }}>❌</div>
          <div>地图数据不可用</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh" }}>
      <MapViewer mapData={mapData} />
    </div>
  );
};

// 渲染应用
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Demo />);

// 在开发环境下暴露到全局变量以便调试
if (typeof window !== "undefined" && import.meta.env.DEV) {
  window.meta_map_demo = {
    validateMetaMapData
  };
} 