# Meta Map 演示

这是一个简洁的 Meta Map 组件演示项目，展示了如何在 React 应用中使用 `@ai-map/meta_map` 组件。

## 功能特点

- 🗺️ **简洁展示**：专注于 MapViewer 组件的核心功能
- 📊 **数据加载**：自动加载和验证地图数据
- 🎯 **即开即用**：无复杂配置，直接展示地图效果

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
import MapViewer, { validateStandardMapData } from "@ai-map/meta_map";
```

### 基本用法

```javascript
const Demo = () => {
  const [mapData, setMapData] = useState(null);

  // 加载数据
  useEffect(() => {
    loadMapData().then(setMapData);
  }, []);

  return (
    <div style={{ height: "100vh" }}>
      <MapViewer data={mapData} />
    </div>
  );
};
```

## 数据格式

地图数据应符合标准格式：

```javascript
{
  "name": "地图名称",
  "center": { "lat": 39.9042, "lng": 116.4074 },
  "data": [
    {
      "id": "1",
      "name": "点位名称",
      "coordinate": { "lat": 39.9042, "lng": 116.4074 },
      "category": "分类",
      "description": "描述信息"
    }
  ]
}
```

## 技术栈

- **React 18** - UI 框架
- **Vite** - 构建工具
- **@ai-map/meta_map** - 地图组件库

## 浏览器支持

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 开发

本项目使用本地包引用方式开发，确保 Meta Map 主包构建后再启动本演示。 