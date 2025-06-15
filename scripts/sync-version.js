#!/usr/bin/env node
/**
 * 版本同步脚本
 * 从 version.json 同步版本号到所有包
 */

const fs = require('fs');
const path = require('path');

// 读取版本配置
function loadVersionConfig() {
  const versionPath = path.join(__dirname, '../version.json');
  
  if (!fs.existsSync(versionPath)) {
    console.error('❌ 找不到 version.json 文件');
    process.exit(1);
  }
  
  try {
    const content = fs.readFileSync(versionPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ 解析 version.json 失败:', error.message);
    process.exit(1);
  }
}

// 更新 package.json 文件
function updatePackageJson(packagePath, newVersion) {
  const filePath = path.join(__dirname, '..', packagePath, 'package.json');
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  找不到文件: ${filePath}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const pkg = JSON.parse(content);
    
    const oldVersion = pkg.version;
    pkg.version = newVersion;
    
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
    
    console.log(`✅ ${filePath}: ${oldVersion} → ${newVersion}`);
    return true;
  } catch (error) {
    console.error(`❌ 更新 ${filePath} 失败:`, error.message);
    return false;
  }
}

// 更新 Python __init__.py 文件
function updatePythonInit(packagePath, newVersion) {
  const filePath = path.join(__dirname, '..', packagePath, '__init__.py');
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  找不到文件: ${filePath}`);
    return false;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 查找并替换版本号
    const versionRegex = /__version__\s*=\s*['"](.*?)['"]/ ;
    const match = content.match(versionRegex);
    
    if (match) {
      const oldVersion = match[1];
      content = content.replace(versionRegex, `__version__ = "${newVersion}"`);
      
      fs.writeFileSync(filePath, content);
      
      console.log(`✅ ${filePath}: ${oldVersion} → ${newVersion}`);
      return true;
    } else {
      console.warn(`⚠️  在 ${filePath} 中找不到版本号定义`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 更新 ${filePath} 失败:`, error.message);
    return false;
  }
}

// 主函数
function main() {
  console.log('🔄 开始同步版本号...\n');
  
  const config = loadVersionConfig();
  const newVersion = config.version;
  
  console.log(`📋 目标版本: ${newVersion}\n`);
  
  let successCount = 0;
  let totalCount = 0;
  
  // 遍历所有包
  for (const [packageName, packageInfo] of Object.entries(config.packages)) {
    console.log(`📦 处理包: ${packageName}`);
    totalCount++;
    
    let success = false;
    
    if (packageInfo.type === 'python') {
      success = updatePythonInit(packageInfo.path, newVersion);
    } else {
      success = updatePackageJson(packageInfo.path, newVersion);
    }
    
    if (success) {
      successCount++;
    }
    
    console.log('');
  }
  
  // 输出结果
  console.log('='.repeat(50));
  console.log(`📊 同步结果: ${successCount}/${totalCount} 成功`);
  
  if (successCount === totalCount) {
    console.log('✅ 所有包版本号同步完成！');
    process.exit(0);
  } else {
    console.log('❌ 部分包同步失败，请检查错误信息');
    process.exit(1);
  }
}

// 执行主函数
if (require.main === module) {
  main();
}

module.exports = {
  loadVersionConfig,
  updatePackageJson,
  updatePythonInit
}; 