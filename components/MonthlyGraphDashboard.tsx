'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ReferenceLine, RadialBarChart, RadialBar,
} from 'recharts';
import {
  monthlyDataset, monthOrder, kpiDefinitions, fyBudget,
  calculateYTD, calculateForecast, getKPIStatus, statusConfig,
  categories, KPIStatus,
} from '@/lib/monthlyData';

// カラーパレット
const COLORS = {
  primary: '#4F46E5',
  secondary: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  muted: '#94A3B8',
  budget: '#6366F1',
  actual: '#10B981',
  forecast: '#8B5CF6',
  positive: '#10B981',
  negative: '#EF4444',
};

const STATUS_COLORS: Record<KPIStatus, string> = {
  good: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
  pending: '#CBD5E1',
};

const CATEGORY_COLORS: Record<string, string> = {
  '収益': '#4F46E5',
  '営業': '#10B981',
  'プロジェクト': '#F59E0B',
  '人事': '#EC4899',
  '財務': '#8B5CF6',
};

export default function MonthlyGraphDashboard() {
  const [selectedKPI, setSelectedKPI] = useState('revenue');

  // 月次推移データ（グラフ用）
  const monthlyTrendData = useMemo(() => {
    return monthOrder.map(m => {
      const data = monthlyDataset.find(d => d.month === m);
      const label = `${m}月`;

      if (!data) return { month: label, isClosed: false };

      return {
        month: label,
        monthNum: m,
        isClosed: data.isClosed,
        // 主要指標
        revenueBudget: data.kpis.revenue?.budget || 0,
        revenueActual: data.isClosed ? data.kpis.revenue?.actual : null,
        profitBudget: data.kpis.operating_profit?.budget || 0,
        profitActual: data.isClosed ? data.kpis.operating_profit?.actual : null,
        ordersBudget: data.kpis.orders?.budget || 0,
        ordersActual: data.isClosed ? data.kpis.orders?.actual : null,
        // 選択中KPI
        selectedBudget: data.kpis[selectedKPI]?.budget || 0,
        selectedActual: data.isClosed ? data.kpis[selectedKPI]?.actual : null,
      };
    });
  }, [selectedKPI]);

  // 累計推移データ
  const ytdTrendData = useMemo(() => {
    const closedMonths = monthlyDataset.filter(d => d.isClosed);
    let ytdBudget = 0;
    let ytdActual = 0;

    return monthOrder.slice(0, closedMonths.length).map((m, idx) => {
      const data = monthlyDataset.find(d => d.month === m);
      if (!data || !data.isClosed) return null;

      ytdBudget += data.kpis.revenue?.budget || 0;
      ytdActual += data.kpis.revenue?.actual || 0;

      return {
        month: `${m}月`,
        累計予算: Math.round(ytdBudget * 10) / 10,
        累計実績: Math.round(ytdActual * 10) / 10,
        達成率: Math.round((ytdActual / ytdBudget) * 1000) / 10,
      };
    }).filter(Boolean);
  }, []);

  // 最新月のKPIステータス分布
  const statusDistribution = useMemo(() => {
    const currentMonth = monthlyDataset.filter(d => d.isClosed).pop();
    if (!currentMonth) return [];

    const counts: Record<KPIStatus, number> = { good: 0, warning: 0, critical: 0, pending: 0 };

    kpiDefinitions.forEach(kpi => {
      const v = currentMonth.kpis[kpi.id];
      if (v) {
        const status = getKPIStatus(v.varianceRate, kpi.isHigherBetter);
        counts[status]++;
      }
    });

    return [
      { name: '順調', value: counts.good, color: STATUS_COLORS.good },
      { name: '注意', value: counts.warning, color: STATUS_COLORS.warning },
      { name: '要対策', value: counts.critical, color: STATUS_COLORS.critical },
    ].filter(d => d.value > 0);
  }, []);

  // カテゴリ別達成率
  const categoryPerformance = useMemo(() => {
    const currentMonth = monthlyDataset.filter(d => d.isClosed).pop();
    if (!currentMonth) return [];

    return categories.map(cat => {
      const catKPIs = kpiDefinitions.filter(k => k.category === cat);
      let totalBudget = 0;
      let totalActual = 0;
      let count = 0;

      catKPIs.forEach(kpi => {
        const v = currentMonth.kpis[kpi.id];
        if (v && v.actual != null && kpi.unit !== '%') {
          totalBudget += v.budget;
          totalActual += v.actual;
          count++;
        }
      });

      const rate = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 100;

      return {
        category: cat,
        達成率: Math.round(rate * 10) / 10,
        color: CATEGORY_COLORS[cat],
      };
    });
  }, []);

  // 予実差異（当月）
  const varianceData = useMemo(() => {
    const currentMonth = monthlyDataset.filter(d => d.isClosed).pop();
    if (!currentMonth) return [];

    return kpiDefinitions
      .filter(kpi => kpi.unit !== '%')
      .slice(0, 8)
      .map(kpi => {
        const v = currentMonth.kpis[kpi.id];
        const variance = v?.variance || 0;
        return {
          name: kpi.name.length > 6 ? kpi.name.slice(0, 6) + '..' : kpi.name,
          fullName: kpi.name,
          差異: variance,
          fill: variance >= 0 ? COLORS.positive : COLORS.negative,
        };
      });
  }, []);

  // 通期見込データ
  const forecastData = useMemo(() => {
    const closedCount = monthlyDataset.filter(d => d.isClosed).length;
    const forecast = calculateForecast(monthlyDataset, closedCount);

    return {
      budget: fyBudget.revenue,
      forecast: forecast.revenue?.forecast || 0,
      current: ytdTrendData.length > 0 ? ytdTrendData[ytdTrendData.length - 1]?.累計実績 || 0 : 0,
      progress: closedCount / 12 * 100,
    };
  }, [ytdTrendData]);

  // 月別ステータスヒートマップ
  type HeatmapRow = { kpi: string } & Record<string, KPIStatus>;

  const heatmapData = useMemo((): HeatmapRow[] => {
    const mainKPIs = ['revenue', 'gross_profit', 'orders', 'project_margin'];

    return mainKPIs.map(kpiId => {
      const kpi = kpiDefinitions.find(k => k.id === kpiId)!;
      const months: Record<string, KPIStatus> = {};

      monthOrder.forEach(m => {
        const data = monthlyDataset.find(d => d.month === m);
        if (data && data.isClosed) {
          const v = data.kpis[kpiId];
          months[`${m}月`] = getKPIStatus(v?.varianceRate || null, kpi.isHigherBetter);
        } else {
          months[`${m}月`] = 'pending';
        }
      });

      return { kpi: kpi.name, ...months } as HeatmapRow;
    });
  }, []);

  // 現在月
  const currentMonthLabel = useMemo(() => {
    const closed = monthlyDataset.filter(d => d.isClosed);
    return closed.length > 0 ? `${closed[closed.length - 1].month}月` : '-';
  }, []);

  const selectedKPIDef = kpiDefinitions.find(k => k.id === selectedKPI);

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">月次フォロー グラフダッシュボード</h2>
          <p className="text-xs text-slate-500">2025年度 経営数値の可視化（{currentMonthLabel}時点）</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">進捗:</span>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all"
              style={{ width: `${forecastData.progress}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-700">
            {Math.round(forecastData.progress)}%
          </span>
        </div>
      </div>

      {/* 上段: 売上推移 & KPIステータス */}
      <div className="grid grid-cols-3 gap-4">
        {/* 売上・利益推移 */}
        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">売上・営業利益 推移</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-indigo-500" />予算
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-emerald-500" />実績
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthlyTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(value) => value != null ? `${Number(value).toFixed(1)}億円` : '-'}
              />
              <Bar yAxisId="left" dataKey="revenueBudget" fill="#C7D2FE" name="売上予算" barSize={16} />
              <Bar yAxisId="left" dataKey="revenueActual" fill="#10B981" name="売上実績" barSize={16} />
              <Line yAxisId="right" type="monotone" dataKey="profitBudget" stroke="#6366F1" strokeDasharray="5 5" name="利益予算" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="profitActual" stroke="#8B5CF6" strokeWidth={2} name="利益実績" dot={{ fill: '#8B5CF6', r: 3 }} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* KPIステータス分布 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">KPIステータス分布</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={{ stroke: '#94A3B8', strokeWidth: 1 }}
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}件`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusDistribution.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-slate-600">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中段: 累計推移 & カテゴリ別 & 予実差異 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 累計売上推移 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">累計売上推移</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={ytdTrendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(value) => `${value}億円`}
              />
              <Area type="monotone" dataKey="累計予算" stroke="#6366F1" fill="#C7D2FE" fillOpacity={0.5} />
              <Area type="monotone" dataKey="累計実績" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* カテゴリ別達成率 */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">カテゴリ別達成率（当月）</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={categoryPerformance} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(value) => `${value}%`}
              />
              <ReferenceLine x={100} stroke="#EF4444" strokeDasharray="3 3" />
              <Bar dataKey="達成率" barSize={18}>
                {categoryPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 予実差異（当月） */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">予実差異（当月）</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={varianceData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="#94A3B8" interval={0} />
              <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(value, _name, props) => {
                  const numValue = Number(value);
                  const fullName = (props as { payload?: { fullName?: string } })?.payload?.fullName || '';
                  return [`${numValue >= 0 ? '+' : ''}${numValue}`, fullName];
                }}
              />
              <ReferenceLine y={0} stroke="#94A3B8" />
              <Bar dataKey="差異" barSize={20}>
                {varianceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 下段: 通期見込 & KPIトレンド & ヒートマップ */}
      <div className="grid grid-cols-3 gap-4">
        {/* 通期見込ゲージ */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">通期売上見込</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="90%"
                barSize={12}
                data={[
                  { name: '見込', value: (forecastData.forecast / forecastData.budget) * 100, fill: forecastData.forecast >= forecastData.budget ? COLORS.positive : COLORS.danger },
                ]}
                startAngle={180}
                endAngle={0}
              >
                <RadialBar background={{ fill: '#E2E8F0' }} dataKey="value" cornerRadius={5} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-8">
            <div className="text-2xl font-bold text-slate-800">{forecastData.forecast.toFixed(1)}<span className="text-sm font-normal text-slate-500">億円</span></div>
            <div className="text-xs text-slate-500">予算: {forecastData.budget}億円</div>
            <div className={`text-xs font-medium ${forecastData.forecast >= forecastData.budget ? 'text-emerald-600' : 'text-red-600'}`}>
              {forecastData.forecast >= forecastData.budget ? '+' : ''}{(((forecastData.forecast / forecastData.budget) - 1) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* 任意KPIトレンド */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700">KPIトレンド</h3>
            <select
              value={selectedKPI}
              onChange={e => setSelectedKPI(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
            >
              {kpiDefinitions.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={monthlyTrendData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8 }}
                formatter={(value) => value != null ? `${value}${selectedKPIDef?.unit || ''}` : '-'}
              />
              <Line type="monotone" dataKey="selectedBudget" stroke="#6366F1" strokeDasharray="5 5" name="予算" dot={false} />
              <Line type="monotone" dataKey="selectedActual" stroke="#10B981" strokeWidth={2} name="実績" dot={{ fill: '#10B981', r: 3 }} connectNulls={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 月別ステータスヒートマップ */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">月別ステータス</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="py-1 px-1 text-left text-slate-500 font-normal">KPI</th>
                  {monthOrder.map(m => (
                    <th key={m} className="py-1 px-1 text-center text-slate-500 font-normal w-6">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row => (
                  <tr key={row.kpi}>
                    <td className="py-1 px-1 text-slate-700 truncate max-w-[60px]">{row.kpi}</td>
                    {monthOrder.map(m => {
                      const status = row[`${m}月`] as KPIStatus;
                      return (
                        <td key={m} className="py-1 px-1 text-center">
                          <span
                            className="inline-block w-4 h-4 rounded"
                            style={{ backgroundColor: STATUS_COLORS[status] }}
                            title={statusConfig[status].label}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center gap-3 mt-2 pt-2 border-t border-slate-100">
            {(['good', 'warning', 'critical', 'pending'] as KPIStatus[]).map(s => (
              <div key={s} className="flex items-center gap-1 text-[10px]">
                <span className="w-2 h-2 rounded" style={{ backgroundColor: STATUS_COLORS[s] }} />
                <span className="text-slate-500">{statusConfig[s].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 最下段: 主要KPI一覧 */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">主要KPI月次推移</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyTrendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#94A3B8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
            <Tooltip
              contentStyle={{ fontSize: 11, borderRadius: 8 }}
              formatter={(value) => value != null ? `${Number(value).toFixed(1)}億円` : '-'}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="revenueActual" stroke="#4F46E5" strokeWidth={2} name="売上" dot={{ r: 2 }} connectNulls={false} />
            <Line type="monotone" dataKey="profitActual" stroke="#10B981" strokeWidth={2} name="営業利益" dot={{ r: 2 }} connectNulls={false} />
            <Line type="monotone" dataKey="ordersActual" stroke="#F59E0B" strokeWidth={2} name="受注" dot={{ r: 2 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
