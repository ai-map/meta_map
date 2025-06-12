// 直接导入 validator 模块，绕过主入口
try {
  console.log('尝试导入 validator 模块...');
  const validatorPath = require.resolve('@ai-map/meta_map');
  console.log('包解析路径:', validatorPath);
  
  // 尝试直接 require validator 文件
  const validatorFile = validatorPath.replace('index.js', 'utils/validator.js');
  console.log('Validator 文件路径:', validatorFile);
  
  const validator = require(validatorFile);
  console.log('Validator 模块导入成功!');
  console.log('可用函数:', Object.keys(validator));
  
  if (validator.validateStandardMapData) {
    const testResult = validator.validateStandardMapData({
      name: 'test',
      center: { lat: 0, lng: 0 },
      data: []
    });
    console.log('测试结果:', testResult);
  }
} catch (error) {
  console.error('导入失败:', error.message);
} 