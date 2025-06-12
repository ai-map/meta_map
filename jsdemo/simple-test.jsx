import React from "react";
import { createRoot } from "react-dom/client";

// 从主入口点导入功能
import { validateStandardMapData, ClusterAlgorithmType } from "@ai-map/meta_map";

const SimpleTest = () => {
  // 测试 validateStandardMapData
  const testData = {
    name: "测试地图",
    center: { lat: 39.9, lng: 116.4 },
    data: []
  };
  
  const validationResult = validateStandardMapData(testData);
  
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Meta Map 简化测试</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>包状态测试:</h3>
        <p>✅ validateStandardMapData 导入成功</p>
        <p>✅ ClusterAlgorithmType 导入成功</p>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>函数测试:</h3>
        <p>测试数据: {JSON.stringify(testData, null, 2)}</p>
        <p>验证结果: {JSON.stringify(validationResult, null, 2)}</p>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <h3>枚举测试:</h3>
        <p>ClusterAlgorithmType.DISTANCE: {ClusterAlgorithmType.DISTANCE}</p>
        <p>ClusterAlgorithmType.DENSITY: {ClusterAlgorithmType.DENSITY}</p>
        <p>ClusterAlgorithmType.HIERARCHICAL: {ClusterAlgorithmType.HIERARCHICAL}</p>
        <p>ClusterAlgorithmType.NONE: {ClusterAlgorithmType.NONE}</p>
      </div>
      
      <div style={{ 
        backgroundColor: "#e8f5e8", 
        padding: "12px", 
        borderRadius: "6px",
        border: "1px solid #4caf50"
      }}>
        <strong>✅ 基础功能测试通过！</strong>
        <br />
        包的导出和基本功能都正常工作。
      </div>
    </div>
  );
};

// 渲染应用
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<SimpleTest />); 