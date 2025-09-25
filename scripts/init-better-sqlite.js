#!/usr/bin/env node

/**
 * Better SQLite数据库初始化脚本
 * 运行: node scripts/init-better-sqlite.js
 */

async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化Better SQLite数据库...');

    // 动态导入ES模块
    const { stockDatabase } = await import('../src/lib/database.js');

    await stockDatabase.connect();
    console.log('✅ 数据库初始化成功!');

    // 清理旧的过期缓存
    await stockDatabase.cleanupExpiredCache();
    console.log('✅ 清理完成');

    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initializeDatabase();
