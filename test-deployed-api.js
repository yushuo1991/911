// 测试部署后的API响应
const testDeployedApi = async () => {
  const dates = ['2024-09-11', '2024-09-10', '2024-09-09']; // 测试几个不同日期
  
  for (const date of dates) {
    console.log(`\n=== 测试日期: ${date} ===`);
    
    try {
      // 测试部署的API
      const response = await fetch(`https://your-vercel-url.vercel.app/api/stocks?date=${date}`);
      const result = await response.json();
      
      console.log('API响应状态:', response.status);
      console.log('响应数据:', JSON.stringify(result, null, 2));
      
      if (result.success && result.data) {
        console.log('解析后的股票数据:');
        console.log('- 总股票数:', result.data.stats.total_stocks);
        console.log('- 分类数:', result.data.stats.category_count);
        console.log('- 盈利比例:', result.data.stats.profit_ratio + '%');
        
        // 展示前几个分类的详细数据
        Object.entries(result.data.categories).slice(0, 2).forEach(([category, stocks]) => {
          console.log(`\n分类: ${category} (${stocks.length}只)`);
          stocks.slice(0, 3).forEach(stock => {
            console.log(`  - ${stock.name}(${stock.code}) [${stock.td_type}]`);
          });
        });
      }
      
    } catch (error) {
      console.error(`请求${date}失败:`, error.message);
    }
  }
  
  // 也测试原始API调用
  console.log(`\n=== 直接测试原始API ===`);
  try {
    const url = 'https://apphis.longhuvip.com/w1/api/index.php';
    const formData = new URLSearchParams({
      Date: '20240911',
      Index: '0',
      PhoneOSNew: '2', 
      VerSion: '5.21.0.1',
      a: 'GetPlateInfo_w38',
      apiv: 'w42',
      c: 'HisLimitResumption',
      st: '20'
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
        'Accept': '*/*',
        'User-Agent': 'lhb/5.21.1 (com.kaipanla.www; build:1; iOS 18.6.2) Alamofire/4.9.1',
        'Accept-Language': 'zh-Hans-CN;q=1.0, en-CN;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive'
      },
      body: formData,
    });
    
    const data = await response.json();
    console.log('原始API返回数据结构:');
    console.log('- 涨停总数:', data.nums?.ZT || 0);
    console.log('- 分类数量:', data.list?.length || 0);
    
    if (data.list && data.list.length > 0) {
      console.log('\n前3个分类详情:');
      data.list.slice(0, 3).forEach((category, index) => {
        console.log(`${index + 1}. ${category.ZSName}: ${category.StockList?.length || 0}只股票`);
        if (category.StockList && category.StockList.length > 0) {
          console.log(`   示例股票: ${category.StockList[0][1]}(${category.StockList[0][0]}) [${category.StockList[0][9]}]`);
        }
      });
    }
    
  } catch (error) {
    console.error('原始API调用失败:', error.message);
  }
};

testDeployedApi();