# MapViewer - React地图查看器组件

基于微信小程序 meta map viewer 转换而来的 TypeScript + React 地图查看器组件。

## 功能特性

- 🗺️ **地图显示** - 基于 Leaflet 的交互式地图
- 📍 **点位标记** - 支持自定义标记和聚类显示
- 🔍 **智能筛选** - 支持 Inclusive/Exclusive 双模式筛选
- 📋 **列表视图** - 地图/列表双视图切换
- 📄 **详情面板** - 点位详细信息展示
- 🧭 **导航功能** - 集成地图导航
- 📱 **响应式设计** - 适配移动端和桌面端

## 安装

```bash
npm install @ai-map/map-viewer
```

## 使用方法

### 基础用法

### 从JSON文件加载

```tsx
import React, { useState, useEffect } from 'react';
import { MapViewer, MetaMap, validateStandardMapData } from '@ai-map/map-viewer';

function MapFromJSON() {
  const [mapData, setMapData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/path/to/map-data.json')
      .then(res => res.json())
      .then(data => {
        // 验证数据格式
        const validation = validateStandardMapData(data);
        if (!validation.valid) {
          throw new Error(validation.errors?.join(', '));
        }
        
        // 创建MetaMap实例进行数据管理
        const metaMap = new MetaMap(data);
        setMapData(metaMap.exportCompatibleData());
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div>错误: {error}</div>;
  if (!mapData) return <div>加载中...</div>;

  return <MapViewer mapData={mapData} />;
}
```

### 高级配置

```tsx
import { MapViewer, ClusterAlgorithmType } from '@ai-map/map-viewer';

<MapViewer
  mapData={mapData}
  className="custom-map"
  defaultView="list"
  enableClustering={true}
  clusterAlgorithm={ClusterAlgorithmType.DISTANCE}
  minClusterSize={3}
  clusterDistance={100}
  showControls={true}
  enableNavigation={true}
  onPointSelect={(point) => console.log(point)}
  onMapReady={() => console.log('地图已准备就绪')}
/>
```

### 筛选器配置

```tsx
const mapData: StandardMapData = {
  name: "餐厅地图",
  center: { lat: 30.274083, lng: 120.15507 },
  filter: {
    inclusive: {
      "菜系": ["中餐", "西餐", "日料"],
      "价格": ["经济", "中档", "高档"]
    },
    exclusive: {
      "营业状态": ["营业中", "已打烊", "暂停营业"]
    }
  },
  data: [
    {
      name: "川菜馆",
      address: "某某街道123号",
      intro: "正宗川菜馆",
      center: { lat: 30.2740, lng: 120.1551 },
      tags: ["中餐", "经济", "营业中"]
    }
  ]
};
```

### 数据管理和验证

```tsx
import { MetaMap, validateStandardMapData, metaMapUtils } from '@ai-map/map-viewer';

// 创建空地图
const emptyMap = metaMapUtils.createEmptyMapData(
  "新地图", 
  { lat: 30.274083, lng: 120.15507 }
);

// 创建MetaMap实例
const metaMap = new MetaMap(emptyMap);

// 添加数据点
metaMap.addDataPoint({
  name: "新景点",
  address: "详细地址",
  intro: "景点介绍",
  center: { lat: 30.275, lng: 120.156 },
  tags: ["景点"]
});

// 获取统计信息
const stats = metaMap.getStatistics();
console.log(`总共 ${stats.totalPoints} 个点位`);

// 搜索附近的点位
const nearbyPoints = metaMap.findNearbyPoints(
  { lat: 30.274, lng: 120.155 }, 
  5 // 5公里范围内
);
```

## API 文档

### MapViewer Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| mapData | MapData | - | 地图数据 |
| className | string | '' | 自定义样式类 |
| style | object | {} | 内联样式 |
| onPointSelect | (point: MapPoint \| null) => void | - | 点位选择回调 |
| onMapReady | () => void | - | 地图准备就绪回调 |
| clusterAlgorithm | ClusterAlgorithmType | DISTANCE | 聚类算法 |
| enableClustering | boolean | true | 是否启用聚类 |
| minClusterSize | number | 2 | 最小聚类大小 |
| clusterDistance | number | 80 | 聚类距离（米） |
| defaultView | 'map' \| 'list' | 'map' | 默认视图 |
| showControls | boolean | true | 显示地图控制按钮 |
| enableNavigation | boolean | true | 启用导航功能 |

### StandardMapData 类型 (推荐)

```typescript
interface StandardMapData {
  id?: string;
  name: string;
  description?: string;
  origin?: string;
  center: Coordinate;
  zoom?: [number, number, number]; // [默认, 最小, 最大]
  filter?: Filter;
  data: DataPoint[];
}
```

### DataPoint 类型

```typescript
interface DataPoint {
  name: string;          // 地点名称 (必需)
  address: string;       // 详细地址 (必需)
  phone?: string;        // 联系电话
  webName?: string;      // 网页标题
  webLink?: string;      // 相关链接
  intro: string;         // 简介描述 (必需)
  tags?: string[];       // 标签列表
  center: Coordinate;    // 坐标位置 (必需)
}
```

### MapData 类型 (兼容格式)

```typescript
interface MapData extends Omit<StandardMapData, 'data' | 'zoom'> {
  _id?: string;          // 兼容字段
  fileID?: string;       // 兼容字段
  zoom?: number[] | [number, number, number];
  tags?: string[];       // 兼容字段
  points?: MapPoint[];   // 兼容微信小程序格式
  polyline?: any[];      // 兼容字段
  data?: DataPoint[] | MapPoint[];
  filter?: Filter;
}
```

### Filter 类型

```typescript
interface Filter {
  inclusive: FilterGroup;  // 包含筛选（默认全选，至少选一个）
  exclusive: FilterGroup;  // 排除筛选（默认全不选，至多选一个）
}

interface FilterGroup {
  [key: string]: string[];
}
```

## 聚类算法

### ClusterAlgorithmType

- `DISTANCE` - 距离聚类算法
- `DENSITY` - 密度聚类算法（待实现）
- `HIERARCHICAL` - 层次聚类算法（待实现）
- `NONE` - 不使用聚类

## 自定义样式

组件支持通过 CSS 变量进行样式自定义：

```css
.custom-map {
  --primary-color: #07c160;
  --primary-bg: #e0f2e9;
  --secondary-color: #ff9800;
  --secondary-bg: #fff4e5;
}
```

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 清理
npm run clean
```

## 许可证

MIT

## 更新日志

### v1.0.0

- 初始版本发布
- 基础地图显示功能
- 点位标记和聚类
- 筛选器功能
- 地图/列表双视图
- 点位详情展示
