'use client';

import { useState, useMemo } from 'react';
import {
  monthlyDataset,
  kpiDefinitions,
  categories,
  monthOrder,
  calculateYTD,
  calculateForecast,
  getKPIStatus,
  statusConfig,
  getCurrentClosedMonth,
  fyBudget,
} from '@/lib/monthlyData';
import MonthlyGraphDashboard from './MonthlyGraphDashboard';

// ビューモード
type ViewMode = 'table' | 'graph';

// 数値フォーマット
function fmt(value: number | null, unit: string): string {
  if (value === null) return '-';
  if (unit === '%') return `${value.toFixed(1)}`;
  if (unit === '億円') return `${value.toFixed(1)}`;
  return `${Math.round(value)}`;
}

// 差異の色
function varColor(rate: number | null, isHigherBetter: boolean): string {
  if (rate === null) return 'text-slate-300';
  const effective = isHigherBetter ? rate : -rate;
  if (effective >= 0) return 'text-emerald-600';
  if (effective >= -5) return 'text-amber-600';
  return 'text-red-600';
}

export default function MonthlyFollowDashboard() {
  const currentClosedMonth = getCurrentClosedMonth();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedMonth, setSelectedMonth] = useState(currentClosedMonth);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // 選択月データ
  const currentData = useMemo(() =>
    monthlyDataset.find(d => d.month === selectedMonth) || null
  , [selectedMonth]);

  // 前月データ
  const previousMonth = monthOrder[monthOrder.indexOf(selectedMonth) - 1];
  const previousData = useMemo(() =>
    previousMonth ? monthlyDataset.find(d => d.month === previousMonth) : null
  , [previousMonth]);

  // 累計（選択月まで）
  const ytdData = useMemo(() =>
    calculateYTD(monthlyDataset, selectedMonth)
  , [selectedMonth]);

  // 通期見込
  const forecastData = useMemo(() =>
    calculateForecast(monthlyDataset, selectedMonth)
  , [selectedMonth]);

  // フィルター済みKPI
  const filteredKPIs = selectedCategory === 'all'
    ? kpiDefinitions
    : kpiDefinitions.filter(k => k.category === selectedCategory);

  // サマリー計算
  const summary = useMemo(() => {
    const closedMonths = monthlyDataset.filter(d => d.isClosed);
    const revenue = currentData?.kpis.revenue;
    const revenueYTD = ytdData.revenue;

    let goodCount = 0;
    let criticalCount = 0;
    kpiDefinitions.forEach(k => {
      const v = currentData?.kpis[k.id];
      if (v && v.varianceRate !== null) {
        const status = getKPIStatus(v.varianceRate, k.isHigherBetter);
        if (status === 'good') goodCount++;
        if (status === 'critical') criticalCount++;
      }
    });

    return {
      closedMonths: closedMonths.length,
      revenue: revenue?.actual,
      revenueRate: revenue?.varianceRate,
      revenueYTD: revenueYTD?.actual,
      revenueYTDRate: revenueYTD?.varianceRate,
      forecast: forecastData.revenue?.forecast,
      forecastRate: forecastData.revenue?.varianceRate,
      goodCount,
      criticalCount,
    };
  }, [currentData, ytdData, forecastData]);

  const isTableView = viewMode === 'table';

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* ヘッダー with toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">月次フォロー</h1>
          <p className="text-sm text-slate-500">2025年度（4月〜3月）</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">
            締め済: <span className="font-bold text-indigo-600">{summary.closedMonths}</span>/12ヶ月
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                isTableView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                一覧
              </span>
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                !isTableView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                グラフ
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* グラフビュー */}
      {!isTableView && <MonthlyGraphDashboard />}

      {/* テーブルビュー（月選択バー以降） */}
      {isTableView && (
        <>
      {/* 月選択バー（通期12ヶ月） */}
      <div className="bg-white rounded-lg border border-slate-200 p-2">
        <div className="flex gap-1">
          {monthOrder.map(m => {
            const data = monthlyDataset.find(d => d.month === m);
            const isClosed = data?.isClosed || false;
            const isSelected = selectedMonth === m;

            return (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`flex-1 py-2 px-1 text-xs rounded transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold'
                    : isClosed
                      ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <div>{m}月</div>
                {isClosed && <div className="text-[10px] mt-0.5">●</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-5 gap-3">
        {/* 当月売上 */}
        <div className={`rounded-lg p-3 ${summary.revenue != null ? (summary.revenueRate != null && summary.revenueRate >= -5 ? 'bg-emerald-50' : 'bg-red-50') : 'bg-slate-50'}`}>
          <div className="text-xs text-slate-500">当月売上</div>
          <div className="text-xl font-bold">{summary.revenue != null ? `${summary.revenue.toFixed(1)}` : '-'}<span className="text-xs font-normal text-slate-500 ml-1">億円</span></div>
          {summary.revenueRate != null && (
            <div className={`text-xs ${summary.revenueRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              予算比 {summary.revenueRate >= 0 ? '+' : ''}{summary.revenueRate.toFixed(1)}%
            </div>
          )}
        </div>

        {/* 累計売上 */}
        <div className={`rounded-lg p-3 ${summary.revenueYTD != null ? (summary.revenueYTDRate != null && summary.revenueYTDRate >= -5 ? 'bg-emerald-50' : 'bg-red-50') : 'bg-slate-50'}`}>
          <div className="text-xs text-slate-500">累計売上（〜{selectedMonth}月）</div>
          <div className="text-xl font-bold">{summary.revenueYTD != null ? `${summary.revenueYTD.toFixed(1)}` : '-'}<span className="text-xs font-normal text-slate-500 ml-1">億円</span></div>
          {summary.revenueYTDRate != null && (
            <div className={`text-xs ${summary.revenueYTDRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              予算比 {summary.revenueYTDRate >= 0 ? '+' : ''}{summary.revenueYTDRate.toFixed(1)}%
            </div>
          )}
        </div>

        {/* 通期見込 */}
        <div className={`rounded-lg p-3 ${summary.forecast != null ? (summary.forecastRate != null && summary.forecastRate >= -5 ? 'bg-emerald-50' : 'bg-red-50') : 'bg-slate-50'}`}>
          <div className="text-xs text-slate-500">通期見込</div>
          <div className="text-xl font-bold">{summary.forecast != null ? `${summary.forecast.toFixed(1)}` : '-'}<span className="text-xs font-normal text-slate-500 ml-1">億円</span></div>
          {summary.forecastRate != null && (
            <div className={`text-xs ${summary.forecastRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              予算比 {summary.forecastRate >= 0 ? '+' : ''}{summary.forecastRate.toFixed(1)}%
            </div>
          )}
          <div className="text-[10px] text-slate-400">予算: {fyBudget.revenue}億円</div>
        </div>

        {/* 順調KPI */}
        <div className={`rounded-lg p-3 ${summary.goodCount >= kpiDefinitions.length * 0.6 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
          <div className="text-xs text-slate-500">順調KPI</div>
          <div className="text-xl font-bold text-emerald-700">{summary.goodCount}<span className="text-xs font-normal text-slate-500 ml-1">/{kpiDefinitions.length}</span></div>
        </div>

        {/* 要対策KPI */}
        <div className={`rounded-lg p-3 ${summary.criticalCount === 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <div className="text-xs text-slate-500">要対策KPI</div>
          <div className={`text-xl font-bold ${summary.criticalCount === 0 ? 'text-emerald-700' : 'text-red-700'}`}>{summary.criticalCount}<span className="text-xs font-normal text-slate-500 ml-1">件</span></div>
        </div>
      </div>

      {/* カテゴリフィルター */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">カテゴリ:</span>
        {['all', ...categories].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2 py-1 text-xs rounded ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat === 'all' ? '全て' : cat}
          </button>
        ))}
      </div>

      {/* KPIテーブル */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs text-slate-600">
              <th className="py-2 px-2 text-left font-medium w-32">KPI</th>
              <th colSpan={3} className="py-2 px-2 text-center font-medium border-l border-slate-200">
                当月（{currentData?.label || '-'}）
              </th>
              <th colSpan={2} className="py-2 px-2 text-center font-medium border-l border-slate-200">
                前月（{previousData?.label || '-'}）
              </th>
              <th colSpan={2} className="py-2 px-2 text-center font-medium border-l border-slate-200">
                累計（4月〜{currentData?.label}）
              </th>
              <th colSpan={2} className="py-2 px-2 text-center font-medium border-l border-slate-200">
                通期見込
              </th>
              <th className="py-2 px-2 text-center font-medium border-l border-slate-200 w-16">状況</th>
            </tr>
            <tr className="text-[10px] text-slate-400">
              <th></th>
              <th className="py-1 px-1 text-right">実績</th>
              <th className="py-1 px-1 text-right">予算</th>
              <th className="py-1 px-1 text-right">差異</th>
              <th className="py-1 px-1 text-right border-l border-slate-200">実績</th>
              <th className="py-1 px-1 text-right">前月比</th>
              <th className="py-1 px-1 text-right border-l border-slate-200">実績</th>
              <th className="py-1 px-1 text-right">差異</th>
              <th className="py-1 px-1 text-right border-l border-slate-200">見込</th>
              <th className="py-1 px-1 text-right">差異</th>
              <th className="border-l border-slate-200"></th>
            </tr>
          </thead>
          <tbody>
            {filteredKPIs.map(kpi => {
              const curr = currentData?.kpis[kpi.id];
              const prev = previousData?.kpis[kpi.id];
              const ytd = ytdData[kpi.id];
              const fc = forecastData[kpi.id];
              const status = curr ? getKPIStatus(curr.varianceRate, kpi.isHigherBetter) : 'pending';
              const statusCfg = statusConfig[status];

              // 前月比
              const momChange = curr && prev && curr.actual != null && prev.actual != null
                ? curr.actual - prev.actual
                : null;
              const momRate = momChange != null && prev && prev.actual
                ? (momChange / prev.actual) * 100
                : null;

              return (
                <tr key={kpi.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.bg}`} />
                      <span className="font-medium text-slate-800 text-xs">{kpi.name}</span>
                    </div>
                  </td>

                  {/* 当月 */}
                  <td className="py-1.5 px-1 text-right">
                    <span className="font-semibold">{fmt(curr?.actual ?? null, kpi.unit)}</span>
                    <span className="text-slate-400 text-[10px] ml-0.5">{kpi.unit !== '%' ? kpi.unit : '%'}</span>
                  </td>
                  <td className="py-1.5 px-1 text-right text-slate-400 text-[10px]">
                    {curr ? fmt(curr.budget, kpi.unit) : '-'}
                  </td>
                  <td className="py-1.5 px-1 text-right">
                    <span className={`text-[10px] font-medium ${varColor(curr?.varianceRate ?? null, kpi.isHigherBetter)}`}>
                      {curr?.varianceRate !== null && curr?.varianceRate !== undefined ? `${curr.varianceRate >= 0 ? '+' : ''}${curr.varianceRate.toFixed(1)}%` : '-'}
                    </span>
                  </td>

                  {/* 前月 */}
                  <td className="py-1.5 px-1 text-right border-l border-slate-100 text-slate-600 text-xs">
                    {fmt(prev?.actual ?? null, kpi.unit)}
                  </td>
                  <td className="py-1.5 px-1 text-right">
                    <span className={`text-[10px] ${momRate !== null ? varColor(momRate, kpi.isHigherBetter) : 'text-slate-300'}`}>
                      {momRate !== null ? `${momRate >= 0 ? '+' : ''}${momRate.toFixed(1)}%` : '-'}
                    </span>
                  </td>

                  {/* 累計 */}
                  <td className="py-1.5 px-1 text-right border-l border-slate-100 font-medium text-xs">
                    {fmt(ytd?.actual ?? null, kpi.unit)}
                  </td>
                  <td className="py-1.5 px-1 text-right">
                    <span className={`text-[10px] font-medium ${varColor(ytd?.varianceRate ?? null, kpi.isHigherBetter)}`}>
                      {ytd?.varianceRate !== null ? `${ytd.varianceRate >= 0 ? '+' : ''}${ytd.varianceRate.toFixed(1)}%` : '-'}
                    </span>
                  </td>

                  {/* 通期見込 */}
                  <td className="py-1.5 px-1 text-right border-l border-slate-100 font-medium text-xs">
                    {fmt(fc?.forecast ?? null, kpi.unit)}
                  </td>
                  <td className="py-1.5 px-1 text-right">
                    <span className={`text-[10px] font-medium ${varColor(fc?.varianceRate ?? null, kpi.isHigherBetter)}`}>
                      {fc?.varianceRate !== null ? `${fc.varianceRate >= 0 ? '+' : ''}${fc.varianceRate.toFixed(1)}%` : '-'}
                    </span>
                  </td>

                  {/* ステータス */}
                  <td className="py-1.5 px-1 text-center border-l border-slate-100">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 未確定月の説明 */}
      {!currentData?.isClosed && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-sm text-slate-500">
          {selectedMonth}月はまだ月次締めが完了していません。予算のみ表示しています。
        </div>
      )}

      {/* 要対策KPIハイライト */}
      {summary.criticalCount > 0 && currentData?.isClosed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h3 className="font-semibold text-red-800 text-sm mb-2">要対策KPI（{currentData?.label}）</h3>
          <div className="grid grid-cols-4 gap-2">
            {kpiDefinitions.filter(k => {
              const v = currentData?.kpis[k.id];
              return v && getKPIStatus(v.varianceRate, k.isHigherBetter) === 'critical';
            }).map(k => {
              const v = currentData?.kpis[k.id];
              return (
                <div key={k.id} className="bg-white rounded p-2">
                  <div className="font-medium text-slate-800 text-xs">{k.name}</div>
                  <div className="text-red-600 text-xs">
                    {v?.varianceRate !== null ? `${v.varianceRate >= 0 ? '+' : ''}${v.varianceRate.toFixed(1)}%` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
