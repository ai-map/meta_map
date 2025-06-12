# @ai-map/meta_map 使用说明

现在您可以通过以下方式使用 @ai-map/meta_map：

## 安装

```bash
npm install @ai-map/meta_map
# 或者
npm install git+https://github.com/ai-map/meta_map.git
```

### 依赖项要求

本包使用 peerDependencies 配置，需要您的项目安装以下依赖项：

```bash
npm install react react-dom leaflet react-leaflet tlbs-map-react leaflet.markercluster
```

或者在您的 `package.json` 中添加这些依赖项：

```json
{
  "dependencies": {
    "@ai-map/meta_map": "latest",
    "leaflet": "^1.9.4",
    "leaflet.markercluster": "^1.5.3", 
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "tlbs-map-react": "^1.1.0"
  }
}
```

> **注意**: 这是 npm 包的标准做法，可以避免重复依赖、减少包体积，并提供版本灵活性。

## 使用方式

### 默认导入 MapViewer 组件

```javascript
import MapViewer from "@ai-map/meta_map";

function App() {
  const mapData = {
    // 您的地图数据
  };

  return <MapViewer mapData={mapData} />;
}
```

### 命名导入其他组件和工具

```javascript
import MapViewer, { 
  FilterPanel, 
  PointsList, 
  PointDetail,
  MetaMap,
  validateMapData
} from "@ai-map/meta_map";

```

### TypeScript 支持

```typescript
import MapViewer, { MapViewerProps, MapData } from "@ai-map/meta_map";

const App: React.FC = () => {
  const mapData: MapData = {
    // 类型安全的地图数据
  };

  return <MapViewer mapData={mapData} />;
};
```

## 本地开发

如果您要从本地源码进行开发，可以使用文件引用：

```json
{
  "dependencies": {
    "@ai-map/meta_map": "file:../path/to/meta_map",
    "leaflet": "^1.9.4",
    "leaflet.markercluster": "^1.5.3", 
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "tlbs-map-react": "^1.1.0"
  }
}
```

确保在您的构建工具（如 Vite）中配置预构建优化：

```javascript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['@ai-map/meta_map']
  }
});
```
