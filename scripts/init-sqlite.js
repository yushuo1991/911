#!/usr/bin/env node

/**
 * SQLite数据库初始化脚本
 * 运行: node scripts/init-sqlite.js
 */

const { stockDatabase } = require('../src/lib/database.ts');

async function initializeDatabase() {
  try {
    console.log('🚀 开始初始化SQLite数据库...');

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
