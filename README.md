# @ai-map/meta_map

基于腾讯地图的 React 地图组件库，支持多种聚类算法和数据可视化。

## 🚀 快速开始

### 安装

```bash
npm install @ai-map/meta_map: path_to_meta_map
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
  return <MapViewer mapData={mapData} />;
}
```

## 🔧 开发

```
meta_map/
├── version.json              # 统一版本配置文件
├── package.json              # 根目录配置（单体仓库管理）
├── scripts/
│   └── sync-version.js       # 版本同步脚本
├── packages/
│   ├── meta_map/             # 主包
│   ├── meta_map_react_demo/  # React Demo
│   └── meta_map_vite_demo/   # Vite Demo
└── python/
    └── __init__.py          # Python 包版本
```

### 版本管理
```bash
npm run version:check
npm run version:set 0.5.0
npm run version:sync
# 更新 package-lock.json

git add .
git commit -m "Release v0.5.0"
git tag v0.5.0
```
