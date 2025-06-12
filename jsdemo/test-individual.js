// 测试从工具专用导出导入 validator 函数
try {
  console.log('尝试从工具导出导入 validator...');
  const metaMapPackage = require('@ai-map/meta_map/utils');
  console.log('包导入成功，可用的导出:', Object.keys(metaMapPackage));
  
  const { validateStandardMapData } = metaMapPackage;
  console.log('validateStandardMapData 导入成功:', typeof validateStandardMapData);
  
  if (validateStandardMapData) {
    // 测试函数
    const testResult = validateStandardMapData({
      name: 'test',
      center: { lat: 0, lng: 0 },
      data: []
    });
    console.log('测试结果:', testResult);
  }
} catch (error) {
  console.error('导入失败:', error.message);
  console.error('错误堆栈:', error.stack);
} 