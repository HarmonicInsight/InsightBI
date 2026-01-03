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
import {
  pipelineStages,
  calculatePipelineSummary,
  getWeightedTotal,
  getGrossTotal,
} from '@/lib/pipelineData';
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

  // パイプライン（Sales Insightから取得）
  const pipelineSummary = useMemo(() => calculatePipelineSummary(), []);
  const pipelineWeighted = useMemo(() => getWeightedTotal(), []);
  const pipelineGross = useMemo(() => getGrossTotal(), []);

  // 3レイヤー売上計算
  const threeLayerRevenue = useMemo(() => {
    const accountingRevenue = summary.revenueYTD || 0; // 会計売上（確定）
    const managementRevenue = (summary.forecast || 0) + pipelineWeighted; // 経営売上（見込み込み）
    const cashRevenue = currentData?.kpis.cash?.actual || 0; // 現金（キャッシュポジション）

    return { accountingRevenue, managementRevenue, cashRevenue };
  }, [summary, pipelineWeighted, currentData]);

  // 9つのKPI計算
  const nineKPIs = useMemo(() => {
    const targetGap = fyBudget.revenue - (summary.forecast || 0);
    const pipelineA = pipelineSummary.find(s => s.stage === 'A')?.totalAmount || 0;
    const pipelineB = pipelineSummary.find(s => s.stage === 'B')?.totalAmount || 0;
    const qualityRatio = pipelineGross > 0 ? ((pipelineA + pipelineB) / pipelineGross) * 100 : 0;

    return {
      landingForecast: summary.forecast || 0,
      targetGap,
      confirmedRevenue: summary.revenueYTD || 0,
      pipelineQuality: qualityRatio,
      newCustomerRatio: 35, // サンプル値
      upsellPotential: 12.5, // サンプル値
      marginDegradation: currentData?.kpis.project_margin?.varianceRate || 0,
      costVsProgress: -8.5, // サンプル値（原価超過率）
      concentrationRisk: 28, // サンプル値（上位3案件の売上比率）
    };
  }, [summary, pipelineSummary, pipelineGross, currentData]);

  // 翻訳カード（現場→経営への翻訳）
  const translations = useMemo(() => {
    const items: { field: string; accounting: string; management: string; severity: 'info' | 'warning' | 'critical' }[] = [];

    // 赤字PJがある場合
    const redProjects = currentData?.kpis.red_projects?.actual || 0;
    if (redProjects > 0) {
      items.push({
        field: `${redProjects}件のPJで原価超過`,
        accounting: '未成工事支出金 増加',
        management: 'このまま行くと赤字確定',
        severity: 'critical',
      });
    }

    // 粗利率が低下している
    const marginVar = currentData?.kpis.project_margin?.varianceRate;
    if (marginVar && marginVar < -10) {
      items.push({
        field: 'PJ平均粗利率が低下',
        accounting: '原価率 上昇',
        management: '利益が削られている',
        severity: 'warning',
      });
    }

    // パイプラインが豊富
    if (pipelineGross > fyBudget.revenue * 0.8) {
      items.push({
        field: `パイプライン ${pipelineGross.toFixed(0)}億円`,
        accounting: '見込み案件 多数',
        management: '攻め時。営業リソース集中を',
        severity: 'info',
      });
    }

    // 売上未達
    if (nineKPIs.targetGap > 0) {
      items.push({
        field: `目標まであと${nineKPIs.targetGap.toFixed(1)}億円`,
        accounting: '売上未達の見込み',
        management: 'パイプライン刈り取りが必要',
        severity: nineKPIs.targetGap > 20 ? 'critical' : 'warning',
      });
    }

    return items;
  }, [currentData, pipelineGross, nineKPIs]);

  const isTableView = viewMode === 'table';

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">月次フォロー</h1>
          <p className="text-xs text-slate-500">確定する前に判断する経営ダッシュボード</p>
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

      {/* ★ 3レイヤー売上（核心コンセプト） */}
      <div className="bg-slate-900 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-sm font-bold">売上を3つの状態で見る</div>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">管理会計中心</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* 会計売上 */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-600 text-slate-300">会計</span>
              <span className="text-[10px] text-slate-400">Accounting</span>
            </div>
            <div className="text-2xl font-bold">{threeLayerRevenue.accountingRevenue.toFixed(1)}<span className="text-sm ml-1 text-slate-400">億円</span></div>
            <div className="text-[10px] text-slate-500 mt-1">確定済み・財務諸表と一致</div>
          </div>

          {/* 経営売上（メイン） */}
          <div className="bg-indigo-600 rounded-lg p-3 ring-2 ring-indigo-400">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500 text-white font-bold">経営</span>
              <span className="text-[10px] text-indigo-200">Management</span>
            </div>
            <div className="text-2xl font-bold">{threeLayerRevenue.managementRevenue.toFixed(1)}<span className="text-sm ml-1 text-indigo-200">億円</span></div>
            <div className="text-[10px] text-indigo-200 mt-1">意思決定の主役・見込み込み</div>
          </div>

          {/* 現金売上 */}
          <div className="bg-slate-800 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-600 text-white">現金</span>
              <span className="text-[10px] text-slate-400">Cash</span>
            </div>
            <div className="text-2xl font-bold">{threeLayerRevenue.cashRevenue.toFixed(1)}<span className="text-sm ml-1 text-slate-400">億円</span></div>
            <div className="text-[10px] text-slate-500 mt-1">現預金残高・資金繰り警戒</div>
          </div>
        </div>
      </div>

      {/* ★ 9つのKPI */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-slate-800">目標達成を判断する9指標</div>
          <span className="text-[10px] text-slate-400">見た瞬間に判断できる</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {/* 1. 着地売上見込み */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[10px] text-indigo-600 font-bold mb-1">01 着地売上見込み</div>
            <div className="text-xl font-bold text-slate-800">{nineKPIs.landingForecast.toFixed(1)}<span className="text-xs text-slate-400 ml-1">億</span></div>
            <div className="text-[10px] text-slate-500">確度加重で算出</div>
          </div>

          {/* 2. 売上目標ギャップ */}
          <div className={`rounded-lg p-3 ${nineKPIs.targetGap > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <div className="text-[10px] text-indigo-600 font-bold mb-1">02 売上目標ギャップ</div>
            <div className={`text-xl font-bold ${nineKPIs.targetGap > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {nineKPIs.targetGap > 0 ? '-' : '+'}{Math.abs(nineKPIs.targetGap).toFixed(1)}<span className="text-xs text-slate-400 ml-1">億</span>
            </div>
            <div className="text-[10px] text-slate-500">今後積むべき売上</div>
          </div>

          {/* 3. 確定売上 */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[10px] text-indigo-600 font-bold mb-1">03 確定売上</div>
            <div className="text-xl font-bold text-slate-800">{nineKPIs.confirmedRevenue.toFixed(1)}<span className="text-xs text-slate-400 ml-1">億</span></div>
            <div className="text-[10px] text-slate-500">受注済み・守るべき</div>
          </div>

          {/* 4. 見込み売上の質 */}
          <div className={`rounded-lg p-3 ${nineKPIs.pipelineQuality >= 50 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <div className="text-[10px] text-indigo-600 font-bold mb-1">04 見込み売上の質</div>
            <div className="text-xl font-bold text-slate-800">{nineKPIs.pipelineQuality.toFixed(0)}<span className="text-xs text-slate-400 ml-1">%</span></div>
            <div className="text-[10px] text-slate-500">A+B案件の比率</div>
          </div>

          {/* 5. 新規売上比率 */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[10px] text-indigo-600 font-bold mb-1">05 新規売上比率</div>
            <div className="text-xl font-bold text-slate-800">{nineKPIs.newCustomerRatio}<span className="text-xs text-slate-400 ml-1">%</span></div>
            <div className="text-[10px] text-slate-500">成長構造の依存度</div>
          </div>

          {/* 6. 既存追加余地 */}
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-[10px] text-indigo-600 font-bold mb-1">06 既存顧客の追加余地</div>
            <div className="text-xl font-bold text-slate-800">{nineKPIs.upsellPotential}<span className="text-xs text-slate-400 ml-1">億</span></div>
            <div className="text-[10px] text-slate-500">最短で積める領域</div>
          </div>

          {/* 7. 粗利率の劣化 */}
          <div className={`rounded-lg p-3 ${nineKPIs.marginDegradation >= -5 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className="text-[10px] text-indigo-600 font-bold mb-1">07 案件別粗利率の劣化</div>
            <div className={`text-xl font-bold ${nineKPIs.marginDegradation >= -5 ? 'text-emerald-600' : 'text-red-600'}`}>
              {nineKPIs.marginDegradation >= 0 ? '+' : ''}{nineKPIs.marginDegradation.toFixed(1)}<span className="text-xs text-slate-400 ml-1">%</span>
            </div>
            <div className="text-[10px] text-slate-500">利益を失っていないか</div>
          </div>

          {/* 8. 原価消化 vs 進捗 */}
          <div className={`rounded-lg p-3 ${nineKPIs.costVsProgress >= -5 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className="text-[10px] text-indigo-600 font-bold mb-1">08 原価消化 vs 進捗</div>
            <div className={`text-xl font-bold ${nineKPIs.costVsProgress >= -5 ? 'text-emerald-600' : 'text-red-600'}`}>
              {nineKPIs.costVsProgress >= 0 ? '+' : ''}{nineKPIs.costVsProgress.toFixed(1)}<span className="text-xs text-slate-400 ml-1">%</span>
            </div>
            <div className="text-[10px] text-slate-500">赤字化の予兆</div>
          </div>

          {/* 9. 集中度 */}
          <div className={`rounded-lg p-3 ${nineKPIs.concentrationRisk <= 30 ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <div className="text-[10px] text-indigo-600 font-bold mb-1">09 売上・案件の集中度</div>
            <div className="text-xl font-bold text-slate-800">{nineKPIs.concentrationRisk}<span className="text-xs text-slate-400 ml-1">%</span></div>
            <div className="text-[10px] text-slate-500">依存リスク（Top3比率）</div>
          </div>
        </div>
      </div>

      {/* ★ 翻訳カード（現場→経営） */}
      {translations.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-bold text-slate-800">現場 → 経営への翻訳</div>
            <span className="text-[10px] text-slate-400">何が起きているか、一目でわかる</span>
          </div>
          <div className="space-y-2">
            {translations.map((t, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
                t.severity === 'critical' ? 'bg-red-50' :
                t.severity === 'warning' ? 'bg-amber-50' : 'bg-blue-50'
              }`}>
                <div className={`w-1 h-10 rounded-full ${
                  t.severity === 'critical' ? 'bg-red-500' :
                  t.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 text-xs">
                  <div className="text-slate-500">{t.field}</div>
                  <div className="text-slate-400 text-[10px]">{t.accounting}</div>
                </div>
                <div className="text-xs">→</div>
                <div className={`flex-1 text-sm font-medium ${
                  t.severity === 'critical' ? 'text-red-700' :
                  t.severity === 'warning' ? 'text-amber-700' : 'text-blue-700'
                }`}>
                  {t.management}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 通期見込 + パイプライン */}
      <div className="grid grid-cols-2 gap-3">
        {/* 通期見込（左） */}
        <div className={`rounded-lg p-4 ${summary.forecast != null ? (summary.forecastRate != null && summary.forecastRate >= -5 ? 'bg-emerald-50' : 'bg-red-50') : 'bg-slate-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-700">通期見込（実績ベース）</div>
            <div className="text-[10px] text-slate-400">予算: {fyBudget.revenue}億円</div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold">{summary.forecast != null ? `${summary.forecast.toFixed(1)}` : '-'}</div>
            <span className="text-sm text-slate-500">億円</span>
            {summary.forecastRate != null && (
              <span className={`text-sm font-medium ${summary.forecastRate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ({summary.forecastRate >= 0 ? '+' : ''}{summary.forecastRate.toFixed(1)}%)
              </span>
            )}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">
            確定売上 + 残り月平均予算
          </div>
        </div>

        {/* パイプライン積み上げ（右） */}
        <div className="rounded-lg p-4 bg-indigo-50 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-indigo-800">案件パイプライン</div>
            <div className="text-[10px] text-indigo-400">from Sales Insight</div>
          </div>
          <div className="flex items-baseline gap-2 mb-3">
            <div className="text-3xl font-bold text-indigo-700">{pipelineWeighted.toFixed(1)}</div>
            <span className="text-sm text-indigo-500">億円</span>
            <span className="text-[10px] text-indigo-400">（加重見込）</span>
          </div>

          {/* ABCD内訳 */}
          <div className="space-y-1.5">
            {pipelineStages.map(stage => {
              const data = pipelineSummary.find(s => s.stage === stage.id);
              const barWidth = data ? (data.totalAmount / pipelineGross) * 100 : 0;
              return (
                <div key={stage.id} className="flex items-center gap-2 text-xs">
                  <span className={`w-16 flex items-center gap-1 ${stage.color}`}>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${stage.bgColor}`}>
                      {stage.id}
                    </span>
                    <span>{stage.probability}%</span>
                  </span>
                  <div className="flex-1 h-4 bg-white/60 rounded overflow-hidden">
                    <div
                      className={`h-full ${stage.bgColor}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-medium text-slate-700">
                    {data?.totalAmount.toFixed(1) || '0'}億
                  </span>
                  <span className="w-8 text-right text-slate-400">
                    {data?.count || 0}件
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-indigo-200 flex justify-between text-xs">
            <span className="text-indigo-600">グロス合計</span>
            <span className="font-bold text-indigo-700">{pipelineGross.toFixed(1)}億円</span>
          </div>
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
