# Meta Map React 演示项目

## 🎯 项目简介

这是一个基于 React Scripts 的演示项目，专门用于 `@ai-map/meta_map` 库的开发调试和热更新联调。

## 📊 演示数据

- **新华宠友地图** - 63个真实的宠物友好场所数据
- **地点类型** - 吃（餐厅）、喝（咖啡厅/酒吧）、逛（商店/景点）
- **宠物设施** - 饮水盆、拾便袋、尿垫、牵引绳等完善设施
- **覆盖区域** - 上海新华路区域

## 🚀 快速启动

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
# 方式一：直接启动
npm start

# 方式二：Windows 批处理脚本
npm run dev:windows

# 方式三：联调热更新（推荐开发时使用）
npm run dev:link
```

## 🛠️ 开发功能

### 调试面板
- **数据展示** - 展示新华宠友地图（63个地点）
- **聚类算法** - 支持5种聚类算法：无聚类、基础、距离、密度、分层
- **参数调整** - 实时调整聚类大小（2-20）和距离（50-1000px）
- **地图重置** - 一键重置地图状态
- **状态监控** - 显示热更新状态和数据统计

### 热更新机制
1. **库代码变更** - 修改主项目中的 TypeScript 代码
2. **自动构建** - Vite 监听文件变化并重新构建
3. **React 热更新** - React Scripts 检测变化并重新加载

## 📝 可用脚本

```bash
npm start              # 启动开发服务器
npm run dev:link       # 启动联调热更新环境
npm run dev:windows    # Windows 批处理启动脚本
npm run build          # 构建生产版本
npm run setup          # 安装依赖并建立库链接
npm run link:library   # 链接到库
npm run unlink:library # 取消库链接
npm run test:setup     # 检查环境配置
npm run test:data      # 测试数据加载功能
```

## 🔧 配置说明

### 库依赖
项目通过 `file:../` 方式引用库，并通过 npm link 实现热更新：

```json
{
  "dependencies": {
    "@ai-map/meta_map": "file:../"
  }
}
```

### React Scripts 配置
- 禁用 source map 生成以提高构建速度
- 使用 React 18 和 React Scripts 5.0.1
- 支持 TypeScript 和现代 JavaScript 特性

## 🐛 故障排除

### 热更新不工作
1. 检查 npm link 状态：`npm list @ai-map/meta_map`
2. 重新建立链接：`npm run unlink:library && npm run link:library`
3. 重启开发服务器

### 构建错误
1. 清除依赖缓存：`rm -rf node_modules package-lock.json && npm install`
2. 检查主库构建：`cd .. && npm run build`

### React 钩子错误
如果遇到 "Invalid hook call" 错误：
```bash
cd ../node_modules/react && npm link
cd ../../react-demo && npm link react
```

### 数据加载失败
1. 检查 `public/xinhua_pet.json` 文件是否存在
2. 验证 JSON 格式是否正确
3. 点击"重新加载"按钮重试

## 📊 性能监控

项目集成了 Web Vitals 用于性能监控：
- CLS (累积布局偏移)
- FID (首次输入延迟)
- FCP (首次内容绘制)
- LCP (最大内容绘制)
- TTFB (首字节时间)

## 🎯 使用场景

### 开发测试
- 聚类算法效果验证
- 大量数据点性能测试
- 用户交互体验测试

### 功能演示
- 真实场景数据展示
- 宠物友好场所可视化
- 地图组件功能展示

## 💡 开发技巧

1. **开发工作流** - 修改库代码 → 自动构建 → React 热更新 → 浏览器刷新
2. **调试技巧** - 使用 React DevTools、监听调试面板状态变化
3. **性能优化** - 使用 React.memo、合理使用 useCallback 和 useMemo

## �� 许可证

MIT License 