'use client';

import { useState, useMemo } from 'react';
import {
  monthlyDataset,
  kpiDefinitions,
  monthOrder,
  calculateYTD,
  calculateForecast,
  getKPIStatus,
  statusConfig,
  getCurrentClosedMonth,
  fyBudget,
} from '@/lib/monthlyData';
import {
  pipelineStages,
  calculatePipelineSummary,
  getWeightedTotal,
  getGrossTotal,
  pipelineAsOf,
} from '@/lib/pipelineData';
import MonthlyGraphDashboard from './MonthlyGraphDashboard';

// ビューモード
type ViewMode = 'table' | 'graph';

// KPIカテゴリの定義（誰が見るか明確に）
const kpiCategories = [
  { id: '収益', label: '収益', owner: '経営層', color: 'indigo' },
  { id: '営業', label: '営業', owner: '営業部', color: 'blue' },
  { id: 'プロジェクト', label: 'プロジェクト', owner: 'PMO', color: 'amber' },
  { id: '人事', label: '人事', owner: '人事部', color: 'emerald' },
  { id: '財務', label: '財務', owner: '経理部', color: 'slate' },
];

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

  // サマリー計算
  const summary = useMemo(() => {
    const closedMonths = monthlyDataset.filter(d => d.isClosed);
    const revenueYTD = ytdData.revenue;

    return {
      closedMonths: closedMonths.length,
      revenueYTD: revenueYTD?.actual,
    };
  }, [ytdData]);

  // パイプライン（Sales Insightから取得）
  const pipelineSummary = useMemo(() => calculatePipelineSummary(), []);
  const pipelineWeighted = useMemo(() => getWeightedTotal(), []);
  const pipelineGross = useMemo(() => getGrossTotal(), []);

  // 目標起点のKPI計算
  const targetKPIs = useMemo(() => {
    const annualTarget = fyBudget.revenue;
    const confirmedYTD = summary.revenueYTD || 0;
    const pipelineA = pipelineSummary.find(s => s.stage === 'A')?.totalAmount || 0;
    const continuingRevenue = confirmedYTD + (pipelineA * 0.8);
    const newBusinessRequired = Math.max(0, annualTarget - continuingRevenue - pipelineWeighted);
    const currentStack = confirmedYTD + pipelineWeighted;
    const achievementRate = (currentStack / annualTarget) * 100;

    return { annualTarget, confirmedYTD, continuingRevenue, newBusinessRequired, currentStack, achievementRate };
  }, [summary, pipelineSummary, pipelineWeighted]);

  const isTableView = viewMode === 'table';

  // KPIをカテゴリ別にグループ化
  const groupedKPIs = useMemo(() => {
    return kpiCategories.map(cat => ({
      ...cat,
      kpis: kpiDefinitions.filter(k => k.category === cat.id),
    }));
  }, []);

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">月次フォロー</h1>
          <p className="text-xs text-slate-500">目標達成をチェック → 問題箇所を特定</p>
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
              一覧
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                !isTableView ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              グラフ
            </button>
          </div>
        </div>
      </div>

      {/* グラフビュー */}
      {!isTableView && <MonthlyGraphDashboard />}

      {/* テーブルビュー */}
      {isTableView && (
        <>
          {/* 月選択バー */}
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

          {/* 目標 vs 積み上げ */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            {/* 目標 → 積み上げ → 差分 */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] text-slate-500">通期目標</div>
                <div className="text-3xl font-bold text-slate-900">{targetKPIs.annualTarget}<span className="text-sm text-slate-400 ml-1">億円</span></div>
              </div>
              <div className="text-2xl text-slate-300">−</div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500">現在の積み上げ</div>
                <div className="text-3xl font-bold text-indigo-700">{targetKPIs.currentStack.toFixed(1)}<span className="text-sm text-slate-400 ml-1">億円</span></div>
                <div className="text-[10px] text-slate-400">= 確定{targetKPIs.confirmedYTD.toFixed(0)}億 + 見込み{pipelineWeighted.toFixed(0)}億</div>
              </div>
              <div className="text-2xl text-slate-300">=</div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500">あと必要</div>
                <div className={`text-3xl font-bold ${targetKPIs.newBusinessRequired > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {targetKPIs.newBusinessRequired > 0 ? targetKPIs.newBusinessRequired.toFixed(0) : '0'}<span className="text-sm text-slate-400 ml-1">億円</span>
                </div>
              </div>
            </div>

            {/* プログレスバー（加重ベース） */}
            <div className="mb-4">
              <div className="h-8 bg-slate-100 rounded-lg overflow-hidden flex">
                <div
                  className="bg-slate-800 h-full flex items-center justify-center text-[10px] text-white font-medium"
                  style={{ width: `${(targetKPIs.confirmedYTD / targetKPIs.annualTarget) * 100}%` }}
                >
                  確定
                </div>
                {pipelineStages.map(stage => {
                  const data = pipelineSummary.find(s => s.stage === stage.id);
                  const weighted = (data?.totalAmount || 0) * (stage.probability / 100);
                  const widthPct = (weighted / targetKPIs.annualTarget) * 100;
                  if (widthPct < 1) return null;
                  return (
                    <div
                      key={stage.id}
                      className={`${stage.bgColor} h-full flex items-center justify-center text-[10px] font-medium ${stage.color}`}
                      style={{ width: `${widthPct}%` }}
                    >
                      {widthPct > 4 && `${stage.id}`}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0</span>
                <span>達成率 {targetKPIs.achievementRate.toFixed(0)}%</span>
                <span>{targetKPIs.annualTarget}億</span>
              </div>
            </div>

            {/* 積み上げ内訳テーブル */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">パイプライン内訳</span>
              <span className="text-[10px] text-slate-400">Sales Insight {pipelineAsOf} 時点</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 border-b border-slate-200">
                  <th className="py-1 text-left font-medium">区分</th>
                  <th className="py-1 text-right font-medium">案件総額</th>
                  <th className="py-1 text-right font-medium">確率</th>
                  <th className="py-1 text-right font-medium">見込み（加重）</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <td className="py-2 font-medium text-slate-800">確定売上</td>
                  <td className="py-2 text-right font-bold">{targetKPIs.confirmedYTD.toFixed(1)}億</td>
                  <td className="py-2 text-right text-slate-400">100%</td>
                  <td className="py-2 text-right font-bold text-slate-800">{targetKPIs.confirmedYTD.toFixed(1)}億</td>
                </tr>
                {pipelineStages.map(stage => {
                  const data = pipelineSummary.find(s => s.stage === stage.id);
                  const raw = data?.totalAmount || 0;
                  const weighted = raw * (stage.probability / 100);
                  return (
                    <tr key={stage.id} className="border-b border-slate-100">
                      <td className="py-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${stage.bgColor} ${stage.color}`}>{stage.id}</span>
                        <span className="text-slate-500 ml-1 text-xs">{data?.count || 0}件</span>
                      </td>
                      <td className="py-2 text-right text-slate-600">{raw.toFixed(1)}億</td>
                      <td className="py-2 text-right text-slate-400">×{stage.probability}%</td>
                      <td className={`py-2 text-right font-medium ${stage.color}`}>{weighted.toFixed(1)}億</td>
                    </tr>
                  );
                })}
                <tr className="bg-indigo-50 font-bold">
                  <td className="py-2 text-indigo-800">合計（積み上げ）</td>
                  <td className="py-2 text-right text-slate-600">{(targetKPIs.confirmedYTD + pipelineGross).toFixed(1)}億</td>
                  <td className="py-2 text-right"></td>
                  <td className="py-2 text-right text-indigo-700">{targetKPIs.currentStack.toFixed(1)}億</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* KPIジャンル別 */}
          <div className="space-y-3">
            {groupedKPIs.map(group => (
              <div key={group.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* グループヘッダー */}
                <div className={`px-3 py-2 bg-${group.color}-50 border-b border-${group.color}-100 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold text-${group.color}-800`}>{group.label}</span>
                    <span className="text-[10px] text-slate-400">→ {group.owner}</span>
                  </div>
                </div>

                {/* KPIテーブル */}
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-[10px] text-slate-500">
                      <th className="py-1.5 px-2 text-left font-medium">指標</th>
                      <th className="py-1.5 px-2 text-right font-medium">当月</th>
                      <th className="py-1.5 px-2 text-right font-medium">予算</th>
                      <th className="py-1.5 px-2 text-right font-medium">差異</th>
                      <th className="py-1.5 px-2 text-right font-medium">累計</th>
                      <th className="py-1.5 px-2 text-center font-medium w-14">状況</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.kpis.map(kpi => {
                      const curr = currentData?.kpis[kpi.id];
                      const ytd = ytdData[kpi.id];
                      const status = curr ? getKPIStatus(curr.varianceRate, kpi.isHigherBetter) : 'pending';
                      const statusCfg = statusConfig[status];

                      return (
                        <tr key={kpi.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="py-1.5 px-2">
                            <div className="flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.bg}`} />
                              <span className="font-medium text-slate-800 text-xs">{kpi.name}</span>
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <span className="font-semibold">{fmt(curr?.actual ?? null, kpi.unit)}</span>
                            <span className="text-slate-400 text-[10px] ml-0.5">{kpi.unit}</span>
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-400 text-[10px]">
                            {curr ? fmt(curr.budget, kpi.unit) : '-'}
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <span className={`text-[10px] font-medium ${varColor(curr?.varianceRate ?? null, kpi.isHigherBetter)}`}>
                              {curr?.varianceRate !== null && curr?.varianceRate !== undefined ? `${curr.varianceRate >= 0 ? '+' : ''}${curr.varianceRate.toFixed(1)}%` : '-'}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right font-medium text-xs">
                            {fmt(ytd?.actual ?? null, kpi.unit)}
                          </td>
                          <td className="py-1.5 px-2 text-center">
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
            ))}
          </div>

          {/* 未確定月 */}
          {!currentData?.isClosed && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center text-sm text-slate-500">
              {selectedMonth}月はまだ月次締めが完了していません
            </div>
          )}
        </>
      )}
    </div>
  );
}
