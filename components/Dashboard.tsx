'use client';

import { useState } from 'react';
import ExecutiveSummary from '@/components/ExecutiveSummary';
import KPISummary from '@/components/KPISummary';
import PerformanceHeatmap from '@/components/PerformanceHeatmap';
import BranchComparison from '@/components/BranchComparison';
import SegmentAnalysis from '@/components/SegmentAnalysis';
import RemainingWork from '@/components/RemainingWork';
import ProfitImprovement from '@/components/ProfitImprovement';
import SalesSimulation from '@/components/SalesSimulation';
import ActionTracker from '@/components/ActionTracker';
import ActionSummaryWidget from '@/components/ActionSummaryWidget';
import NotificationSystem from '@/components/NotificationSystem';
import { PerformanceData } from '@/lib/types';
import { DashboardData } from '@/lib/processData';

interface DashboardProps {
  data: PerformanceData;
  diData?: DashboardData;
}

const tabs = [
  {
    id: 'summary',
    label: 'サマリー',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'branch',
    label: '支社分析',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'segment',
    label: 'セグメント',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
  },
  {
    id: 'remaining',
    label: 'バックログ',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'simulation',
    label: '売上予測',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    id: 'action',
    label: 'アクション',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

function formatCurrency(value: number): string {
  return (value / 100000000).toFixed(1) + '億';
}

function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

function getStatusColor(achievement: number): string {
  if (achievement >= 100) return 'text-emerald-600';
  if (achievement >= 90) return 'text-amber-600';
  return 'text-red-600';
}

function getStatusBg(achievement: number): string {
  if (achievement >= 100) return 'bg-emerald-50 border-emerald-200';
  if (achievement >= 90) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function formatDICurrency(value: number): string {
  if (Math.abs(value) >= 1000000000) {
    return (value / 1000000000).toFixed(1) + 'B';
  }
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(0) + 'M';
  }
  return (value / 1000).toFixed(0) + 'K';
}

export default function Dashboard({ data, diData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('summary');

  const revenueAchievement = (data.summary.totalRevenue / data.targets.revenue) * 100;
  const profitAchievement = (data.summary.totalGrossProfit / data.targets.grossProfit) * 100;
  const marginAchievement = (data.summary.grossMarginRate / data.targets.grossMarginRate) * 100;

  const revenueYoY = ((data.summary.totalRevenue - data.summary.previousYearRevenue) / data.summary.previousYearRevenue) * 100;
  const profitYoY = ((data.summary.totalGrossProfit - data.summary.previousYearGrossProfit) / data.summary.previousYearGrossProfit) * 100;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 flex-shrink-0 shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  InsightBI 業績ダッシュボード
                </h1>
                <p className="text-xs text-slate-500">
                  {data.summary.fiscalYear} - {data.summary.asOfDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Tab Navigation */}
              <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    <span className="w-4 h-4">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* Notification Bell */}
              <NotificationSystem
                onNavigateToAction={(actionId) => {
                  setActiveTab('action');
                  // In a real app, you would also scroll to / highlight the specific action
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* KPI Strip */}
      <div className="bg-white border-b border-slate-200 flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 売上高 */}
            <div className={`p-3 rounded-lg border ${getStatusBg(revenueAchievement)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">売上高</span>
                <span className={`text-xs font-bold ${getStatusColor(revenueAchievement)}`}>
                  {revenueAchievement.toFixed(0)}%
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(data.summary.totalRevenue)}</p>
              <p className={`text-xs ${revenueYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {revenueYoY >= 0 ? '▲' : '▼'} 前年比 {revenueYoY >= 0 ? '+' : ''}{revenueYoY.toFixed(1)}%
              </p>
            </div>

            {/* 粗利益 */}
            <div className={`p-3 rounded-lg border ${getStatusBg(profitAchievement)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">粗利益</span>
                <span className={`text-xs font-bold ${getStatusColor(profitAchievement)}`}>
                  {profitAchievement.toFixed(0)}%
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(data.summary.totalGrossProfit)}</p>
              <p className={`text-xs ${profitYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {profitYoY >= 0 ? '▲' : '▼'} 前年比 {profitYoY >= 0 ? '+' : ''}{profitYoY.toFixed(1)}%
              </p>
            </div>

            {/* 粗利率 */}
            <div className={`p-3 rounded-lg border ${getStatusBg(marginAchievement)}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">粗利率</span>
                <span className={`text-xs font-bold ${getStatusColor(marginAchievement)}`}>
                  目標{data.targets.grossMarginRate}%
                </span>
              </div>
              <p className="text-lg font-bold text-slate-800">{formatPercent(data.summary.grossMarginRate)}</p>
              <p className="text-xs text-slate-500">
                前年 {formatPercent(data.summary.previousYearGrossProfit / data.summary.previousYearRevenue * 100)}
              </p>
            </div>

            {/* バックログ */}
            <div className="p-3 rounded-lg border bg-slate-50 border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">バックログ</span>
                <span className="text-xs text-slate-400">受注残</span>
              </div>
              <p className="text-lg font-bold text-slate-800">{formatCurrency(data.summary.totalRemainingWork)}</p>
              <p className="text-xs text-slate-500">
                目安: {formatCurrency(data.targets.remainingWork)}
              </p>
            </div>

            {/* 問題エリア数 */}
            <div className="p-3 rounded-lg border bg-red-50 border-red-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">要注意エリア</span>
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-red-600">
                {data.branchPerformance.filter(b => b.total.grossMargin < data.thresholds.marginWarning).length}
              </p>
              <p className="text-xs text-slate-500">支社（粗利率10%未満）</p>
            </div>

            {/* 目標達成見込み */}
            <div className={`p-3 rounded-lg border ${
              revenueAchievement >= 95 && profitAchievement >= 95
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">総合評価</span>
                {revenueAchievement >= 95 && profitAchievement >= 95 ? (
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <p className={`text-lg font-bold ${
                revenueAchievement >= 95 && profitAchievement >= 95 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {revenueAchievement >= 95 && profitAchievement >= 95 ? '順調' : '要注意'}
              </p>
              <p className="text-xs text-slate-500">
                {revenueAchievement >= 95 && profitAchievement >= 95
                  ? '計画通り推移'
                  : '改善策が必要'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Height */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-full mx-auto px-4 sm:px-6 py-4 h-full">
          {/* サマリータブ */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full">
              {/* Left: Executive Summary */}
              <div className="xl:col-span-2 overflow-auto space-y-4">
                <ExecutiveSummary
                  summary={data.summary}
                  targets={data.targets}
                  thresholds={data.thresholds}
                  branchPerformance={data.branchPerformance}
                  salesSimulation={data.salesSimulation}
                />

                {/* DI Summary Panel */}
                {diData && diData.projects.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        プロジェクトサマリー
                      </h3>
                      <span className="text-xs text-slate-400">見込み分析</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                        <span className="text-xs text-indigo-600 font-medium">案件数</span>
                        <p className="text-2xl font-bold text-indigo-700">{diData.summary.projectCount}<span className="text-sm text-indigo-500">件</span></p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <span className="text-xs text-slate-600 font-medium">見通し請負高</span>
                        <p className="text-2xl font-bold text-slate-800">{formatDICurrency(diData.summary.totalContractAmount)}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                        <span className="text-xs text-emerald-600 font-medium">見通し粗利益</span>
                        <p className="text-2xl font-bold text-emerald-700">{formatDICurrency(diData.summary.totalGrossProfit)}</p>
                      </div>
                      <div className={`rounded-lg p-3 border ${
                        diData.summary.avgMarginRate >= 10
                          ? 'bg-emerald-50 border-emerald-100'
                          : diData.summary.avgMarginRate >= 5
                            ? 'bg-amber-50 border-amber-100'
                            : 'bg-red-50 border-red-100'
                      }`}>
                        <span className="text-xs text-slate-600 font-medium">平均粗利率</span>
                        <p className={`text-2xl font-bold ${
                          diData.summary.avgMarginRate >= 10
                            ? 'text-emerald-700'
                            : diData.summary.avgMarginRate >= 5
                              ? 'text-amber-700'
                              : 'text-red-700'
                        }`}>{diData.summary.avgMarginRate.toFixed(1)}%</p>
                      </div>
                    </div>

                    {/* Status summary */}
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-600">良好</span>
                        <span className="font-medium text-slate-800">{diData.summary.goodCount}件</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        <span className="text-slate-600">注意</span>
                        <span className="font-medium text-slate-800">{diData.summary.warningCount}件</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <span className="text-slate-600">要対応</span>
                        <span className="font-medium text-slate-800">{diData.summary.criticalCount}件</span>
                      </div>
                      <div className="flex-1"></div>
                      <div className="h-2 flex-1 max-w-xs bg-slate-200 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${diData.summary.projectCount > 0 ? (diData.summary.goodCount / diData.summary.projectCount) * 100 : 0}%` }} />
                        <div className="bg-amber-500 h-full" style={{ width: `${diData.summary.projectCount > 0 ? (diData.summary.warningCount / diData.summary.projectCount) * 100 : 0}%` }} />
                        <div className="bg-red-500 h-full" style={{ width: `${diData.summary.projectCount > 0 ? (diData.summary.criticalCount / diData.summary.projectCount) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Right: KPI Cards + Action Widget */}
              <div className="space-y-4">
                <KPISummary
                  summary={data.summary}
                  targets={data.targets}
                  thresholds={data.thresholds}
                />
                <ActionSummaryWidget
                  onNavigateToActions={() => setActiveTab('action')}
                />
              </div>
            </div>
          )}

          {/* 支社分析タブ */}
          {activeTab === 'branch' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <PerformanceHeatmap
                branchPerformance={data.branchPerformance}
                thresholds={data.thresholds}
              />
              <BranchComparison branchPerformance={data.branchPerformance} />
            </div>
          )}

          {/* セグメントタブ */}
          {activeTab === 'segment' && (
            <div className="grid grid-cols-1 gap-4">
              <SegmentAnalysis branchPerformance={data.branchPerformance} />
            </div>
          )}

          {/* バックログタブ */}
          {activeTab === 'remaining' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <RemainingWork remainingWork={data.remainingWork} />
              <ProfitImprovement profitImprovement={data.profitImprovement} />
            </div>
          )}

          {/* 売上予測タブ */}
          {activeTab === 'simulation' && (
            <div className="grid grid-cols-1 gap-4">
              <SalesSimulation salesSimulation={data.salesSimulation} />
            </div>
          )}

          {/* アクションタブ */}
          {activeTab === 'action' && (
            <div className="h-full">
              <ActionTracker data={data} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
