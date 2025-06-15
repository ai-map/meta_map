# Meta Map Vite Demo

这是一个使用 Vite 构建的 Meta Map 演示项目，展示如何在 Vite 环境中使用 `@ai-map/meta_map` 包。

## 功能特性

- 🗺️ 使用 Meta Map 组件显示地图
- 📍 支持地点聚类功能
- 🎯 加载新华宠友地图数据
- ⚡ 基于 Vite 的快速开发体验
- 📱 响应式设计

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

4. 预览生产版本：
```bash
npm run preview
```

## 项目结构

```
packages/meta_map_vite_demo/
├── src/
│   ├── App.jsx          # 主应用组件
│   ├── main.jsx         # React 入口文件
│   └── index.css        # 基础样式
├── index.html           # HTML 模板
├── vite.config.js       # Vite 配置
└── package.json         # 项目依赖
```

## 依赖说明

- `@ai-map/meta_map`: 本地文件引用（`file:../meta_map`）
- `react`: React 框架
- `leaflet`: 地图库依赖

## 开发说明

该项目直接引用本地的 `@ai-map/meta_map` 包，确保在运行前已经构建了该包：

```bash
cd ../meta_map
npm run build
``` 