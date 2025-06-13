const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 启动 Meta Map 联调热更新环境...\n');

// 项目路径
const projectRoot = path.resolve(__dirname, '..');
const libraryRoot = path.resolve(__dirname, '../..');

console.log('📂 项目路径:');
console.log(`   演示项目: ${projectRoot}`);
console.log(`   库项目:   ${libraryRoot}\n`);

// 检查库项目是否存在
if (!fs.existsSync(path.join(libraryRoot, 'package.json'))) {
  console.error('❌ 未找到库项目的 package.json 文件');
  process.exit(1);
}

// 启动库的构建监听
console.log('🔧 启动库构建监听...');
const libBuild = spawn('npm', ['run', 'dev'], {
  cwd: libraryRoot,
  stdio: 'pipe',
  shell: true
});

libBuild.stdout.on('data', (data) => {
  console.log(`[库构建] ${data.toString().trim()}`);
});

libBuild.stderr.on('data', (data) => {
  console.log(`[库构建] ${data.toString().trim()}`);
});

// 等待一些时间让库构建开始
setTimeout(() => {
  console.log('\n🌐 启动演示应用...');
  
  // 启动演示应用
  const demoApp = spawn('npm', ['start'], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });

  // 监听中断信号
  process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭开发服务器...');
    libBuild.kill();
    demoApp.kill();
    process.exit(0);
  });

  demoApp.on('close', (code) => {
    console.log(`演示应用退出，代码: ${code}`);
    libBuild.kill();
  });

}, 2000);

libBuild.on('close', (code) => {
  console.log(`库构建进程退出，代码: ${code}`);
}); 