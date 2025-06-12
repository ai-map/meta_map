# Meta Map Viewer JavaScript Demo

这是一个使用纯 **JavaScript + React** 实现的 `@ai-map/meta_map` 组件演示项目，相对于 TypeScript 版本的 demo，它展示了如何在 JavaScript 项目中使用该组件库。

## 🚀 快速开始

### 安装依赖
```bash
cd jsdemo  # 确保在 jsdemo 目录中
npm install --legacy-peer-deps
```

### 启动开发服务器
```bash
npm run dev
```

开发服务器将在 http://localhost:3007 启动

> **重要**: 确保所有命令都在 `jsdemo` 目录中运行，不要在项目根目录运行。

### 构建生产版本
```bash
npm run build
```

## 📋 主要特性

### ✨ **JavaScript 原生支持**
- 无需 TypeScript 配置
- 纯 JSX 语法
- ES6+ 模块化

### 🎛️ **完整的参数控制**
- 聚类算法切换（距离聚类、密度聚类、层次聚类）
- 实时聚类参数调整
- 视图模式切换（地图/列表）
- 数据统计显示

### 📦 **本地包集成**
- 使用 `"file:../"` 引用本地 `@ai-map/meta_map` 包
- 实时反映包的更新
- 包状态指示器

## 🔧 配置说明

### 依赖项管理
本项目配置了完整的 peerDependencies：

```json
{
  "dependencies": {
    "@ai-map/meta_map": "file:../",
    "leaflet": "^1.9.4",
    "leaflet.markercluster": "^1.5.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-leaflet": "^4.2.1",
    "tlbs-map-react": "^1.1.0"
  }
}
```

### Vite 配置
- 端口: 3007 (避免与 TypeScript demo 的 3006 冲突)
- 本地包预构建优化
- ES 模块支持

## 📁 项目结构

```
jsdemo/
├── index.html          # HTML 入口文件
├── main.jsx           # 主应用组件 (JavaScript)
├── package.json       # 项目配置
├── vite.config.js     # Vite 配置 (JavaScript)
└── README.md         # 项目说明
```

## 🆚 与 TypeScript Demo 的区别

| 特性 | TypeScript Demo | JavaScript Demo |
|------|-----------------|-----------------|
| 语言 | TypeScript (.tsx) | JavaScript (.jsx) |
| 类型检查 | ✅ 编译时类型检查 | ❌ 运行时检查 |
| 开发端口 | 3006 | 3007 |
| 配置文件 | .ts 扩展名 | .js 扩展名 |
| IDE 支持 | 完整类型提示 | 基本语法提示 |
| 构建大小 | 较大（包含类型信息） | 较小 |

## 🎯 使用场景

适用于以下情况：
- 不需要 TypeScript 的项目
- 快速原型开发
- 学习组件用法
- 测试组件兼容性
- JavaScript 生态系统集成

## 📚 API 使用示例

### 基本用法
```javascript
import MapViewer, { ClusterAlgorithmType } from "@ai-map/meta_map";

function App() {
  const [mapData, setMapData] = useState(null);
  const [clusterAlgorithm, setClusterAlgorithm] = useState(ClusterAlgorithmType.DISTANCE);

  return (
    <MapViewer 
      mapData={mapData}
      clusterAlgorithm={clusterAlgorithm}
      enableClustering={true}
      onPointSelect={(point) => console.log(point)}
    />
  );
}
```

### 事件处理
```javascript
// 点位选择事件
const handlePointSelect = (point) => {
  console.log("选中点位:", point);
};

// 地图准备就绪事件
const handleMapReady = () => {
  console.log("地图已准备就绪");
};
```

## 🔍 调试提示

### 常见问题
1. **模块解析错误**: 确保运行了 `npm install --legacy-peer-deps`
2. **端口冲突**: 默认端口 3007，如有冲突可在 vite.config.js 中修改
3. **地图不显示**: 检查网络连接和 API 密钥配置

### 控制台输出
应用会在控制台输出以下信息：
- 地图数据加载状态
- 点位选择事件
- 地图准备就绪状态

## 📈 性能优化

- 使用 Vite 的快速热更新
- 本地包预构建优化
- CSS 模块化支持
- 代码分割和懒加载

---

**注意**: 这是一个演示项目，主要用于展示 `@ai-map/meta_map` 在 JavaScript 环境中的使用方法。 