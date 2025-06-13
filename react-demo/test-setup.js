const fs = require('fs');
const path = require('path');

console.log('🔍 检查 Meta Map 联调环境配置...\n');

// 检查主库
const libraryPath = path.resolve(__dirname, '..');
const libraryPackage = path.join(libraryPath, 'package.json');

console.log('📦 检查主库:');
if (fs.existsSync(libraryPackage)) {
  const pkg = JSON.parse(fs.readFileSync(libraryPackage, 'utf8'));
  console.log(`   ✅ 主库存在: ${pkg.name}@${pkg.version}`);
  
  // 检查 dist 目录
  const distPath = path.join(libraryPath, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('   ✅ dist 目录存在');
    
    // 检查主要文件
    const indexFile = path.join(distPath, 'index.js');
    if (fs.existsSync(indexFile)) {
      console.log('   ✅ index.js 存在');
    } else {
      console.log('   ❌ index.js 不存在，请运行 npm run build');
    }
  } else {
    console.log('   ❌ dist 目录不存在，请运行 npm run build');
  }
} else {
  console.log('   ❌ 主库 package.json 不存在');
}

console.log('\n🔗 检查 npm link 状态:');
try {
  const nodeModulesPath = path.join(__dirname, 'node_modules', '@ai-map', 'meta_map');
  if (fs.existsSync(nodeModulesPath)) {
    const stats = fs.lstatSync(nodeModulesPath);
    if (stats.isSymbolicLink()) {
      const linkTarget = fs.readlinkSync(nodeModulesPath);
      console.log(`   ✅ npm link 已建立: ${linkTarget}`);
    } else {
      console.log('   ❌ 不是符号链接，请运行 npm link @ai-map/meta_map');
    }
  } else {
    console.log('   ❌ 链接不存在，请运行 npm link @ai-map/meta_map');
  }
} catch (error) {
  console.log(`   ❌ 检查链接时出错: ${error.message}`);
}

console.log('\n📋 环境信息:');
console.log(`   Node.js: ${process.version}`);
console.log(`   平台: ${process.platform}`);
console.log(`   架构: ${process.arch}`);

console.log('\n🚀 建议的启动步骤:');
console.log('   1. cd .. && npm run build  # 构建主库');
console.log('   2. npm link                # 建立全局链接');
console.log('   3. cd react-demo           # 回到演示项目');
console.log('   4. npm link @ai-map/meta_map  # 链接到库');
console.log('   5. npm run dev:windows     # 启动联调环境');

console.log('\n✅ 检查完成！'); 