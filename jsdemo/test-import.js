// 测试包导入
try {
  const pkg = require('@ai-map/meta_map');
  console.log('包导入成功!');
  console.log('可用的导出:', Object.keys(pkg));
  console.log('validateStandardMapData 存在:', typeof pkg.validateStandardMapData);
  console.log('MapViewer 存在:', typeof pkg.MapViewer);
  console.log('ClusterAlgorithmType 存在:', typeof pkg.ClusterAlgorithmType);
  
  // 尝试使用 validateStandardMapData
  if (pkg.validateStandardMapData) {
    const testResult = pkg.validateStandardMapData({
      name: 'test',
      center: { lat: 0, lng: 0 },
      data: []
    });
    console.log('validateStandardMapData 测试结果:', testResult);
  }
} catch (error) {
  console.error('包导入失败:', error.message);
  console.error('错误堆栈:', error.stack);
} 