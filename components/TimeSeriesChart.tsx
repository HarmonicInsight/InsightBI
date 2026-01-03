'use client';

import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area,
} from 'recharts';
import { TimeSeriesData, AnalysisPeriod } from '@/lib/types';
import { generateTimeSeriesData, formatCurrencyBillions } from '@/lib/timeSeriesData';

interface TimeSeriesChartProps {
  data?: TimeSeriesData;
  compact?: boolean;
}

const MONTH_LABELS: { [key: string]: string } = {
  '2025-04': '4月', '2025-05': '5月', '2025-06': '6月',
  '2025-07': '7月', '2025-08': '8月', '2025-09': '9月',
  '2025-10': '10月', '2025-11': '11月', '2025-12': '12月',
  '2026-01': '1月', '2026-02': '2月', '2026-03': '3月',
};

export default function TimeSeriesChart({ data: propData, compact = false }: TimeSeriesChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalysisPeriod>('full_year');
  const [showBudget, setShowBudget] = useState(true);
  const [showForecast, setShowForecast] = useState(true);
  const [showActual, setShowActual] = useState(true);
  const [chartType, setChartType] = useState<'revenue' | 'profit'>('revenue');

  // Generate data if not provided
  const data = useMemo(() => propData || generateTimeSeriesData(), [propData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const source = chartType === 'revenue'
      ? data.companyMonthly.revenue
      : data.companyMonthly.grossProfit;

    return source.map(item => ({
      period: MONTH_LABELS[item.period] || item.period,
      予算: item.budget / 100000000,
      見通し: item.forecast / 100000000,
      実績: item.actual !== null ? item.actual / 100000000 : null,
      前年: item.yoyActual ? item.yoyActual / 100000000 : null,
      isActual: item.actual !== null,
    }));
  }, [data, chartType]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const rev = data.companyMonthly.revenue;
    const ytdActual = rev.slice(0, 6).reduce((sum, r) => sum + (r.actual || 0), 0);
    const ytdBudget = rev.slice(0, 6).reduce((sum, r) => sum + r.budget, 0);
    const fullYearForecast = rev.reduce((sum, r) => sum + r.forecast, 0);
    const fullYearBudget = rev.reduce((sum, r) => sum + r.budget, 0);

    return {
      ytdActual,
      ytdBudget,
      ytdAchievement: (ytdActual / ytdBudget) * 100,
      fullYearForecast,
      fullYearBudget,
      fullYearAchievement: (fullYearForecast / fullYearBudget) * 100,
    };
  }, [data]);

  // Forecast history chart data
  const forecastHistoryData = useMemo(() => {
    return data.forecastHistory.map(item => ({
      時点: item.asOfMonth.split('-')[1] + '月',
      見通し: item.fullYearForecast / 100000000,
      note: item.note,
    }));
  }, [data]);

  // Compact mode - simple chart only
  if (compact) {
    return (
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} stroke="#94A3B8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(value: number) => value != null ? `${value?.toFixed(1)}億` : '-'}
            />
            <Line type="monotone" dataKey="予算" stroke="#6366f1" strokeWidth={1} strokeDasharray="5 5" dot={false} />
            <Area type="monotone" dataKey="見通し" fill="#fef3c7" stroke="#f59e0b" strokeWidth={1} fillOpacity={0.3} />
            <Line type="monotone" dataKey="実績" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">時系列分析</h3>
            <p className="text-sm text-slate-500">2025年度（{data.asOfDate}）</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Chart Type */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setChartType('revenue')}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  chartType === 'revenue'
                    ? 'bg-white shadow text-indigo-600 font-medium'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                売上高
              </button>
              <button
                onClick={() => setChartType('profit')}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  chartType === 'profit'
                    ? 'bg-white shadow text-indigo-600 font-medium'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                粗利益
              </button>
            </div>

            {/* Display Options */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={showBudget}
                  onChange={(e) => setShowBudget(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="text-slate-600">予算</span>
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={showForecast}
                  onChange={(e) => setShowForecast(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600"
                />
                <span className="text-slate-600">見通し</span>
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={showActual}
                  onChange={(e) => setShowActual(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
                <span className="text-slate-600">実績</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">上期実績（4-9月）</div>
          <div className="text-2xl font-bold text-slate-800">
            {formatCurrencyBillions(summaryStats.ytdActual)}
          </div>
          <div className={`text-sm ${summaryStats.ytdAchievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
            予算比 {summaryStats.ytdAchievement.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">通期見通し</div>
          <div className="text-2xl font-bold text-slate-800">
            {formatCurrencyBillions(summaryStats.fullYearForecast)}
          </div>
          <div className={`text-sm ${summaryStats.fullYearAchievement >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
            予算比 {summaryStats.fullYearAchievement.toFixed(1)}%
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">前年同期比（売上）</div>
          <div className={`text-2xl font-bold ${data.summary.yoyComparison.revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {data.summary.yoyComparison.revenueChange >= 0 ? '+' : ''}{data.summary.yoyComparison.revenueChange.toFixed(1)}%
          </div>
          <div className="text-sm text-slate-500">vs 2024年度上期</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="text-sm text-slate-500 mb-1">期初予算からの変動</div>
          <div className={`text-2xl font-bold ${data.summary.fullYear.forecastChangeFromInitial >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrencyBillions(data.summary.fullYear.forecastChangeFromInitial)}
          </div>
          <div className="text-sm text-slate-500">見通し修正額</div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">
          月次推移 - {chartType === 'revenue' ? '売上高' : '粗利益'}（億円）
        </h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number) => [`${value?.toFixed(1)}億`, '']}
              />
              <Legend />

              {/* Reference line for current month */}
              <ReferenceLine
                x="9月"
                stroke="#94a3b8"
                strokeDasharray="5 5"
                label={{ value: '現在', position: 'top', fill: '#64748b', fontSize: 11 }}
              />

              {showBudget && (
                <Line
                  type="monotone"
                  dataKey="予算"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}

              {showForecast && (
                <Area
                  type="monotone"
                  dataKey="見通し"
                  fill="#fef3c7"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={0.3}
                />
              )}

              {showActual && (
                <Line
                  type="monotone"
                  dataKey="実績"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  connectNulls={false}
                />
              )}

              <Line
                type="monotone"
                dataKey="前年"
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-indigo-500" style={{ display: 'inline-block' }} /> 予算ライン
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-amber-100 border border-amber-500 rounded-sm" /> 見通し
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-emerald-500" style={{ display: 'inline-block' }} /> 実績
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-slate-400" style={{ display: 'inline-block', borderStyle: 'dashed' }} /> 前年
          </span>
        </div>
      </div>

      {/* Forecast History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-4">
          通期見通しの推移（いつ時点でいくらと予想したか）
        </h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastHistoryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="時点"
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis
                domain={['dataMin - 5', 'dataMax + 5']}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickFormatter={(value) => `${value}億`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => `${value.toFixed(1)}億`}
              />
              <ReferenceLine
                y={200}
                stroke="#6366f1"
                strokeDasharray="5 5"
                label={{ value: '期初予算 200億', position: 'right', fill: '#6366f1', fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="見通し"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-1">
          {data.forecastHistory.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">{item.asOfMonth.split('-')[1]}月時点:</span>
              <span className="font-medium text-slate-700">{formatCurrencyBillions(item.fullYearForecast)}</span>
              {item.note && <span className="text-slate-400">- {item.note}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-2">時系列分析の見方</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>実績</strong>: 4月〜9月の確定データ</li>
          <li><strong>見通し</strong>: 10月〜3月は現時点の予想値</li>
          <li><strong>予算</strong>: 期初に設定した目標値</li>
          <li><strong>前年</strong>: 2024年度の実績（参考）</li>
        </ul>
      </div>
    </div>
  );
}
