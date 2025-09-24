// 浏览器控制台测试脚本 - 自动化测试新功能
// 复制此脚本到浏览器开发者工具控制台运行

console.log('🚀 开始自动化测试宇硕板块节奏功能...');

// 测试1: 检查页面加载
function testPageLoad() {
    console.log('📝 测试1: 页面基础元素检查');

    // 检查标题
    const title = document.querySelector('h1');
    if (title && title.textContent.includes('宇硕板块节奏')) {
        console.log('✅ 页面标题正确');
    } else {
        console.log('❌ 页面标题错误');
    }

    // 检查刷新按钮
    const refreshBtn = document.querySelector('button[onClick*="fetch7DaysData"]');
    if (refreshBtn) {
        console.log('✅ 刷新按钮存在');
    } else {
        console.log('❌ 刷新按钮不存在');
    }

    // 检查筛选开关
    const filterCheckbox = document.querySelector('input[type="checkbox"]');
    if (filterCheckbox) {
        console.log('✅ 筛选开关存在');
    } else {
        console.log('❌ 筛选开关不存在');
    }
}

// 测试2: 检查7天网格布局
function testTimelineLayout() {
    console.log('📝 测试2: 时间轴布局检查');

    // 检查7天网格
    const grid = document.querySelector('.grid-cols-7');
    if (grid) {
        console.log('✅ 7天网格布局存在');

        // 计算实际列数
        const columns = grid.children.length;
        console.log(`📊 显示 ${columns} 天数据`);

        if (columns === 7) {
            console.log('✅ 7天数据完整');
        } else if (columns > 0) {
            console.log(`⚠️ 显示 ${columns} 天数据(可能API仍在加载)`);
        } else {
            console.log('❌ 无数据显示');
        }
    } else {
        console.log('❌ 7天网格布局不存在');
    }
}

// 测试3: 检查板块展开功能
function testSectorExpansion() {
    console.log('📝 测试3: 板块展开功能测试');

    // 查找可点击的板块
    const sectorCards = document.querySelectorAll('[onClick*="toggleSectorExpansion"]');
    console.log(`📊 发现 ${sectorCards.length} 个可展开板块`);

    if (sectorCards.length > 0) {
        console.log('✅ 板块展开功能就绪');

        // 尝试点击第一个板块
        console.log('🔄 测试点击第一个板块...');
        sectorCards[0].click();

        setTimeout(() => {
            // 检查是否有展开内容
            const expandedContent = document.querySelector('.bg-gray-50');
            if (expandedContent) {
                console.log('✅ 板块展开功能正常');
            } else {
                console.log('❌ 板块展开功能异常');
            }
        }, 500);
    } else {
        console.log('❌ 无可展开板块');
    }
}

// 测试4: 检查个股5日溢价数据
function testStockFollowUpData() {
    console.log('📝 测试4: 个股5日溢价数据检查');

    setTimeout(() => {
        // 查找后续表现数据
        const followUpGrids = document.querySelectorAll('.grid-cols-5');
        console.log(`📊 发现 ${followUpGrids.length} 个5日表现网格`);

        if (followUpGrids.length > 0) {
            console.log('✅ 个股5日溢价表格存在');

            // 检查是否有数据
            const performanceData = document.querySelectorAll('[class*="getPerformanceClass"]');
            if (performanceData.length > 0) {
                console.log('✅ 溢价数据正常显示');
            } else {
                console.log('⚠️ 溢价数据可能仍在加载');
            }
        } else {
            console.log('❌ 无5日溢价表格');
        }
    }, 1000);
}

// 测试5: 检查K线图功能
function testKLineChart() {
    console.log('📝 测试5: K线图功能测试');

    setTimeout(() => {
        // 查找股票名称链接
        const stockLinks = document.querySelectorAll('[onClick*="handleStockClick"]');
        console.log(`📊 发现 ${stockLinks.length} 个股票K线图链接`);

        if (stockLinks.length > 0) {
            console.log('✅ K线图功能就绪');

            // 测试点击股票名称
            console.log('🔄 测试点击股票名称...');
            stockLinks[0].click();

            setTimeout(() => {
                // 检查K线图弹窗
                const modal = document.querySelector('.fixed.inset-0.bg-black');
                if (modal) {
                    console.log('✅ K线图弹窗正常');

                    // 关闭弹窗
                    const closeBtn = modal.querySelector('button');
                    if (closeBtn) closeBtn.click();
                } else {
                    console.log('❌ K线图弹窗异常');
                }
            }, 500);
        } else {
            console.log('❌ 无K线图链接');
        }
    }, 1500);
}

// 测试6: 检查API数据流
function testAPIData() {
    console.log('📝 测试6: API数据检查');

    // 监听网络请求
    const originalFetch = window.fetch;
    let apiCalls = 0;

    window.fetch = function(...args) {
        if (args[0].includes('/api/stocks')) {
            apiCalls++;
            console.log(`📡 API调用 ${apiCalls}: ${args[0]}`);
        }
        return originalFetch.apply(this, arguments);
    };

    // 触发API调用
    const refreshBtn = document.querySelector('button');
    if (refreshBtn && refreshBtn.textContent.includes('刷新')) {
        refreshBtn.click();
        console.log('🔄 触发API数据刷新');
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🎯 ========== 自动化测试开始 ==========');

    testPageLoad();

    setTimeout(() => testTimelineLayout(), 1000);
    setTimeout(() => testSectorExpansion(), 2000);
    setTimeout(() => testStockFollowUpData(), 3000);
    setTimeout(() => testKLineChart(), 4000);
    setTimeout(() => testAPIData(), 5000);

    setTimeout(() => {
        console.log('🎯 ========== 自动化测试完成 ==========');
        console.log('💡 如果所有测试都显示 ✅，说明功能正常');
        console.log('🔍 如果有 ❌ 或 ⚠️，说明需要进一步调试');
    }, 6000);
}

// 延迟运行，等待页面完全加载
setTimeout(runAllTests, 2000);

console.log('⏳ 等待2秒后开始测试...');