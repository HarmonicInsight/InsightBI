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
  calculatePipelineSummaryByMonth,
  getWeightedTotal,
  getGrossTotal,
  pipelineAsOf,
  calculateDepartmentSummaries,
  calculateDepartmentSummariesByMonth,
  getPipelineByMonth,
  PipelineStage,
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

interface MonthlyFollowDashboardProps {
  onNavigateToPipeline?: (filter: { departmentId?: string; stage?: PipelineStage }) => void;
}

type PipelineViewMode = 'annual' | 'monthly';

export default function MonthlyFollowDashboard({ onNavigateToPipeline }: MonthlyFollowDashboardProps) {
  const currentClosedMonth = getCurrentClosedMonth();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedMonth, setSelectedMonth] = useState(currentClosedMonth);
  const [pipelineViewMode, setPipelineViewMode] = useState<PipelineViewMode>('annual');

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

  // パイプライン（Sales Insightから取得）- 通期全体
  const pipelineSummary = useMemo(() => calculatePipelineSummary(), []);
  const pipelineWeighted = useMemo(() => getWeightedTotal(), []);
  const pipelineGross = useMemo(() => getGrossTotal(), []);

  // 選択月のパイプライン
  const monthlyPipelineSummary = useMemo(() =>
    calculatePipelineSummaryByMonth(selectedMonth), [selectedMonth]);
  const monthlyPipelineItems = useMemo(() =>
    getPipelineByMonth(selectedMonth), [selectedMonth]);
  const monthlyPipelineWeighted = useMemo(() =>
    monthlyPipelineSummary.reduce((sum, s) => sum + s.weightedAmount, 0), [monthlyPipelineSummary]);
  const monthlyPipelineGross = useMemo(() =>
    monthlyPipelineSummary.reduce((sum, s) => sum + s.totalAmount, 0), [monthlyPipelineSummary]);

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

  // 部署別サマリー（通期/月別）
  const departmentSummaries = useMemo(() => calculateDepartmentSummaries(), []);
  const monthlyDepartmentSummaries = useMemo(() =>
    calculateDepartmentSummariesByMonth(selectedMonth), [selectedMonth]);

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

            {/* 積み上げ累積テーブル */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-600">目標達成までの積み上げ</span>
              <span className="text-[10px] text-slate-400">Sales Insight {pipelineAsOf} 時点</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-slate-500 border-b border-slate-200">
                  <th className="py-1 text-left font-medium">段階</th>
                  <th className="py-1 text-right font-medium">この段階</th>
                  <th className="py-1 text-right font-medium">累積見込み</th>
                  <th className="py-1 text-right font-medium">達成率</th>
                  <th className="py-1 text-left font-medium pl-3">状況</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let cumulative = targetKPIs.confirmedYTD;
                  const rows = [];

                  // 確定売上
                  const confirmedRate = (cumulative / targetKPIs.annualTarget) * 100;
                  rows.push(
                    <tr key="confirmed" className="border-b border-slate-100 bg-slate-50">
                      <td className="py-2 font-medium text-slate-800">確定のみ</td>
                      <td className="py-2 text-right">{targetKPIs.confirmedYTD.toFixed(1)}億</td>
                      <td className="py-2 text-right font-bold">{cumulative.toFixed(1)}億</td>
                      <td className="py-2 text-right font-medium">{confirmedRate.toFixed(0)}%</td>
                      <td className="py-2 pl-3 text-xs text-slate-500">継続分</td>
                    </tr>
                  );

                  // A〜D累積
                  pipelineStages.forEach((stage, idx) => {
                    const data = pipelineSummary.find(s => s.stage === stage.id);
                    const weighted = (data?.totalAmount || 0) * (stage.probability / 100);
                    cumulative += weighted;
                    const rate = (cumulative / targetKPIs.annualTarget) * 100;
                    const isLowProb = stage.probability <= 20;
                    const reachedTarget = cumulative >= targetKPIs.annualTarget;

                    rows.push(
                      <tr key={stage.id} className={`border-b border-slate-100 ${isLowProb ? 'bg-amber-50' : ''}`}>
                        <td className="py-2">
                          <span className="text-slate-600">〜</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${stage.bgColor} ${stage.color} ml-1`}>{stage.id}</span>
                          <span className="text-slate-400 text-[10px] ml-1">({stage.probability}%)</span>
                        </td>
                        <td className="py-2 text-right text-slate-500">+{weighted.toFixed(1)}億</td>
                        <td className={`py-2 text-right font-bold ${reachedTarget ? 'text-emerald-600' : ''}`}>{cumulative.toFixed(1)}億</td>
                        <td className={`py-2 text-right font-medium ${rate >= 100 ? 'text-emerald-600' : rate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                          {rate.toFixed(0)}%
                        </td>
                        <td className="py-2 pl-3 text-xs">
                          {reachedTarget ? (
                            <span className="text-emerald-600 font-medium">達成ライン</span>
                          ) : isLowProb ? (
                            <span className="text-amber-600 font-medium">要刈り取り</span>
                          ) : (
                            <span className="text-slate-400">{data?.count || 0}件</span>
                          )}
                        </td>
                      </tr>
                    );
                  });

                  return rows;
                })()}
              </tbody>
            </table>
            {targetKPIs.newBusinessRequired > 0 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                ⚠ 全パイプライン込みでも <span className="font-bold">{targetKPIs.newBusinessRequired.toFixed(0)}億円</span> 不足。新規案件の獲得が必要。
              </div>
            )}
          </div>

          {/* 月別売上サマリー */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-800">月別売上実績</h2>
              <div className="text-xs text-slate-500">
                累計: <span className="font-bold text-indigo-600">{(summary.revenueYTD || 0).toFixed(1)}億</span>
                <span className="text-slate-400 mx-1">/</span>
                通期目標: <span className="font-bold">{fyBudget.revenue}億</span>
              </div>
            </div>

            {/* 12ヶ月グリッド */}
            <div className="grid grid-cols-12 gap-1 mb-2">
              {monthOrder.map(m => {
                const data = monthlyDataset.find(d => d.month === m);
                const revenue = data?.kpis.revenue;
                const budget = revenue?.budget || 0;
                const actual = revenue?.actual ?? null;
                const isClosed = data?.isClosed || false;
                const isSelected = selectedMonth === m;

                // バー高さ計算（予算ベースで正規化、最大25億想定）
                const maxHeight = 48;
                const budgetHeight = Math.min((budget / 25) * maxHeight, maxHeight);
                const actualHeight = actual !== null ? Math.min((actual / 25) * maxHeight, maxHeight) : 0;

                // 差異による色分け
                let barColor = 'bg-slate-300';
                if (isClosed && actual !== null) {
                  const variance = actual - budget;
                  if (variance >= 0) barColor = 'bg-emerald-500';
                  else if (variance >= -1) barColor = 'bg-amber-400';
                  else barColor = 'bg-red-400';
                }

                return (
                  <div
                    key={m}
                    className={`flex flex-col items-center cursor-pointer transition-all ${
                      isSelected ? 'scale-110' : 'hover:scale-105'
                    }`}
                    onClick={() => setSelectedMonth(m)}
                  >
                    {/* バーチャート */}
                    <div className="relative w-full h-12 flex items-end justify-center gap-0.5">
                      {/* 予算バー */}
                      <div
                        className="w-2 bg-slate-200 rounded-t"
                        style={{ height: `${budgetHeight}px` }}
                        title={`予算: ${budget.toFixed(1)}億`}
                      />
                      {/* 実績バー */}
                      <div
                        className={`w-2 rounded-t ${isClosed ? barColor : 'bg-slate-100'}`}
                        style={{ height: `${actualHeight}px` }}
                        title={actual !== null ? `実績: ${actual.toFixed(1)}億` : '未確定'}
                      />
                    </div>
                    {/* 月ラベル */}
                    <div className={`text-[10px] mt-1 ${
                      isSelected ? 'font-bold text-indigo-600' : isClosed ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      {m}月
                    </div>
                    {/* 実績値（あれば） */}
                    <div className={`text-[9px] ${isClosed ? 'text-slate-500' : 'text-slate-300'}`}>
                      {actual !== null ? `${actual.toFixed(0)}` : '-'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 凡例 */}
            <div className="flex items-center justify-end gap-4 text-[10px] text-slate-400 border-t border-slate-100 pt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-200 rounded" />
                <span>予算</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-emerald-500 rounded" />
                <span>達成</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-400 rounded" />
                <span>-1億以内</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-400 rounded" />
                <span>未達</span>
              </div>
            </div>
          </div>

          {/* 当月パイプライン - 月次締めが完了した月のみ表示 */}
          {currentData?.isClosed ? (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-800">{selectedMonth}月 受注見込み案件</h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{monthlyPipelineItems.length}件</span>
                  <span className="text-sm font-bold text-indigo-600">{monthlyPipelineGross.toFixed(1)}億</span>
                  <span className="text-[10px] text-slate-400">（見込み{monthlyPipelineWeighted.toFixed(1)}億）</span>
                </div>
              </div>

              {monthlyPipelineItems.length === 0 ? (
                <div className="text-center py-4 text-sm text-slate-400">
                  {selectedMonth}月に受注予定の案件はありません
                </div>
              ) : (
                <>
                  {/* ステージ別サマリー */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {pipelineStages.map(stage => {
                      const data = monthlyPipelineSummary.find(s => s.stage === stage.id);
                      return (
                        <div key={stage.id} className={`p-2 rounded ${stage.bgColor}`}>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-bold ${stage.color}`}>{stage.id}</span>
                            <span className={`text-xs ${stage.color}`}>{data?.count || 0}件</span>
                          </div>
                          <div className={`text-sm font-bold ${stage.color}`}>{(data?.totalAmount || 0).toFixed(1)}億</div>
                          <div className="text-[10px] text-slate-500">見込{(data?.weightedAmount || 0).toFixed(1)}億</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 案件一覧（コンパクト） */}
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr className="text-slate-500">
                        <th className="py-1.5 px-2 text-left">ステージ</th>
                        <th className="py-1.5 px-2 text-left">案件名</th>
                        <th className="py-1.5 px-2 text-right">金額</th>
                        <th className="py-1.5 px-2 text-left">顧客</th>
                        <th className="py-1.5 px-2 text-left">担当</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyPipelineItems.slice(0, 8).map(item => {
                        const stage = pipelineStages.find(s => s.id === item.stage)!;
                        return (
                          <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                            <td className="py-1.5 px-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${stage.bgColor} ${stage.color}`}>{item.stage}</span>
                            </td>
                            <td className="py-1.5 px-2 font-medium text-slate-800">{item.name}</td>
                            <td className="py-1.5 px-2 text-right font-bold">{item.amount.toFixed(1)}億</td>
                            <td className="py-1.5 px-2 text-slate-500">{item.customer}</td>
                            <td className="py-1.5 px-2 text-slate-500">{item.owner}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {monthlyPipelineItems.length > 8 && (
                    <div className="text-center text-xs text-slate-400 mt-2">
                      他 {monthlyPipelineItems.length - 8} 件
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-4 text-center">
              <div className="text-sm text-slate-500">{selectedMonth}月のパイプラインデータ</div>
              <div className="text-xs text-slate-400 mt-1">月次売上データをインポートするとパイプラインが表示されます</div>
            </div>
          )}

          {/* 部署別ブレイクダウン - 月次締めが完了した月のみ表示 */}
          {currentData?.isClosed && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-800">部署別 パイプライン</h2>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                    {selectedMonth}月受注予定
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">クリックで案件一覧へ</span>
              </div>
              <div className="space-y-3">
                {monthlyDepartmentSummaries.map(dept => {
                  // 当月の案件がない部署はスキップ（または薄く表示）
                  const hasMonthlyItems = dept.pipelineTotal > 0;
                  return (
                    <div
                      key={dept.department.id}
                      className={`border rounded-lg p-3 transition-colors cursor-pointer ${
                        hasMonthlyItems
                          ? 'border-slate-100 hover:border-indigo-200'
                          : 'border-slate-50 bg-slate-50 opacity-60'
                      }`}
                      onClick={() => onNavigateToPipeline?.({ departmentId: dept.department.id })}
                    >
                      {/* 部署ヘッダー */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{dept.department.name}</span>
                          {hasMonthlyItems && dept.pipelineTotal >= 1 && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                              {dept.dealCount}件
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          {hasMonthlyItems ? (
                            <>
                              <span className="text-lg font-bold text-indigo-600">
                                {dept.pipelineTotal.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-400 ml-1">億円</span>
                            </>
                          ) : (
                            <span className="text-sm text-slate-400">案件なし</span>
                          )}
                        </div>
                      </div>

                      {hasMonthlyItems && (
                        <>
                          {/* 当月パイプラインバー */}
                          <div className="h-6 bg-slate-100 rounded overflow-hidden flex mb-2">
                            {dept.stageBreakdown.map(sb => {
                              const stage = pipelineStages.find(s => s.id === sb.stage)!;
                              const widthPct = dept.pipelineTotal > 0 ? (sb.amount / dept.pipelineTotal) * 100 : 0;
                              if (widthPct < 1) return null;
                              return (
                                <div
                                  key={sb.stage}
                                  className={`${stage.bgColor} h-full flex items-center justify-center text-[10px] font-medium ${stage.color} cursor-pointer hover:opacity-80`}
                                  style={{ width: `${widthPct}%` }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToPipeline?.({ departmentId: dept.department.id, stage: sb.stage });
                                  }}
                                  title={`${stage.name}: ${sb.amount.toFixed(1)}億 (見込${sb.weighted.toFixed(1)}億)`}
                                >
                                  {widthPct > 8 && sb.stage}
                                </div>
                              );
                            })}
                          </div>

                          {/* 数値サマリー（当月ベース） */}
                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            <div className="text-center">
                              <div className="text-slate-400">総額</div>
                              <div className="font-bold text-slate-800">{dept.pipelineTotal.toFixed(1)}億</div>
                            </div>
                            <div className="text-center">
                              <div className="text-slate-400">見込み</div>
                              <div className="font-bold text-indigo-600">{dept.pipelineWeighted.toFixed(1)}億</div>
                            </div>
                            <div className="text-center">
                              <div className="text-slate-400">件数</div>
                              <div className="font-bold text-slate-600">{dept.dealCount}件</div>
                            </div>
                          </div>

                          {/* ステージ別内訳（コンパクト） */}
                          <div className="mt-2 flex gap-2">
                            {dept.stageBreakdown.map(sb => {
                              const stage = pipelineStages.find(s => s.id === sb.stage)!;
                              if (sb.amount === 0) return null;
                              return (
                                <button
                                  key={sb.stage}
                                  className={`flex-1 p-1.5 rounded ${stage.bgColor} hover:opacity-80 transition-opacity`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToPipeline?.({ departmentId: dept.department.id, stage: sb.stage });
                                  }}
                                >
                                  <div className={`text-[10px] font-bold ${stage.color}`}>{stage.id}</div>
                                  <div className={`text-xs font-bold ${stage.color}`}>{sb.amount.toFixed(0)}億</div>
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
