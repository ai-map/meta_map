# @ai-map/meta_map 依赖项配置说明

## 包依赖项结构

### Dependencies (打包依赖)
这些依赖项会被打包到最终的包中：
- `@types/leaflet`: "^1.9.8" - Leaflet 类型定义
- `leaflet`: "^1.9.4" - Leaflet 地图库
- `leaflet.markercluster`: "^1.5.3" - Leaflet 聚类插件

### PeerDependencies (对等依赖)
这些依赖项需要使用者自己安装：
- `react`: ">=16.8.0" - React 库
- `react-dom`: ">=16.8.0" - React DOM
- `leaflet`: "^1.9.4" - Leaflet 地图库
- `react-leaflet`: "^4.2.1" - React Leaflet 组件
- `tlbs-map-react`: "^1.1.0" - 腾讯地图 React 组件

## Demo 项目中如何避免手动安装

### 方法 1: 使用 peerDependencies (推荐)
当包配置了 `peerDependencies` 后，使用该包的项目需要自己安装这些依赖项。这是 npm 包的标准做法。

```json
{
  "dependencies": {
    "@ai-map/meta_map": "file:../",
    "leaflet": "^1.9.4",
    "leaflet.markercluster": "^1.5.3", 
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "tlbs-map-react": "^1.1.0"
  }
}
```

### 方法 2: 自动安装脚本
可以创建一个脚本来自动安装所需的依赖项：

```bash
npm install leaflet leaflet.markercluster react react-dom react-leaflet tlbs-map-react
```

### 方法 3: 依赖项同步工具
使用工具如 `syncpack` 来同步包和 demo 之间的依赖项版本。

## 当前配置的优势

1. **避免重复依赖**: React 相关的包不会被重复打包
2. **版本灵活性**: 使用者可以选择兼容的版本
3. **包体积更小**: 最终的包体积更小
4. **避免版本冲突**: 减少不同版本之间的冲突

## 本地开发设置

当使用 `"file:../"` 引用本地包时：

1. Demo 项目需要安装所有 peerDependencies
2. 使用 Vite 的 `optimizeDeps.include` 强制预构建本地包
3. 确保本地包和 demo 使用相同版本的依赖项

```javascript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['@ai-map/meta_map']
  }
});
```

## 故障排除

如果遇到模块解析错误：
1. 确保 demo 安装了所有 peerDependencies
2. 清理 node_modules 并重新安装
3. 重新构建本地包
4. 检查版本兼容性 