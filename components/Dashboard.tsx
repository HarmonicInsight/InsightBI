'use client';

import { useState } from 'react';
import PerformanceHeatmap from '@/components/PerformanceHeatmap';
import BranchComparison from '@/components/BranchComparison';
import SegmentAnalysis from '@/components/SegmentAnalysis';
import RemainingWork from '@/components/RemainingWork';
import ProfitImprovement from '@/components/ProfitImprovement';
import SalesSimulation from '@/components/SalesSimulation';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import { PerformanceData } from '@/lib/types';
import { DashboardData } from '@/lib/processData';

interface DashboardProps {
  data: PerformanceData;
  diData?: DashboardData;
}

type TabId = 'overview' | 'branch' | 'backlog' | 'forecast';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: '概要' },
  { id: 'branch', label: '支社' },
  { id: 'backlog', label: 'バックログ' },
  { id: 'forecast', label: '予測' },
];

function formatCurrency(value: number): string {
  return (value / 100000000).toFixed(1);
}

function getStatusColor(achievement: number): string {
  if (achievement >= 100) return 'text-emerald-600';
  if (achievement >= 90) return 'text-amber-600';
  return 'text-red-600';
}

function getStatusBg(achievement: number): string {
  if (achievement >= 100) return 'bg-emerald-50';
  if (achievement >= 90) return 'bg-amber-50';
  return 'bg-red-50';
}

export default function Dashboard({ data, diData }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const revenueAchievement = (data.summary.totalRevenue / data.targets.revenue) * 100;
  const profitAchievement = (data.summary.totalGrossProfit / data.targets.grossProfit) * 100;
  const revenueYoY = ((data.summary.totalRevenue - data.summary.previousYearRevenue) / data.summary.previousYearRevenue) * 100;
  const profitYoY = ((data.summary.totalGrossProfit - data.summary.previousYearGrossProfit) / data.summary.previousYearGrossProfit) * 100;
  const warningBranches = data.branchPerformance.filter(b => b.total.grossMargin < data.thresholds.marginWarning).length;

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* ヘッダー & タブ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">全社業績</h1>
          <p className="text-xs text-slate-500">{data.summary.fiscalYear} - {data.summary.asOfDate}</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 主要KPI（コンパクト） */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className={`rounded-lg p-3 ${getStatusBg(revenueAchievement)}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">売上高</span>
            <span className={`text-xs font-bold ${getStatusColor(revenueAchievement)}`}>
              {revenueAchievement.toFixed(0)}%
            </span>
          </div>
          <div className="text-xl font-bold text-slate-800">{formatCurrency(data.summary.totalRevenue)}<span className="text-xs font-normal text-slate-500 ml-0.5">億円</span></div>
          <div className={`text-[10px] ${revenueYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            前年比 {revenueYoY >= 0 ? '+' : ''}{revenueYoY.toFixed(1)}%
          </div>
        </div>

        <div className={`rounded-lg p-3 ${getStatusBg(profitAchievement)}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">粗利益</span>
            <span className={`text-xs font-bold ${getStatusColor(profitAchievement)}`}>
              {profitAchievement.toFixed(0)}%
            </span>
          </div>
          <div className="text-xl font-bold text-slate-800">{formatCurrency(data.summary.totalGrossProfit)}<span className="text-xs font-normal text-slate-500 ml-0.5">億円</span></div>
          <div className={`text-[10px] ${profitYoY >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            前年比 {profitYoY >= 0 ? '+' : ''}{profitYoY.toFixed(1)}%
          </div>
        </div>

        <div className="rounded-lg p-3 bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">粗利率</span>
            <span className="text-xs text-slate-400">目標{data.targets.grossMarginRate}%</span>
          </div>
          <div className="text-xl font-bold text-slate-800">{data.summary.grossMarginRate.toFixed(1)}<span className="text-xs font-normal text-slate-500 ml-0.5">%</span></div>
          <div className="text-[10px] text-slate-400">
            前年 {(data.summary.previousYearGrossProfit / data.summary.previousYearRevenue * 100).toFixed(1)}%
          </div>
        </div>

        <div className={`rounded-lg p-3 ${warningBranches > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">要注意</span>
            {warningBranches > 0 ? (
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div className={`text-xl font-bold ${warningBranches > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {warningBranches}<span className="text-xs font-normal text-slate-500 ml-0.5">支社</span>
          </div>
          <div className="text-[10px] text-slate-400">粗利率10%未満</div>
        </div>
      </div>

      {/* タブコンテンツ */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* 支社別ヒートマップ（コンパクト） */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">支社別業績</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-100">
                    <th className="py-2 text-left font-medium">支社</th>
                    <th className="py-2 text-right font-medium">売上</th>
                    <th className="py-2 text-right font-medium">粗利</th>
                    <th className="py-2 text-right font-medium">粗利率</th>
                    <th className="py-2 text-center font-medium">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {data.branchPerformance.slice(0, 6).map(branch => {
                    const margin = branch.total.grossMargin;
                    const status = margin >= 15 ? 'good' : margin >= 10 ? 'warning' : 'critical';
                    return (
                      <tr key={branch.branch} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="py-2 font-medium text-slate-700">{branch.branch}</td>
                        <td className="py-2 text-right text-slate-600">{(branch.total.revenue / 100000000).toFixed(1)}億</td>
                        <td className="py-2 text-right text-slate-600">{(branch.total.grossProfit / 100000000).toFixed(1)}億</td>
                        <td className="py-2 text-right text-slate-600">{margin.toFixed(1)}%</td>
                        <td className="py-2 text-center">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            status === 'good' ? 'bg-emerald-500' :
                            status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* プロジェクトサマリー */}
          {diData && diData.projects.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">プロジェクト状況</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{diData.summary.projectCount}</div>
                  <div className="text-[10px] text-slate-500">案件数</div>
                </div>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(diData.summary.goodCount / diData.summary.projectCount) * 100}%` }} />
                  <div className="bg-amber-500 h-full" style={{ width: `${(diData.summary.warningCount / diData.summary.projectCount) * 100}%` }} />
                  <div className="bg-red-500 h-full" style={{ width: `${(diData.summary.criticalCount / diData.summary.projectCount) * 100}%` }} />
                </div>
                <div className="flex gap-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />{diData.summary.goodCount}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />{diData.summary.warningCount}</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{diData.summary.criticalCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* 時系列チャート（簡易版） */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">売上推移</h3>
            <TimeSeriesChart compact />
          </div>
        </div>
      )}

      {activeTab === 'branch' && (
        <div className="space-y-4">
          <PerformanceHeatmap
            branchPerformance={data.branchPerformance}
            thresholds={data.thresholds}
          />
          <BranchComparison branchPerformance={data.branchPerformance} />
          <SegmentAnalysis branchPerformance={data.branchPerformance} />
        </div>
      )}

      {activeTab === 'backlog' && (
        <div className="space-y-4">
          <RemainingWork remainingWork={data.remainingWork} />
          <ProfitImprovement profitImprovement={data.profitImprovement} />
        </div>
      )}

      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <SalesSimulation salesSimulation={data.salesSimulation} />
          <TimeSeriesChart />
        </div>
      )}
    </div>
  );
}
