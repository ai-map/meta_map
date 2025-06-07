# MapViewer 重新实现说明

## 概述

本次重新实现了 `MapViewer.tsx` 组件，严格按照微信小程序版本 (`map_v2.wxml`) 的布局和功能进行开发，确保页面展示效果一致。

## 主要改动

### 1. 布局结构

完全重新实现了组件的布局结构，按照微信小程序版本分为三个主要区域：

- **第一个区域 (10vh)**: 顶部信息栏和筛选器
  - 地图标题居中显示
  - 可展开/折叠的筛选器面板
  - 遮罩层支持（点击外部区域折叠筛选器）

- **第二个区域 (45vh)**: 地图和列表双Tab
  - Tab切换（地图/列表视图）
  - 腾讯地图API集成（占位符）
  - 地图控制按钮（重置、缩放）
  - 点位列表（支持聚合列表）

- **第三个区域 (35vh)**: 点位详情
  - 详细信息展示
  - 导航功能
  - 文本复制功能

### 2. 功能实现

#### 筛选器系统
- **Inclusive筛选器**: 默认全选，至少选择一个
- **Exclusive筛选器**: 默认全不选，至多选择一个
- 动态筛选器生成（基于数据点的tags）
- 筛选器重置功能

#### 地图功能
- 腾讯地图API密钥配置：`T3ABZ-2VOLB-ZVTU2-NYO2E-C7K2O-RKBQJ`
- 地图标记样式配置
- 缩放控制（3-18级）
- 地图重置功能
- 点位选择与高亮

#### 数据管理
- 支持JSON Schema格式的数据输入
- 自动数据格式转换和验证
- 点位索引自动分配
- 筛选结果实时更新

### 3. 样式设计

完全重新设计了CSS样式，确保与微信小程序版本视觉效果一致：

- **色彩方案**: 使用与小程序一致的配色
- **布局比例**: 严格按照10vh:45vh:35vh的高度分配
- **交互效果**: 悬停、选中、展开等状态
- **响应式设计**: 支持移动端和桌面端

### 4. 腾讯地图集成

#### API配置
```typescript
const TENCENT_MAP_API_KEY = "T3ABZ-2VOLB-ZVTU2-NYO2E-C7K2O-RKBQJ";
```

#### 标记样式
```typescript
const markerStyles = {
  default: {
    width: 20,
    height: 30,
    anchor: { x: 10, y: 30 },
    src: "https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png",
  },
  selected: {
    width: 25,
    height: 37,
    anchor: { x: 12, y: 37 },
    src: "https://mapapi.qq.com/web/lbs/javascriptGL/demo/img/markerDefault.png",
  },
};
```

#### 地图组件集成（需要安装依赖）
```jsx
// 取消注释以下代码使用腾讯地图
import { MultiMarker, BaseMap } from "tlbs-map-react";

<BaseMap
  ref={mapRef}
  apiKey={TENCENT_MAP_API_KEY}
  options={{
    center: mapCenter,
    viewMode: "2D",
    zoom: mapZoom,
    minZoom: minScale,
    maxZoom: maxScale,
    baseMap: {
      type: "vector",
      features: ["base", "label", "point"],
    },
  }}
  control={{
    zoom: {
      position: "topRight",
      className: "tmap-zoom-control-box",
      numVisible: true,
    },
  }}
  onMapInited={onMapInited}
>
  <MultiMarker
    ref={markerRef}
    styles={markerStyles}
    geometries={tencentMarkers}
    onClick={markerTap}
  />
</BaseMap>
```

## 数据格式

### 输入数据格式 (JSON Schema)
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

interface DataPoint {
  name: string;
  address: string;
  phone?: string;
  webName?: string;
  webLink?: string;
  intro: string;
  tags?: string[];
  center: Coordinate;
}
```

### 筛选器格式
```typescript
interface Filter {
  inclusive: Record<string, Record<string, boolean>>;
  exclusive: Record<string, Record<string, boolean>>;
}
```

## 使用示例

```jsx
import MapViewer from './components/MapViewer';
import { StandardMapData } from './types';

const mapData: StandardMapData = {
  name: "示例地图",
  center: { lat: 39.9042, lng: 116.4074 },
  zoom: [10, 3, 18],
  data: [/* 数据点列表 */]
};

<MapViewer
  mapData={mapData}
  onPointSelect={handlePointSelect}
  onMapReady={handleMapReady}
  defaultView="map"
  showControls={true}
  enableNavigation={true}
/>
```

## 技术栈

- **React 18** - 前端框架
- **TypeScript** - 类型安全
- **CSS3** - 样式和动画
- **腾讯地图API** - 地图服务
- **JSON Schema** - 数据验证

## 兼容性

- 完全兼容原有的MapViewer接口
- 支持legacy数据格式的自动转换
- 向后兼容已有的功能和API

## 状态更新

✅ **已完成**：
1. 安装腾讯地图依赖：`npm install tlbs-map-react`
2. 已取消注释地图组件代码，激活腾讯地图功能
3. 已配置地图API密钥：`T3ABZ-2VOLB-ZVTU2-NYO2E-C7K2O-RKBQJ`
4. 地图组件已集成并可正常使用

## 地图功能

现在可以使用以下地图功能：
- ✅ 腾讯地图显示
- ✅ 地图标记点
- ✅ 标记点击事件
- ✅ 地图缩放控制
- ✅ 地图重置功能
- ✅ 点位高亮选择

## 注意事项

- 筛选器标签分类逻辑可根据实际需求调整
- 导航功能默认使用高德地图，可根据需要修改为腾讯地图导航
- 响应式设计已考虑移动端适配
- 地图API密钥为演示用途，生产环境请使用自己的密钥 