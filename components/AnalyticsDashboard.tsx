'use client';

import { useMemo, useState } from 'react';
import {
  monthlyDataset,
  kpiDefinitions,
  monthOrder,
  fyBudget,
} from '@/lib/monthlyData';
import {
  pipelineStages,
  pipelineData,
  calculatePipelineSummary,
  getWeightedTotal,
  getGrossTotal,
  departments,
  calculateDepartmentSummaries,
} from '@/lib/pipelineData';

type ChartType = 'revenue' | 'pipeline' | 'department' | 'kpi';

export default function AnalyticsDashboard() {
  const [activeChart, setActiveChart] = useState<ChartType>('revenue');

  // 月次データ集計
  const monthlyTrends = useMemo(() => {
    return monthOrder.map(month => {
      const data = monthlyDataset.find(d => d.month === month);
      return {
        month,
        label: `${month}月`,
        isClosed: data?.isClosed || false,
        revenue: {
          actual: data?.kpis.revenue?.actual || null,
          budget: data?.kpis.revenue?.budget || 0,
        },
        grossProfit: {
          actual: data?.kpis.gross_profit?.actual || null,
          budget: data?.kpis.gross_profit?.budget || 0,
        },
        orders: {
          actual: data?.kpis.orders?.actual || null,
          budget: data?.kpis.orders?.budget || 0,
        },
      };
    });
  }, []);

  // 累計計算
  const cumulativeData = useMemo(() => {
    let cumActual = 0;
    let cumBudget = 0;
    return monthlyTrends.map(m => {
      if (m.revenue.actual !== null) {
        cumActual += m.revenue.actual;
      }
      cumBudget += m.revenue.budget;
      return {
        month: m.month,
        label: m.label,
        isClosed: m.isClosed,
        cumActual: m.isClosed ? cumActual : null,
        cumBudget,
      };
    });
  }, [monthlyTrends]);

  // パイプラインサマリー
  const pipelineSummary = useMemo(() => calculatePipelineSummary(), []);
  const pipelineWeighted = useMemo(() => getWeightedTotal(), []);
  const pipelineGross = useMemo(() => getGrossTotal(), []);

  // 部署別サマリー
  const departmentSummaries = useMemo(() => calculateDepartmentSummaries(), []);

  // 月別パイプライン分布
  const pipelineByMonth = useMemo(() => {
    const result: Record<number, { gross: number; weighted: number; count: number }> = {};
    for (let m = 1; m <= 12; m++) {
      result[m] = { gross: 0, weighted: 0, count: 0 };
    }
    pipelineData.forEach(item => {
      const stage = pipelineStages.find(s => s.id === item.stage);
      if (stage) {
        result[item.expectedCloseMonth].gross += item.amount;
        result[item.expectedCloseMonth].weighted += item.amount * (stage.probability / 100);
        result[item.expectedCloseMonth].count += 1;
      }
    });
    return result;
  }, []);

  // KPI達成率サマリー
  const kpiSummary = useMemo(() => {
    const closedMonths = monthlyDataset.filter(d => d.isClosed);
    if (closedMonths.length === 0) return [];

    return kpiDefinitions.map(kpi => {
      let totalActual = 0;
      let totalBudget = 0;
      let count = 0;

      closedMonths.forEach(month => {
        const value = month.kpis[kpi.id];
        if (value && value.actual !== null) {
          if (kpi.unit === '%') {
            totalActual += value.actual;
            totalBudget += value.budget;
            count++;
          } else {
            totalActual += value.actual;
            totalBudget += value.budget;
          }
        }
      });

      const actual = kpi.unit === '%' && count > 0 ? totalActual / count : totalActual;
      const budget = kpi.unit === '%' && count > 0 ? totalBudget / count : totalBudget;
      const rate = budget > 0 ? (actual / budget) * 100 : 0;

      return {
        ...kpi,
        actual,
        budget,
        rate,
        isGood: kpi.isHigherBetter ? rate >= 100 : rate <= 100,
      };
    });
  }, []);

  // SVGバーの最大値計算
  const maxRevenue = Math.max(...monthlyTrends.map(m => Math.max(m.revenue.actual || 0, m.revenue.budget)));
  const maxCumulative = Math.max(...cumulativeData.map(m => Math.max(m.cumActual || 0, m.cumBudget)));
  const maxPipelineMonth = Math.max(...Object.values(pipelineByMonth).map(v => v.gross));

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">グラフ集</h1>
          <p className="text-xs text-slate-500">月次・パイプライン統計の可視化</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {[
            { id: 'revenue', label: '売上推移' },
            { id: 'pipeline', label: 'パイプライン' },
            { id: 'department', label: '部署別' },
            { id: 'kpi', label: 'KPI一覧' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id as ChartType)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeChart === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 売上推移 */}
      {activeChart === 'revenue' && (
        <div className="space-y-4">
          {/* 月次売上グラフ */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-4">月次売上 予実比較</h2>
            <div className="h-64 flex items-end gap-2">
              {monthlyTrends.map((m, i) => {
                const budgetHeight = (m.revenue.budget / maxRevenue) * 100;
                const actualHeight = m.revenue.actual !== null ? (m.revenue.actual / maxRevenue) * 100 : 0;
                const isOver = m.revenue.actual !== null && m.revenue.actual >= m.revenue.budget;
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center">
                    <div className="w-full h-48 flex items-end justify-center gap-1">
                      {/* 予算 */}
                      <div
                        className="w-5 bg-slate-200 rounded-t"
                        style={{ height: `${budgetHeight}%` }}
                        title={`予算: ${m.revenue.budget}億`}
                      />
                      {/* 実績 */}
                      {m.isClosed && (
                        <div
                          className={`w-5 rounded-t ${isOver ? 'bg-emerald-500' : 'bg-red-400'}`}
                          style={{ height: `${actualHeight}%` }}
                          title={`実績: ${m.revenue.actual}億`}
                        />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{m.label}</div>
                    {m.isClosed && (
                      <div className={`text-[10px] font-bold ${isOver ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.revenue.actual?.toFixed(1)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-slate-200 rounded" />
                <span className="text-slate-500">予算</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-emerald-500 rounded" />
                <span className="text-slate-500">実績（達成）</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span className="text-slate-500">実績（未達）</span>
              </div>
            </div>
          </div>

          {/* 累計売上グラフ */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-4">累計売上 推移</h2>
            <div className="h-48 relative">
              {/* グリッド線 */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 25, 50, 75, 100].reverse().map(pct => (
                  <div key={pct} className="flex items-center">
                    <span className="text-[10px] text-slate-400 w-8">{Math.round(maxCumulative * pct / 100)}</span>
                    <div className="flex-1 border-t border-slate-100" />
                  </div>
                ))}
              </div>
              {/* ライン */}
              <svg className="absolute inset-0 ml-8" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* 予算ライン */}
                <polyline
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="0.5"
                  points={cumulativeData.map((d, i) => `${(i / 11) * 100},${100 - (d.cumBudget / maxCumulative) * 100}`).join(' ')}
                />
                {/* 実績ライン */}
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1"
                  points={cumulativeData.filter(d => d.cumActual !== null).map((d, i) => `${(i / 11) * 100},${100 - ((d.cumActual || 0) / maxCumulative) * 100}`).join(' ')}
                />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 mt-2 ml-8">
              {monthOrder.map(m => <span key={m}>{m}月</span>)}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-slate-300" />
                <span className="text-slate-500">予算累計</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-indigo-500" />
                <span className="text-slate-500">実績累計</span>
              </div>
            </div>
          </div>

          {/* サマリーカード */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '通期目標', value: fyBudget.revenue, unit: '億円', color: 'slate' },
              { label: '累計実績', value: cumulativeData.filter(d => d.cumActual !== null).slice(-1)[0]?.cumActual || 0, unit: '億円', color: 'indigo' },
              { label: '累計予算', value: cumulativeData.filter(d => d.isClosed).slice(-1)[0]?.cumBudget || 0, unit: '億円', color: 'slate' },
              { label: '達成率', value: (() => {
                const actual = cumulativeData.filter(d => d.cumActual !== null).slice(-1)[0]?.cumActual || 0;
                const budget = cumulativeData.filter(d => d.isClosed).slice(-1)[0]?.cumBudget || 1;
                return (actual / budget * 100);
              })(), unit: '%', color: 'emerald' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-lg border border-slate-200 p-3">
                <div className="text-[10px] text-slate-500">{item.label}</div>
                <div className={`text-xl font-bold text-${item.color}-600`}>
                  {item.unit === '%' ? item.value.toFixed(1) : item.value.toFixed(1)}
                  <span className="text-sm text-slate-400 ml-1">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* パイプライン */}
      {activeChart === 'pipeline' && (
        <div className="space-y-4">
          {/* ステージ別構成 */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-4">ステージ別構成</h2>
            <div className="flex gap-4">
              {/* 円グラフ風表示 */}
              <div className="w-48 h-48 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    let offset = 0;
                    return pipelineSummary.map(stage => {
                      const stageConfig = pipelineStages.find(s => s.id === stage.stage)!;
                      const pct = pipelineGross > 0 ? (stage.totalAmount / pipelineGross) * 100 : 0;
                      const strokeDasharray = `${pct} ${100 - pct}`;
                      const strokeDashoffset = -offset;
                      offset += pct;

                      const colorMap: Record<string, string> = {
                        'bg-emerald-100': '#10b981',
                        'bg-blue-100': '#3b82f6',
                        'bg-amber-100': '#f59e0b',
                        'bg-slate-100': '#64748b',
                      };

                      return (
                        <circle
                          key={stage.stage}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={colorMap[stageConfig.bgColor] || '#94a3b8'}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-slate-800">{pipelineGross.toFixed(0)}</div>
                  <div className="text-xs text-slate-500">億円</div>
                </div>
              </div>
              {/* 凡例 */}
              <div className="flex-1 space-y-2">
                {pipelineSummary.map(stage => {
                  const stageConfig = pipelineStages.find(s => s.id === stage.stage)!;
                  const pct = pipelineGross > 0 ? (stage.totalAmount / pipelineGross) * 100 : 0;
                  return (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded ${stageConfig.bgColor}`} />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            {stageConfig.name}（{stageConfig.probability}%）
                          </span>
                          <span className="text-sm font-bold text-slate-800">{stage.totalAmount.toFixed(1)}億</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>{stage.count}件</span>
                          <span>構成比 {pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 月別受注見込み */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-4">月別受注見込み（パイプライン）</h2>
            <div className="h-48 flex items-end gap-2">
              {monthOrder.map(month => {
                const data = pipelineByMonth[month];
                const grossHeight = maxPipelineMonth > 0 ? (data.gross / maxPipelineMonth) * 100 : 0;
                const weightedHeight = maxPipelineMonth > 0 ? (data.weighted / maxPipelineMonth) * 100 : 0;
                return (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div className="w-full h-40 flex items-end justify-center gap-0.5">
                      <div
                        className="w-4 bg-slate-200 rounded-t"
                        style={{ height: `${grossHeight}%` }}
                        title={`総額: ${data.gross.toFixed(1)}億`}
                      />
                      <div
                        className="w-4 bg-indigo-500 rounded-t"
                        style={{ height: `${weightedHeight}%` }}
                        title={`加重: ${data.weighted.toFixed(1)}億`}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">{month}月</div>
                    {data.count > 0 && (
                      <div className="text-[10px] text-slate-400">{data.count}件</div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-slate-200 rounded" />
                <span className="text-slate-500">総額</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-indigo-500 rounded" />
                <span className="text-slate-500">加重見込み</span>
              </div>
            </div>
          </div>

          {/* サマリーカード */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-[10px] text-slate-500">パイプライン総額</div>
              <div className="text-xl font-bold text-slate-800">{pipelineGross.toFixed(1)}<span className="text-sm text-slate-400 ml-1">億円</span></div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-[10px] text-slate-500">加重見込み</div>
              <div className="text-xl font-bold text-indigo-600">{pipelineWeighted.toFixed(1)}<span className="text-sm text-slate-400 ml-1">億円</span></div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-[10px] text-slate-500">案件数</div>
              <div className="text-xl font-bold text-slate-800">{pipelineData.length}<span className="text-sm text-slate-400 ml-1">件</span></div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-[10px] text-slate-500">平均案件規模</div>
              <div className="text-xl font-bold text-slate-800">{(pipelineGross / pipelineData.length).toFixed(1)}<span className="text-sm text-slate-400 ml-1">億円</span></div>
            </div>
          </div>
        </div>
      )}

      {/* 部署別 */}
      {activeChart === 'department' && (
        <div className="space-y-4">
          {/* 部署別達成率 */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-4">部署別 目標達成見込み</h2>
            <div className="space-y-4">
              {departmentSummaries.map(dept => {
                const confirmedPct = (dept.department.confirmedYTD / dept.department.target) * 100;
                const pipelinePct = (dept.pipelineWeighted / dept.department.target) * 100;
                const totalPct = confirmedPct + pipelinePct;
                return (
                  <div key={dept.department.id}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{dept.department.name}</span>
                      <span className={`text-sm font-bold ${totalPct >= 100 ? 'text-emerald-600' : totalPct >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                        {totalPct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-8 bg-slate-100 rounded-lg overflow-hidden flex">
                      <div
                        className="bg-slate-700 h-full flex items-center justify-center text-[10px] text-white"
                        style={{ width: `${Math.min(confirmedPct, 100)}%` }}
                      >
                        {confirmedPct > 10 && `確定 ${dept.department.confirmedYTD.toFixed(0)}億`}
                      </div>
                      {dept.stageBreakdown.map(sb => {
                        const stage = pipelineStages.find(s => s.id === sb.stage)!;
                        const widthPct = (sb.weighted / dept.department.target) * 100;
                        if (widthPct < 1) return null;
                        return (
                          <div
                            key={sb.stage}
                            className={`${stage.bgColor} h-full flex items-center justify-center text-[10px] font-medium ${stage.color}`}
                            style={{ width: `${widthPct}%` }}
                          >
                            {widthPct > 5 && sb.stage}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>目標: {dept.department.target}億</span>
                      <span>不足: {dept.gap > 0 ? dept.gap.toFixed(1) : '0'}億</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 部署別パイプライン比較 */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-4">部署別パイプライン比較</h2>
            <div className="grid grid-cols-3 gap-4">
              {departmentSummaries.map(dept => (
                <div key={dept.department.id} className="border border-slate-100 rounded-lg p-3">
                  <div className="text-sm font-bold text-slate-800 mb-3">{dept.department.name}</div>
                  <div className="space-y-2">
                    {dept.stageBreakdown.map(sb => {
                      const stage = pipelineStages.find(s => s.id === sb.stage)!;
                      const maxAmount = Math.max(...departmentSummaries.flatMap(d => d.stageBreakdown.map(s => s.amount)));
                      const widthPct = maxAmount > 0 ? (sb.amount / maxAmount) * 100 : 0;
                      return (
                        <div key={sb.stage} className="flex items-center gap-2">
                          <span className={`w-6 text-xs font-bold ${stage.color}`}>{sb.stage}</span>
                          <div className="flex-1 h-4 bg-slate-100 rounded overflow-hidden">
                            <div
                              className={`h-full ${stage.bgColor}`}
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-600 w-12 text-right">{sb.amount.toFixed(1)}億</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between text-xs">
                    <span className="text-slate-500">合計</span>
                    <span className="font-bold text-slate-800">{dept.pipelineGross.toFixed(1)}億</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI一覧 */}
      {activeChart === 'kpi' && (
        <div className="space-y-4">
          {/* KPI達成率一覧 */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-bold text-slate-800 mb-4">KPI達成率（累計）</h2>
            <div className="grid grid-cols-2 gap-4">
              {['収益', '営業', 'プロジェクト', '人事', '財務'].map(category => (
                <div key={category} className="border border-slate-100 rounded-lg p-3">
                  <div className="text-xs font-bold text-slate-600 mb-3">{category}</div>
                  <div className="space-y-2">
                    {kpiSummary.filter(k => k.category === category).map(kpi => (
                      <div key={kpi.id} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${kpi.isGood ? 'bg-emerald-500' : 'bg-red-400'}`} />
                        <span className="flex-1 text-xs text-slate-700">{kpi.name}</span>
                        <span className="text-xs text-slate-500">{kpi.actual.toFixed(1)}/{kpi.budget.toFixed(1)}</span>
                        <span className={`text-xs font-bold ${kpi.isGood ? 'text-emerald-600' : 'text-red-500'}`}>
                          {kpi.rate.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KPI達成率ランキング */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-sm font-bold text-emerald-600 mb-3">好調KPI TOP5</h2>
              <div className="space-y-2">
                {[...kpiSummary]
                  .filter(k => k.isGood)
                  .sort((a, b) => b.rate - a.rate)
                  .slice(0, 5)
                  .map((kpi, i) => (
                    <div key={kpi.id} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-slate-700">{kpi.name}</span>
                      <span className="text-sm font-bold text-emerald-600">{kpi.rate.toFixed(0)}%</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-sm font-bold text-red-600 mb-3">要改善KPI</h2>
              <div className="space-y-2">
                {[...kpiSummary]
                  .filter(k => !k.isGood)
                  .sort((a, b) => a.rate - b.rate)
                  .slice(0, 5)
                  .map((kpi, i) => (
                    <div key={kpi.id} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm text-slate-700">{kpi.name}</span>
                      <span className="text-sm font-bold text-red-600">{kpi.rate.toFixed(0)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
