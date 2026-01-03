'use client';

import { useMemo } from 'react';
import {
  planVersions,
  comparePipelineWithPlans,
  firstHalfMonths,
  secondHalfMonths,
  pipelineData,
  calculateHalfYearSummary,
  pipelineStages,
} from '@/lib/pipelineData';
import { monthlyDataset, monthOrder } from '@/lib/monthlyData';

export default function PlanComparison() {
  // 計画比較データ
  const comparison = useMemo(() => comparePipelineWithPlans(), []);

  // 月別の予算と実績を取得
  const monthlyData = useMemo(() => {
    const budgets: { [month: number]: number } = {};
    const actuals: { [month: number]: number | null } = {};
    monthlyDataset.forEach(m => {
      budgets[m.month] = m.kpis.revenue?.budget || 0;
      actuals[m.month] = m.isClosed ? (m.kpis.revenue?.actual ?? null) : null;
    });
    return { budgets, actuals };
  }, []);

  // 上期/下期サマリー
  const halfYearSummary = useMemo(() => {
    return calculateHalfYearSummary(pipelineData, monthlyData.actuals, monthlyData.budgets);
  }, [monthlyData]);

  // アクティブプラン
  const activePlan = planVersions.find(p => p.isActive);

  return (
    <div className="space-y-6">
      {/* 計画バージョン比較 */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-800 mb-4">計画バージョン比較</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 px-3 text-left font-medium">計画</th>
                <th className="py-2 px-3 text-right font-medium">計画総額</th>
                <th className="py-2 px-3 text-right font-medium">現在積上</th>
                <th className="py-2 px-3 text-right font-medium">差異</th>
                <th className="py-2 px-3 text-right font-medium">達成率</th>
                <th className="py-2 px-3 text-center font-medium">状態</th>
              </tr>
            </thead>
            <tbody>
              {comparison.totalComparison.map(plan => {
                const planInfo = planVersions.find(p => p.id === plan.planId);
                const isActive = planInfo?.isActive;
                return (
                  <tr key={plan.planId} className={`border-b border-slate-100 ${isActive ? 'bg-indigo-50' : ''}`}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{plan.planName}</span>
                        {isActive && (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-medium rounded">
                            アクティブ
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{planInfo?.createdAt}</div>
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-700">
                      {plan.planTotal.toFixed(1)}億
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-indigo-600">
                      {plan.currentTotal.toFixed(1)}億
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${
                      plan.variance >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {plan.variance >= 0 ? '+' : ''}{plan.variance.toFixed(1)}億
                    </td>
                    <td className={`py-2 px-3 text-right font-medium ${
                      plan.varianceRate >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {(plan.currentTotal / plan.planTotal * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 px-3 text-center">
                      {plan.currentTotal >= plan.planTotal ? (
                        <span className="text-emerald-500">●</span>
                      ) : plan.varianceRate >= -10 ? (
                        <span className="text-amber-500">●</span>
                      ) : (
                        <span className="text-red-500">●</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 上期・下期サマリー */}
      <div className="grid grid-cols-2 gap-4">
        {[halfYearSummary.first, halfYearSummary.second].map(half => (
          <div key={half.period} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">{half.label}（{half.months.join(',')}月）</h3>
              {half.variance !== null && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  half.variance >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {half.variance >= 0 ? '+' : ''}{half.variance.toFixed(1)}億
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-2 bg-slate-50 rounded">
                <div className="text-[10px] text-slate-500">予算</div>
                <div className="text-lg font-bold text-slate-700">{half.totalBudget.toFixed(1)}</div>
              </div>
              <div className="text-center p-2 bg-slate-50 rounded">
                <div className="text-[10px] text-slate-500">実績</div>
                <div className={`text-lg font-bold ${half.totalActual !== null ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {half.totalActual !== null ? half.totalActual.toFixed(1) : '-'}
                </div>
              </div>
              <div className="text-center p-2 bg-slate-50 rounded">
                <div className="text-[10px] text-slate-500">PL積上</div>
                <div className="text-lg font-bold text-emerald-600">{half.totalPipeline.toFixed(1)}</div>
              </div>
            </div>

            {/* 確度別内訳 */}
            <div className="text-xs">
              <div className="text-slate-500 mb-1">確度別内訳</div>
              <div className="flex gap-1">
                {half.stageBreakdown.filter(s => s.amount > 0).map(s => {
                  const stage = pipelineStages.find(st => st.id === s.stage);
                  return (
                    <span key={s.stage} className={`px-1.5 py-0.5 rounded ${stage?.bgColor} ${stage?.color}`}>
                      {s.stage}:{s.amount.toFixed(1)}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 月別計画比較 */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h2 className="text-sm font-bold text-slate-800 mb-3">月別計画比較</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="py-2 px-2 text-left font-medium w-20"></th>
                {monthOrder.map(m => (
                  <th key={m} className="py-2 px-1 text-center font-medium min-w-[45px]">{m}月</th>
                ))}
                <th className="py-2 px-2 text-center font-medium bg-slate-50">合計</th>
              </tr>
            </thead>
            <tbody>
              {/* 計画行 */}
              {planVersions.map(plan => (
                <tr key={plan.id} className={`border-b border-slate-100 ${plan.isActive ? 'bg-indigo-50' : ''}`}>
                  <td className="py-1.5 px-2 text-slate-600 font-medium">
                    {plan.name}
                    {plan.isActive && <span className="text-indigo-500 ml-1">●</span>}
                  </td>
                  {monthOrder.map(m => (
                    <td key={m} className="py-1.5 px-1 text-center text-slate-500">
                      {plan.monthlyTargets[m]?.toFixed(0) || '-'}
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-center font-medium text-slate-700 bg-slate-50">
                    {Object.values(plan.monthlyTargets).reduce((s, v) => s + v, 0).toFixed(0)}
                  </td>
                </tr>
              ))}
              {/* 現在積上行 */}
              <tr className="border-b border-slate-200 bg-emerald-50">
                <td className="py-1.5 px-2 text-emerald-700 font-medium">現在積上</td>
                {monthOrder.map(m => {
                  const monthComp = comparison.monthlyComparison.find(mc => mc.month === m);
                  return (
                    <td key={m} className="py-1.5 px-1 text-center font-bold text-emerald-600">
                      {monthComp?.currentAmount ? monthComp.currentAmount.toFixed(1) : '-'}
                    </td>
                  );
                })}
                <td className="py-1.5 px-2 text-center font-bold text-emerald-700 bg-emerald-100">
                  {comparison.totalComparison[0]?.currentTotal.toFixed(1)}
                </td>
              </tr>
              {/* 差異行（アクティブプランとの） */}
              {activePlan && (
                <tr className="border-b border-slate-100">
                  <td className="py-1.5 px-2 text-slate-500 font-medium">差異</td>
                  {monthOrder.map(m => {
                    const monthComp = comparison.monthlyComparison.find(mc => mc.month === m);
                    const planAmount = activePlan.monthlyTargets[m] || 0;
                    const currentAmount = monthComp?.currentAmount || 0;
                    const diff = currentAmount - planAmount;
                    return (
                      <td key={m} className={`py-1.5 px-1 text-center font-medium ${
                        diff >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {diff !== 0 ? (diff > 0 ? '+' : '') + diff.toFixed(1) : '-'}
                      </td>
                    );
                  })}
                  <td className={`py-1.5 px-2 text-center font-bold bg-slate-50 ${
                    comparison.totalComparison.find(p => p.planId === activePlan.id)!.variance >= 0
                      ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {comparison.totalComparison.find(p => p.planId === activePlan.id)!.variance >= 0 ? '+' : ''}
                    {comparison.totalComparison.find(p => p.planId === activePlan.id)!.variance.toFixed(1)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
          <span><span className="text-indigo-500">●</span> アクティブ計画</span>
          <span className="text-emerald-600">■</span><span>現在積上</span>
          <span>単位: 億円</span>
        </div>
      </div>
    </div>
  );
}
