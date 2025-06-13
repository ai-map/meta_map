# @ai-map/meta_map

基于腾讯地图的 React 地图组件库，支持多种聚类算法和数据可视化。

## 🚀 快速开始

### 安装

```bash
npm install @ai-map/meta_map
# 或者
npm install git+https://github.com/ai-map/meta_map.git
```

### 依赖项

```bash
npm install react react-dom leaflet react-leaflet tlbs-map-react leaflet.markercluster
```

### 基本使用

```javascript
import MapViewer from "@ai-map/meta_map";

function App() {
  const mapData = {
    name: "我的地图",
    center: { lat: 39.9042, lng: 116.4074 },
    zoom: [3, 10, 18],
    data: [
      {
        id: "1",
        name: "地点1",
        center: { lat: 39.9042, lng: 116.4074 },
        address: "北京市",
        tags: ["餐厅"]
      }
    ]
  };

  return <MapViewer mapData={mapData} />;
}
```

## 🛠️ 功能特性

- **多种聚类算法** - 基础、距离、密度、分层聚类
- **数据过滤** - 支持包含/排除过滤器
- **TypeScript 支持** - 完整的类型定义
- **响应式设计** - 适配不同屏幕尺寸
- **腾讯地图集成** - 基于 tlbs-map-react

## 📦 导出组件

```javascript
import MapViewer, {
  FilterPanel,
  PointsList,
  PointDetail,
  MetaMap
} from "@ai-map/meta_map";
```

## 🔧 开发

### 构建

```bash
npm run build    # 构建生产版本
npm run dev      # 开发模式（监听文件变化）
```

### 联调热更新

```bash
npm run demo:setup    # 设置演示环境
npm run demo:react    # 启动联调环境
```

详细开发说明请查看 [react-demo/README.md](./react-demo/README.md)

## �� 许可证

MIT License
