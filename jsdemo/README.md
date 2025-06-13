# Meta Map 演示

这是一个 JavaScript/React 版本的 Meta Map 组件演示项目，展示了如何在 React 应用中使用 `@ai-map/meta_map` 组件的完整功能。

## 功能特点

- 🗺️ **完整展示**：展示 MapViewer 组件的所有核心功能
- 📊 **数据加载**：自动加载和验证地图数据
- 🎛️ **实时控制**：动态调整聚类算法和参数
- 🎯 **即开即用**：包含完整的控制面板和交互功能
- 🎨 **现代设计**：使用 Font Awesome 图标和现代 UI 设计

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3007 查看演示

### 3. 构建生产版本

```bash
npm run build
```

## 项目结构

```
jsdemo/
├── main.jsx          # 主应用组件
├── index.html        # HTML 模板
├── xinhua_pet.json   # 示例地图数据
├── package.json      # 项目配置
└── vite.config.js    # Vite 配置
```

## 使用说明

### 导入组件

```javascript
import { MapViewer, validateMetaMapData, ClusterAlgorithmType } from "@ai-map/meta_map";
```

### 基本用法

```javascript
const Demo = () => {
  const [mapData, setMapData] = useState(null);
  const [clusterAlgorithm, setClusterAlgorithm] = useState(ClusterAlgorithmType.HIERARCHICAL);
  const mapViewerRef = useRef(null);

  // 加载数据
  useEffect(() => {
    loadMapData().then(setMapData);
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <MapViewer 
        ref={mapViewerRef}
        mapData={mapData} 
        clusterAlgorithm={clusterAlgorithm}
        minClusterSize={2}
        clusterDistance={100}
        defaultView="map"
      />
    </div>
  );
};
```

### 聚类算法选项

- **NONE** - 无聚类，显示所有原始点位
- **BASIC** - 基础聚类，简单的地理位置聚合
- **DISTANCE** - 基于距离的聚类算法
- **DENSITY** - 基于密度的 DBSCAN 聚类算法
- **HIERARCHICAL** - 分层聚类算法（推荐）

### 控制面板功能

演示项目包含完整的控制面板，可以：
- 切换不同的聚类算法
- 调整最小聚类大小（2-20）
- 设置聚类距离阈值（50-1000米）
- 重置地图到初始状态

## 数据格式

地图数据应符合标准格式：

```javascript
{
  "name": "地图名称",
  "center": { "lat": 39.9042, "lng": 116.4074 },
  "zoom": [10, 15],  // [初始缩放, 最大缩放]
  "data": [
    {
      "id": "1",
      "name": "点位名称",
      "center": { "lat": 39.9042, "lng": 116.4074 },
      "address": "详细地址",
      "phone": "联系电话",
      "webName": "网站链接",
      "intro": "详细介绍",
      "tags": ["标签1", "标签2"]  // 用于筛选
    }
  ],
  "filter": {  // 可选：筛选器配置
    "inclusive": {
      "类型": ["标签1", "标签2"]
    },
    "exclusive": {
      "状态": ["标签3", "标签4"]
    }
  }
}
```

### 新增功能

- **筛选器支持**：支持包含和排除两种筛选模式
- **详细信息**：支持地址、电话、网站等详细信息
- **标签系统**：支持多标签分类和筛选
- **响应式设计**：自适应移动设备

## 技术栈

- **React 18** - UI 框架
- **Vite** - 构建工具
- **@ai-map/meta_map** - 地图组件库
- **腾讯地图 API** - 地图服务
- **Font Awesome** - 图标库

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发

本项目使用本地包引用方式开发，确保 Meta Map 主包构建后再启动本演示。

### 开发说明

1. 确保主包已构建：`npm run build`（在根目录）
2. 安装依赖：`npm install`（在 jsdemo 目录）
3. 启动开发服务器：`npm run dev`

### 环境要求

- Node.js 16+
- npm 8+

## 许可证

MIT License 