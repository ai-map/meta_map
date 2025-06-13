const fs = require('fs');
const path = require('path');

console.log('🧪 测试数据加载功能...\n');

// 检查 xinhua_pet.json 文件
const xinhuaDataPath = path.join(__dirname, 'public', 'xinhua_pet.json');

console.log('📁 检查数据文件:');
if (fs.existsSync(xinhuaDataPath)) {
  console.log('   ✅ xinhua_pet.json 存在');
  
  try {
    const data = JSON.parse(fs.readFileSync(xinhuaDataPath, 'utf8'));
    console.log(`   ✅ JSON 格式正确`);
    console.log(`   📊 数据统计:`);
    console.log(`      - 名称: ${data.name}`);
    console.log(`      - 地点数量: ${data.data?.length || 0}`);
    console.log(`      - 中心坐标: ${data.center?.lat}, ${data.center?.lng}`);
    console.log(`      - 缩放级别: ${data.zoom}`);
    console.log(`      - 过滤器: ${JSON.stringify(data.filter)}`);
    
    // 检查数据结构
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const firstItem = data.data[0];
      console.log(`   📍 第一个地点示例:`);
      console.log(`      - 名称: ${firstItem.name}`);
      console.log(`      - 地址: ${firstItem.address}`);
      console.log(`      - 坐标: ${firstItem.center?.lat}, ${firstItem.center?.lng}`);
      console.log(`      - 标签: ${firstItem.tags?.join(', ')}`);
      
      // 检查是否有 id 字段
      const hasIds = data.data.every(item => item.id);
      if (hasIds) {
        console.log('   ✅ 所有地点都有 id 字段');
      } else {
        console.log('   ⚠️  部分地点缺少 id 字段，将在加载时自动生成');
      }
    }
    
  } catch (error) {
    console.log(`   ❌ JSON 解析失败: ${error.message}`);
  }
} else {
  console.log('   ❌ xinhua_pet.json 不存在');
}

// 检查 App.js 中的数据加载代码
const appJsPath = path.join(__dirname, 'src', 'App.js');
if (fs.existsSync(appJsPath)) {
  const appContent = fs.readFileSync(appJsPath, 'utf8');
  
  console.log('\n🔍 检查 App.js 代码:');
  
  if (appContent.includes('loadXinhuaPetData')) {
    console.log('   ✅ 包含 loadXinhuaPetData 函数');
  } else {
    console.log('   ❌ 缺少 loadXinhuaPetData 函数');
  }
  
  if (appContent.includes('loadXinhuaPetData')) {
    console.log('   ✅ 专注于新华宠友地图数据');
  } else {
    console.log('   ❌ 缺少新华宠友地图数据加载');
  }
  
  if (appContent.includes('/xinhua_pet.json')) {
    console.log('   ✅ 正确引用 xinhua_pet.json 文件');
  } else {
    console.log('   ❌ 未找到对 xinhua_pet.json 的引用');
  }
}

console.log('\n🚀 测试建议:');
console.log('   1. 启动开发服务器: npm start');
console.log('   2. 打开浏览器访问 http://localhost:3000');
console.log('   3. 检查地图是否正确显示新华宠友地点');
console.log('   4. 测试聚类功能是否正常工作');
console.log('   5. 验证调试面板显示正确的数据统计');

console.log('\n✅ 数据加载功能检查完成！'); 