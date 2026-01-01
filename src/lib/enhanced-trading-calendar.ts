// ===== 增强的交易日历管理系统 =====
// 完整实现Tushare trade_cal接口集成，替换所有基于周末判断的简单日期逻辑

import { tushareClient } from './tushare-client';

// v4.8.31新增：中国法定节假日判断（用于Tushare API降级时的兜底逻辑）
const CHINA_HOLIDAYS = new Set([
  // 元旦 (1月1日)
  '01-01',
  // 春节 (农历正月初一至初三，这里列出常见的公历日期范围)
  // 注：春节日期每年不同，这里只列出部分常见日期作为示例
  '01-21', '01-22', '01-23', '01-24', '01-25', '01-26', '01-27', '01-28', '01-29', '01-30',
  '02-01', '02-02', '02-03', '02-04', '02-05', '02-06', '02-07', '02-08', '02-09', '02-10',
  '02-11', '02-12', '02-13', '02-14', '02-15', '02-16', '02-17', '02-18', '02-19', '02-20',
  // 清明节 (4月4-6日左右)
  '04-04', '04-05', '04-06',
  // 劳动节 (5月1-3日)
  '05-01', '05-02', '05-03',
  // 端午节 (农历五月初五，这里列出常见的公历日期)
  '06-10', '06-11', '06-12', '06-13', '06-14', '06-15', '06-16', '06-17', '06-18', '06-19', '06-20',
  // 中秋节 (农历八月十五，这里列出常见的公历日期)
  '09-10', '09-11', '09-12', '09-13', '09-14', '09-15', '09-16', '09-17', '09-18', '09-19', '09-20',
  // 国庆节 (10月1-7日)
  '10-01', '10-02', '10-03', '10-04', '10-05', '10-06', '10-07'
]);

// 判断日期是否可能是节假日（用于降级逻辑）
function isLikelyHoliday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return CHINA_HOLIDAYS.has(monthDay);
}

// 交易日历缓存结构
interface TradingCalendarCache {
  data: Map<string, boolean>;
  timestamp: number;
  expiry: number;
}

// 交易日历管理器
class TradingCalendarManager {
  private cache: TradingCalendarCache | null = null;
  private readonly CACHE_DURATION = 4 * 60 * 60 * 1000; // 4小时缓存

  // 获取交易日历（带智能缓存和错误处理）
  async getTradingCalendar(startDate: string, endDate: string): Promise<Map<string, boolean>> {
    const now = Date.now();

    // 检查缓存是否有效
    if (this.cache && now < this.cache.expiry && this.cache.data.size > 0) {
      console.log(`[交易日历] 使用缓存数据，包含${this.cache.data.size}个日期`);
      return this.cache.data;
    }

    try {
      console.log(`[交易日历] 从Tushare获取交易日历: ${startDate} ~ ${endDate}`);

      // 使用tushareClient获取交易日历
      const calendarItems = await tushareClient.getTradingCalendar(startDate, endDate);

      // 过滤交易日（is_open === 1）
      const tradingDays = calendarItems.filter(item => item.is_open === 1);

      console.log(`[交易日历] 成功获取${tradingDays.length}条交易日历数据`);

      // 构建新缓存
      const calendarData = new Map<string, boolean>();
      tradingDays.forEach(item => {
        calendarData.set(item.cal_date, true); // 只有交易日才被设置
      });

      // 更新缓存
      this.cache = {
        data: calendarData,
        timestamp: now,
        expiry: now + this.CACHE_DURATION
      };

      console.log(`[交易日历] 缓存更新完成，包含${calendarData.size}个交易日`);
      return calendarData;

    } catch (error) {
      console.error(`[交易日历] 获取失败:`, error);

      // 返回空缓存，将降级到周末过滤逻辑
      return new Map();
    }
  }

  // 清除缓存
  clearCache(): void {
    this.cache = null;
    console.log(`[交易日历] 缓存已清除`);
  }

  // 获取缓存统计
  getCacheStats(): { size: number; age: number; valid: boolean } {
    if (!this.cache) {
      return { size: 0, age: 0, valid: false };
    }

    const now = Date.now();
    return {
      size: this.cache.data.size,
      age: Math.floor((now - this.cache.timestamp) / 1000 / 60), // 分钟
      valid: now < this.cache.expiry
    };
  }
}

// 全局交易日历管理器实例
const tradingCalendarManager = new TradingCalendarManager();

// ===== 真实交易日历函数集合 =====

// 1. 获取指定数量的连续交易日（从指定日期开始）
export async function getValidTradingDays(startDate: string, count: number = 5): Promise<string[]> {
  const tradingDays: string[] = [];

  // 计算查询范围（考虑节假日影响，扩大查询范围）
  // v4.30.1修复：扩大到7倍查询范围，确保能获取足够的交易日（特别是跨年、长假期时）
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + Math.max(count * 7, 45)); // 扩大7倍查询范围，最少45天

  const startDateStr = startDate.replace(/-/g, '');
  const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

  console.log(`[真实交易日] 获取${count}个交易日，查询范围: ${startDateStr} ~ ${endDateStr}`);

  try {
    // 获取交易日历
    const calendar = await tradingCalendarManager.getTradingCalendar(startDateStr, endDateStr);
    console.log(`[真实交易日] 交易日历包含${calendar.size}个交易日`);

    if (calendar.size > 0) {
      // 使用真实交易日历
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + 1); // 从第二天开始

      while (tradingDays.length < count) {
        const dateStr = currentDate.getFullYear().toString() +
          (currentDate.getMonth() + 1).toString().padStart(2, '0') +
          currentDate.getDate().toString().padStart(2, '0');

        if (calendar.has(dateStr)) {
          // 转换为YYYY-MM-DD格式
          const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
          tradingDays.push(formattedDate);
          console.log(`[真实交易日] 添加交易日: ${formattedDate}`);
        }

        currentDate.setDate(currentDate.getDate() + 1);

        // 防止无限循环
        if (currentDate > endDate) {
          console.warn(`[真实交易日] 查询范围不足，仅找到${tradingDays.length}个交易日`);
          break;
        }
      }
    } else {
      // 降级到周末过滤逻辑（v4.8.31增强：同时排除节假日）
      console.log(`[真实交易日] 降级到周末+节假日过滤逻辑`);
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + 1);

      while (tradingDays.length < count) {
        const formattedDate = currentDate.toISOString().split('T')[0];

        // v4.8.31增强：排除周末和节假日
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isLikelyHoliday(formattedDate)) {
          tradingDays.push(formattedDate);
        }

        currentDate.setDate(currentDate.getDate() + 1);

        if (currentDate > endDate) break;
      }
    }

    console.log(`[真实交易日] 成功获取${tradingDays.length}个交易日: ${tradingDays.join(', ')}`);
    return tradingDays;

  } catch (error) {
    console.error(`[真实交易日] 获取失败，使用周末+节假日过滤:`, error);

    // 兜底：使用周末+节假日过滤（v4.8.31增强）
    const fallbackDays: string[] = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1);

    while (fallbackDays.length < count) {
      const formattedDate = currentDate.toISOString().split('T')[0];

      // v4.8.31增强：排除周末和节假日
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isLikelyHoliday(formattedDate)) {
        fallbackDays.push(formattedDate);
      }

      currentDate.setDate(currentDate.getDate() + 1);

      if (currentDate > endDate) break;
    }

    return fallbackDays;
  }
}

// 2. 从交易日历获取7个交易日（向前追溯，16:00后包含当天）
export async function get7TradingDaysFromCalendar(endDate: string): Promise<string[]> {
  const tradingDays: string[] = [];

  // v4.8.27修复：使用Intl API正确获取北京时间和小时数
  // 问题：之前的逻辑在服务器已配置为UTC+8时会导致日期和时间错误
  // 解决：直接使用Intl API获取Asia/Shanghai时区的日期和时间
  // 中国股市15:00收盘，数据处理约需1小时，16:00后数据已基本完整
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const beijingHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const year = parts.find(p => p.type === 'year')?.value || '';
  const month = parts.find(p => p.type === 'month')?.value || '';
  const day = parts.find(p => p.type === 'day')?.value || '';
  const beijingDateStr = `${year}-${month}-${day}`;

  // 检查endDate是否是北京时间的今天
  const isToday = beijingDateStr === endDate;

  // v4.8.27修复：改为16:00判断，确保数据完整可用后才包含当天
  // 股市15:00收盘，数据处理约需1小时，16:00后数据已基本完整
  const shouldIncludeToday = isToday && beijingHour >= 16;

  console.log(`[7天交易日] 北京时间: ${now.toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})}, 小时: ${beijingHour}, 北京日期: ${beijingDateStr}, 是否包含当天: ${shouldIncludeToday}`);

  // 计算查询范围（向前追溯50天确保包含7个交易日，考虑节假日）
  // 7个交易日 * 5倍缓冲 = 35天，但考虑长假期（春节、国庆），使用50天更安全
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - Math.max(7 * 5, 50));

  const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endDateStr = endDate.replace(/-/g, '');

  console.log(`[7天交易日] 获取截止${endDate}的7个交易日，查询范围: ${startDateStr} ~ ${endDateStr}`);

  try {
    // 获取交易日历
    const calendar = await tradingCalendarManager.getTradingCalendar(startDateStr, endDateStr);

    if (calendar.size > 0) {
      // 使用真实交易日历，从endDate向前查找
      let currentDate = new Date(endDate);

      // v4.8.9修改：根据时间决定起始位置
      if (!shouldIncludeToday) {
        currentDate.setDate(currentDate.getDate() - 1); // 从前一天开始
        console.log(`[7天交易日] 当前时间<16:00，从前一天开始查找`);
      } else {
        console.log(`[7天交易日] 当前时间>=16:00，包含当天`);
      }

      while (tradingDays.length < 7) {
        const dateStr = currentDate.getFullYear().toString() +
          (currentDate.getMonth() + 1).toString().padStart(2, '0') +
          currentDate.getDate().toString().padStart(2, '0');

        if (calendar.has(dateStr)) {
          // 转换为YYYY-MM-DD格式
          const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
          tradingDays.unshift(formattedDate); // 添加到开头
          console.log(`[7天交易日] 添加交易日: ${formattedDate}`);
        }

        currentDate.setDate(currentDate.getDate() - 1);

        // 防止无限循环
        if (currentDate < startDate) {
          console.warn(`[7天交易日] 查询范围不足，仅找到${tradingDays.length}个交易日`);
          break;
        }
      }
    } else {
      // 降级到周末过滤逻辑（v4.8.31增强：同时排除节假日）
      console.log(`[7天交易日] 降级到周末+节假日过滤逻辑`);
      let currentDate = new Date(endDate);

      // v4.8.9修改：根据时间决定起始位置
      if (!shouldIncludeToday) {
        currentDate.setDate(currentDate.getDate() - 1);
      }

      while (tradingDays.length < 7) {
        const formattedDate = currentDate.toISOString().split('T')[0];

        // v4.8.31增强：排除周末和节假日
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isLikelyHoliday(formattedDate)) {
          tradingDays.unshift(formattedDate);
        }

        currentDate.setDate(currentDate.getDate() - 1);

        if (currentDate < startDate) break;
      }
    }

    console.log(`[7天交易日] 成功获取${tradingDays.length}个交易日: ${tradingDays.join(', ')}`);
    return tradingDays;

  } catch (error) {
    console.error(`[7天交易日] 获取失败，使用周末+节假日过滤:`, error);

    // 兜底：使用周末+节假日过滤（v4.8.31增强）
    const fallbackDays: string[] = [];
    let currentDate = new Date(endDate);

    // v4.8.9修改：根据时间决定起始位置
    if (!shouldIncludeToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    while (fallbackDays.length < 7) {
      const formattedDate = currentDate.toISOString().split('T')[0];

      // v4.8.31增强：排除周末和节假日
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6 && !isLikelyHoliday(formattedDate)) {
        fallbackDays.unshift(formattedDate);
      }

      currentDate.setDate(currentDate.getDate() - 1);

      if (fallbackDays.length >= 7) break;
    }

    return fallbackDays;
  }
}

// 3. 获取后续N个交易日
export async function getNext5TradingDays(baseDate: string): Promise<string[]> {
  return getValidTradingDays(baseDate, 5);
}

// 4. 获取下一个交易日
export async function getNextTradingDay(date: string): Promise<string | null> {
  const nextDays = await getValidTradingDays(date, 1);
  return nextDays.length > 0 ? nextDays[0] : null;
}

// 5. 检查是否为交易日
export async function isTradingDay(date: string): Promise<boolean> {
  const dateStr = date.replace(/-/g, '');

  // 扩展查询范围以包含该日期
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 1);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);

  const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '');

  try {
    const calendar = await tradingCalendarManager.getTradingCalendar(startDateStr, endDateStr);

    if (calendar.size > 0) {
      return calendar.has(dateStr);
    } else {
      // 降级到周末过滤
      const dateObj = new Date(date);
      return dateObj.getDay() !== 0 && dateObj.getDay() !== 6;
    }
  } catch (error) {
    console.error(`[交易日检查] 检查${date}失败，使用周末过滤:`, error);
    const dateObj = new Date(date);
    return dateObj.getDay() !== 0 && dateObj.getDay() !== 6;
  }
}

// 6. 获取交易日历缓存统计
export function getTradingCalendarStats() {
  return tradingCalendarManager.getCacheStats();
}

// 7. 清除交易日历缓存
export function clearTradingCalendarCache() {
  tradingCalendarManager.clearCache();
}

// 导出交易日历管理器以供外部使用
export { tradingCalendarManager };