// ===== 增强的交易日历管理系统 =====
// 完整实现Tushare trade_cal接口集成，替换所有基于周末判断的简单日期逻辑

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
  private readonly TUSHARE_TOKEN = '2876ea85cb005fb5fa17c809a98174f2d5aae8b1f830110a5ead6211';
  private requestTimes: number[] = [];
  private readonly MAX_REQUESTS_PER_MINUTE = 60; // 保守的频率限制

  // 频率控制
  private async checkAndWait(): Promise<void> {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);

    if (this.requestTimes.length >= this.MAX_REQUESTS_PER_MINUTE) {
      const oldestRequest = Math.min(...this.requestTimes);
      const waitTime = 60000 - (now - oldestRequest) + 1000;
      console.log(`[交易日历] 频率控制等待: ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestTimes.push(now);
  }

  // 获取交易日历（带智能缓存和错误处理）
  async getTradingCalendar(startDate: string, endDate: string): Promise<Map<string, boolean>> {
    const now = Date.now();

    // 检查缓存是否有效
    if (this.cache && now < this.cache.expiry && this.cache.data.size > 0) {
      console.log(`[交易日历] 使用缓存数据，包含${this.cache.data.size}个日期`);
      return this.cache.data;
    }

    try {
      // 频率控制
      await this.checkAndWait();

      console.log(`[交易日历] 从Tushare获取交易日历: ${startDate} ~ ${endDate}`);

      // 添加超时控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('https://api.tushare.pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_name: 'trade_cal',
          token: this.TUSHARE_TOKEN,
          params: {
            exchange: 'SSE',
            start_date: startDate,
            end_date: endDate,
            is_open: '1' // 只获取交易日
          },
          fields: 'cal_date'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Tushare交易日历API HTTP error: ${response.status}`);
      }

      const data = await response.json();

      // 检查频率限制
      if (data.msg && data.msg.includes('每分钟最多访问该接口')) {
        console.log(`[交易日历] Tushare频率限制: ${data.msg}`);
        throw new Error('RATE_LIMIT');
      }

      if (data.code === 0 && data.data && data.data.items) {
        console.log(`[交易日历] 成功获取${data.data.items.length}条交易日历数据`);

        // 构建新缓存
        const calendarData = new Map<string, boolean>();
        data.data.items.forEach((item: any[]) => {
          const calDate = item[0]; // cal_date
          calendarData.set(calDate, true); // 只有交易日才会被返回
        });

        // 更新缓存
        this.cache = {
          data: calendarData,
          timestamp: now,
          expiry: now + this.CACHE_DURATION
        };

        console.log(`[交易日历] 缓存更新完成，包含${calendarData.size}个交易日`);
        return calendarData;

      } else {
        throw new Error(`交易日历API返回无效数据: ${JSON.stringify(data)}`);
      }

    } catch (error) {
      const err = error as any;
      if (err.name === 'AbortError') {
        console.error(`[交易日历] 请求超时`);
      } else if (err.message === 'RATE_LIMIT') {
        console.error(`[交易日历] 频率限制`);
      } else {
        console.error(`[交易日历] 获取失败:`, error);
      }

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
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + count * 3); // 扩大3倍查询范围

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
      // 降级到周末过滤逻辑
      console.log(`[真实交易日] 降级到周末过滤逻辑`);
      let currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + 1);

      while (tradingDays.length < count) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          // 转换为YYYY-MM-DD格式
          const formattedDate = currentDate.toISOString().split('T')[0];
          tradingDays.push(formattedDate);
        }

        currentDate.setDate(currentDate.getDate() + 1);

        if (currentDate > endDate) break;
      }
    }

    console.log(`[真实交易日] 成功获取${tradingDays.length}个交易日: ${tradingDays.join(', ')}`);
    return tradingDays;

  } catch (error) {
    console.error(`[真实交易日] 获取失败，使用周末过滤:`, error);

    // 兜底：使用周末过滤
    const fallbackDays: string[] = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + 1);

    while (fallbackDays.length < count) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // 转换为YYYY-MM-DD格式
        const formattedDate = currentDate.toISOString().split('T')[0];
        fallbackDays.push(formattedDate);
      }

      currentDate.setDate(currentDate.getDate() + 1);

      if (currentDate > endDate) break;
    }

    return fallbackDays;
  }
}

// 2. 从交易日历获取7个交易日（向前追溯）
export async function get7TradingDaysFromCalendar(endDate: string): Promise<string[]> {
  const tradingDays: string[] = [];

  // 计算查询范围（向前追溯30天确保包含7个交易日）
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);

  const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');
  const endDateStr = endDate.replace(/-/g, '');

  console.log(`[7天交易日] 获取截止${endDate}的7个交易日，查询范围: ${startDateStr} ~ ${endDateStr}`);

  try {
    // 获取交易日历
    const calendar = await tradingCalendarManager.getTradingCalendar(startDateStr, endDateStr);

    if (calendar.size > 0) {
      // 使用真实交易日历，从endDate向前查找
      let currentDate = new Date(endDate);

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
      // 降级到周末过滤逻辑
      console.log(`[7天交易日] 降级到周末过滤逻辑`);
      let currentDate = new Date(endDate);

      while (tradingDays.length < 7) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          // 转换为YYYY-MM-DD格式
          const formattedDate = currentDate.toISOString().split('T')[0];
          tradingDays.unshift(formattedDate);
        }

        currentDate.setDate(currentDate.getDate() - 1);

        if (currentDate < startDate) break;
      }
    }

    console.log(`[7天交易日] 成功获取${tradingDays.length}个交易日: ${tradingDays.join(', ')}`);
    return tradingDays;

  } catch (error) {
    console.error(`[7天交易日] 获取失败，使用周末过滤:`, error);

    // 兜底：使用周末过滤
    const fallbackDays: string[] = [];
    let currentDate = new Date(endDate);

    while (fallbackDays.length < 7) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        // 转换为YYYY-MM-DD格式
        const formattedDate = currentDate.toISOString().split('T')[0];
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