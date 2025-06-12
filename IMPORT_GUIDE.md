# Meta Map 导入指南

本指南展示了如何从 Meta Map 包中导入各种组件和工具，避免从内部路径导入。

## 主要导入方式

### 两种导入路径的区别

Meta Map 提供了两种主要的导入路径：

1. **主包导入 (`@ai-map/meta_map`)**：包含所有组件和工具，适用于 React 应用
2. **工具专用导出 (`@ai-map/meta_map/utils`)**：只包含工具函数和类型，适用于 Node.js 环境

#### 何时使用哪种导入？

- **React 应用**：使用 `@ai-map/meta_map` 导入组件和需要的工具
- **Node.js 脚本**：使用 `@ai-map/meta_map/utils` 只导入工具函数，避免 React 依赖
- **构建工具/服务器端**：使用 `@ai-map/meta_map/utils` 进行数据验证等操作

### 组件导入

```javascript
// 推荐：从主包导入
import { MapViewer } from '@ai-map/meta_map';
// 或默认导入
import MapViewer from '@ai-map/meta_map';

// 不推荐：从内部路径导入
// import { MapViewer } from '@ai-map/meta_map/dist/components/MapViewer';
```

### 类型导入

```typescript
// 推荐：从主包导入所有类型
import type { 
  MapViewerProps, 
  MapData, 
  StandardMapData, 
  DataPoint, 
  ClusterOptions 
} from '@ai-map/meta_map';

// 枚举类型导入
import { ClusterAlgorithmType, CoordinateSystem } from '@ai-map/meta_map';

// 不推荐：从内部路径导入
// import type { MapData } from '@ai-map/meta_map/dist/types';
```

### 工具导入

```javascript
// 推荐：从工具专用导出导入（适用于 Node.js 环境）
import { 
  validateStandardMapData,
  validateMapData,
  MetaMap,
  metaMapUtils,
  createClusterManager,
  ClusterAlgorithmType
} from '@ai-map/meta_map/utils';

// 或者从主包导入（适用于 React 应用）
import { 
  validateStandardMapData,
  ClusterAlgorithmType 
} from '@ai-map/meta_map';

// 不推荐：从内部路径导入
// import { validateStandardMapData } from '@ai-map/meta_map/dist/utils/validator';
// import { MetaMap } from '@ai-map/meta_map/dist/utils/metaMap';
```

## 完整导入示例

```typescript
// 一次性导入所有需要的内容
import MapViewer, { 
  // 类型
  type MapData,
  type MapViewerProps,
  type ClusterOptions,
  
  // 枚举
  ClusterAlgorithmType,
  CoordinateSystem,
  
  // 工具
  validateStandardMapData,
  createClusterManager,
  MetaMap
} from '@ai-map/meta_map';

// 使用示例
const Demo = () => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  
  const clusterOptions: ClusterOptions = {
    algorithm: ClusterAlgorithmType.DISTANCE,
    distance: 80,
    minClusterSize: 2
  };
  
  // 验证数据
  const validation = validateStandardMapData(data);
  
  return (
    <MapViewer
      data={mapData}
      clusterOptions={clusterOptions}
    />
  );
};
```

## 可用的导出

### 组件
- `MapViewer` - 主地图查看器组件

### 类型
- `MapViewerProps` - MapViewer 组件属性
- `MapData`, `StandardMapData` - 地图数据类型
- `DataPoint`, `MapPoint` - 数据点类型
- `Coordinate` - 坐标类型
- `Filter`, `FilterGroup`, `FilterState`, `FilterCriteria` - 过滤器类型
- `ClusterPoint`, `ClusterOptions`, `Cluster`, `ClusterItem` - 聚类相关类型
- `ValidationResult`, `MapStatistics` - 验证和统计类型

### 枚举
- `ClusterAlgorithmType` - 聚类算法类型
- `CoordinateSystem` - 坐标系统类型

### 工具函数
- `validateMapData`, `validateStandardMapData`, `validateNewDataPoint` - 数据验证
- `MetaMap`, `metaMapUtils` - 地图工具
- `createClusterManager`, `ClusterManager`, `DistanceClusterManager` - 聚类管理器

## 迁移指南

如果你正在从旧的内部路径导入迁移，请按以下方式更新：

```javascript
// 旧方式（不推荐）
import { validateStandardMapData } from '@ai-map/meta_map/dist/utils/validator';
import { ClusterAlgorithmType } from '@ai-map/meta_map/dist/types';

// 新方式 - React 应用
import { validateStandardMapData, ClusterAlgorithmType } from '@ai-map/meta_map';

// 新方式 - Node.js 环境
import { validateStandardMapData, ClusterAlgorithmType } from '@ai-map/meta_map/utils';
```

这样可以：
- 简化导入语句
- 避免内部路径依赖
- 提高代码的可维护性
- 减少构建包大小 