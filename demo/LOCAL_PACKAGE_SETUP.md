# 本地包配置说明

## 📦 当前配置

本 demo 项目已成功配置为使用本地的 `@ai-map/meta_map` 包。

### 包引用配置

**demo/package.json**
```json
{
  "dependencies": {
    "@ai-map/meta_map": "file:../",
    "tlbs-map-react": "^1.1.0",
    // ... 其他依赖
  }
}
```

### Vite 优化配置

**demo/vite.config.ts**
```typescript
export default defineConfig({
  // ...
  optimizeDeps: {
    // 强制预构建本地包
    include: ['@ai-map/meta_map']
  },
  // ...
});
```

## ✅ 验证状态

### 导入测试
- ✅ 默认导入：`import MapViewer from "@ai-map/meta_map"`
- ✅ 命名导入：`import { ClusterAlgorithmType, validateMetaMapData } from "@ai-map/meta_map"`
- ✅ 类型导入：`import { StandardMapData, MapViewerProps } from "@ai-map/meta_map"`

### 功能测试
- ✅ MapViewer 组件正常渲染
- ✅ ClusterAlgorithmType 枚举正确工作
- ✅ 验证器函数正常使用
- ✅ CSS 样式正确加载
- ✅ 类型声明文件可用

## 🔧 主要修复

1. **包结构优化**
   - 修改了 CSS 导入方式，避免 Node.js 环境冲突
   - 使用 CommonJS 格式确保兼容性
   - 正确配置了 exports 字段

2. **依赖管理**
   - 添加了 `tlbs-map-react` 依赖
   - 配置了本地包文件引用

3. **构建配置**
   - 优化了 TypeScript 编译设置
   - 确保所有导出正确生成

## 🚀 使用方式

现在可以在 demo 中正常使用所有 `@ai-map/meta_map` 的功能：

```typescript
import React from 'react';
import MapViewer, { 
  ClusterAlgorithmType, 
  StandardMapData,
  validateMetaMapData 
} from '@ai-map/meta_map';

// 使用示例
const MyComponent: React.FC = () => {
  return (
    <MapViewer 
      mapData={mapData}
      clusterAlgorithm={ClusterAlgorithmType.DISTANCE}
      enableClustering={true}
    />
  );
};
```

## 📝 注意事项

- 每次修改主包后，demo 会自动使用最新版本
- 如果遇到缓存问题，可以删除 `node_modules` 并重新安装
- 开发服务器支持热重载，修改会实时反映

---

**状态**: ✅ 配置完成，测试通过  
**最后更新**: 已还原完整 demo 功能  
**包版本**: 本地开发版本 (@ai-map/meta_map@0.2.1) 