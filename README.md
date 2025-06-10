# @ai-map/meta_map 使用说明

现在您可以通过以下方式使用 @ai-map/meta_map：

## 安装

```bash
npm install @ai-map/meta_map
# 或者
npm install git+https://github.com/ai-map/meta_map.git
```

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
