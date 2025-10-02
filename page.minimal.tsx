'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stocks')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">正在加载数据</h3>
          <p className="text-sm text-gray-600">请稍候...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">宇硕板块节奏</h1>

        {data && data.sevenDaysData && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {data.sevenDaysData.map((dayData: any, index: number) => (
              <div key={index} className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold text-center mb-3 text-blue-600">
                  {dayData.date}
                </h3>
                <div className="space-y-2">
                  {dayData.sectors && dayData.sectors.slice(0, 5).map((sector: any, sIndex: number) => (
                    <div key={sIndex} className="border border-gray-200 rounded p-2 text-sm">
                      <div className="font-medium text-gray-900">{sector.name}</div>
                      <div className="text-red-600 font-bold">
                        涨停: {sector.limitUpCount || 0}家
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!data && (
          <div className="text-center py-12">
            <p className="text-gray-600">暂无数据</p>
          </div>
        )}
      </div>
    </div>
  );
}