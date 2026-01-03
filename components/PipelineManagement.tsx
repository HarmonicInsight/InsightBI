'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  pipelineStages,
  pipelineData,
  pipelineAsOf,
  PipelineItem,
  PipelineStage,
  departments,
  getMonthlyPipelineData,
  pipelineEventTypes,
  getItemMonthlyTotal,
  calculateMonthlyPipelineRevenue,
} from '@/lib/pipelineData';
import { monthlyDataset, monthOrder, fyBudget } from '@/lib/monthlyData';

type SortKey = 'amount' | 'stage' | 'expectedCloseMonth' | 'customer' | 'owner';
type SortOrder = 'asc' | 'desc';

interface PipelineManagementProps {
  initialFilter?: {
    departmentId?: string;
    stage?: PipelineStage;
  };
  onClearFilter?: () => void;
}

export default function PipelineManagement({ initialFilter, onClearFilter }: PipelineManagementProps) {
  const [filterStage, setFilterStage] = useState<PipelineStage | 'all'>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('amount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 行展開トグル
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 初期フィルターの適用
  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.departmentId) {
        setFilterDepartment(initialFilter.departmentId);
      }
      if (initialFilter.stage) {
        setFilterStage(initialFilter.stage);
      }
    }
  }, [initialFilter]);

  // フィルタークリア
  const handleClearFilter = () => {
    setFilterStage('all');
    setFilterOwner('all');
    setFilterDepartment('all');
    setFilterMonth('all');
    onClearFilter?.();
  };

  // フィルターが適用されているか
  const hasActiveFilter = filterStage !== 'all' || filterOwner !== 'all' || filterDepartment !== 'all' || filterMonth !== 'all';

  // 月選択時のデータソース（月別パイプラインデータまたは全体データ）
  const baseData = useMemo(() => {
    if (filterMonth !== 'all') {
      return getMonthlyPipelineData(filterMonth);
    }
    return pipelineData;
  }, [filterMonth]);

  // 選択月の売上データ
  const monthlyRevenue = useMemo(() => {
    if (filterMonth === 'all') return null;
    const monthData = monthlyDataset.find(d => d.month === filterMonth);
    if (!monthData) return null;
    const revenue = monthData.kpis.revenue;
    return {
      month: filterMonth,
      label: monthData.label,
      isClosed: monthData.isClosed,
      budget: revenue?.budget || 0,
      actual: revenue?.actual ?? null,
      variance: revenue?.variance ?? null,
      varianceRate: revenue?.varianceRate ?? null,
    };
  }, [filterMonth]);

  // パイプラインの月別売上積み上げ（案件のmonthlyRevenueから算出）
  const pipelineMonthlyRevenue = useMemo(() => calculateMonthlyPipelineRevenue(), []);

  // 12ヶ月売上・パイプライン概要
  const yearlyOverview = useMemo(() => {
    return monthOrder.map(m => {
      const monthData = monthlyDataset.find(d => d.month === m);
      const revenue = monthData?.kpis.revenue;
      const monthPipeline = getMonthlyPipelineData(m);
      // 案件の月別売上の積み上げ
      const pipelineRevenue = pipelineMonthlyRevenue[m] || 0;
      // 受注予定月ベースの件数
      const dealCount = monthPipeline.length;

      return {
        month: m,
        label: monthData?.label || `${m}月`,
        isClosed: monthData?.isClosed || false,
        budget: revenue?.budget || 0,
        actual: revenue?.actual ?? null,
        pipelineRevenue, // 月別売上の積み上げ
        dealCount,
      };
    });
  }, [pipelineMonthlyRevenue]);

  // 担当者リスト
  const owners = useMemo(() => {
    const ownerSet = new Set(baseData.map(p => p.owner));
    return Array.from(ownerSet).sort();
  }, [baseData]);

  // フィルター＆ソート済みデータ
  const filteredData = useMemo(() => {
    let data = [...baseData];

    if (filterDepartment !== 'all') {
      data = data.filter(p => p.departmentId === filterDepartment);
    }
    if (filterStage !== 'all') {
      data = data.filter(p => p.stage === filterStage);
    }
    if (filterOwner !== 'all') {
      data = data.filter(p => p.owner === filterOwner);
    }
    // filterMonth は baseData で既に適用済み

    data.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'stage':
          cmp = a.stage.localeCompare(b.stage);
          break;
        case 'expectedCloseMonth':
          cmp = a.expectedCloseMonth - b.expectedCloseMonth;
          break;
        case 'customer':
          cmp = a.customer.localeCompare(b.customer);
          break;
        case 'owner':
          cmp = a.owner.localeCompare(b.owner);
          break;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return data;
  }, [baseData, filterDepartment, filterStage, filterOwner, sortKey, sortOrder]);

  // 集計
  const summary = useMemo(() => {
    const total = filteredData.reduce((sum, p) => sum + p.amount, 0);
    const weighted = filteredData.reduce((sum, p) => {
      const stage = pipelineStages.find(s => s.id === p.stage);
      return sum + p.amount * ((stage?.probability || 0) / 100);
    }, 0);
    return { count: filteredData.length, total, weighted };
  }, [filteredData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ active, order }: { active: boolean; order: SortOrder }) => (
    <span className={`ml-1 ${active ? 'text-indigo-600' : 'text-slate-300'}`}>
      {order === 'asc' ? '↑' : '↓'}
    </span>
  );

  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">パイプライン管理</h1>
            {filterDepartment !== 'all' && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                {departments.find(d => d.id === filterDepartment)?.name}
              </span>
            )}
            {filterStage !== 'all' && (
              <span className={`px-2 py-0.5 ${pipelineStages.find(s => s.id === filterStage)?.bgColor} ${pipelineStages.find(s => s.id === filterStage)?.color} text-xs font-bold rounded`}>
                {filterStage}案件
              </span>
            )}
            {filterMonth !== 'all' && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                {filterMonth}月
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Sales Insight {pipelineAsOf} 時点</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          + 案件追加
        </button>
      </div>

      {/* 12ヶ月売上・パイプライン概要 */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800">年間売上・パイプライン</h2>
          <div className="text-xs text-slate-500">
            通期目標: <span className="font-bold">{fyBudget.revenue}億</span>
          </div>
        </div>

        {/* 12ヶ月テーブル */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="py-1 px-2 text-left font-medium w-16">月</th>
                {yearlyOverview.map(m => (
                  <th
                    key={m.month}
                    onClick={() => setFilterMonth(filterMonth === m.month ? 'all' : m.month)}
                    className={`py-1 px-1 text-center font-medium cursor-pointer transition-colors min-w-[50px] ${
                      filterMonth === m.month ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    {m.month}月
                    {m.isClosed && <span className="text-[8px] text-emerald-500 ml-0.5">●</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-1.5 px-2 text-slate-500">売上</td>
                {yearlyOverview.map(m => (
                  <td key={m.month} className={`py-1.5 px-1 text-center ${
                    filterMonth === m.month ? 'bg-indigo-50' : ''
                  }`}>
                    {m.isClosed && m.actual !== null ? (
                      <span className={m.actual >= m.budget ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>
                        {m.actual.toFixed(0)}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-1.5 px-2 text-slate-500">予算</td>
                {yearlyOverview.map(m => (
                  <td key={m.month} className={`py-1.5 px-1 text-center text-slate-400 ${
                    filterMonth === m.month ? 'bg-indigo-50' : ''
                  }`}>
                    {m.budget.toFixed(0)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-100 bg-slate-50">
                <td className="py-1.5 px-2 text-slate-600 font-medium">PL総額</td>
                {yearlyOverview.map(m => (
                  <td key={m.month} className={`py-1.5 px-1 text-center font-bold text-indigo-600 ${
                    filterMonth === m.month ? 'bg-indigo-100' : ''
                  }`}>
                    {m.pipelineRevenue > 0 ? m.pipelineRevenue.toFixed(1) : '-'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-1.5 px-2 text-slate-500">件数</td>
                {yearlyOverview.map(m => (
                  <td key={m.month} className={`py-1.5 px-1 text-center text-slate-400 ${
                    filterMonth === m.month ? 'bg-indigo-50' : ''
                  }`}>
                    {m.dealCount > 0 ? m.dealCount : '-'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
          <span>売上: 確定売上（億円）</span>
          <span>PL総額: パイプライン総額（億円）</span>
          <span className="text-emerald-500">●</span><span>月次締め済</span>
        </div>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">部署:</span>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-1"
          >
            <option value="all">すべて</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">ステージ:</span>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value as PipelineStage | 'all')}
            className="text-sm border border-slate-200 rounded px-2 py-1"
          >
            <option value="all">すべて</option>
            {pipelineStages.map(s => (
              <option key={s.id} value={s.id}>{s.id} ({s.probability}%)</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">担当:</span>
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-1"
          >
            <option value="all">すべて</option>
            {owners.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">受注月:</span>
          <select
            value={filterMonth === 'all' ? 'all' : filterMonth.toString()}
            onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="text-sm border border-slate-200 rounded px-2 py-1"
          >
            <option value="all">すべて</option>
            {monthOrder.map(m => (
              <option key={m} value={m}>{m}月</option>
            ))}
          </select>
        </div>
        {hasActiveFilter && (
          <button
            onClick={handleClearFilter}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            フィルター解除
          </button>
        )}
        <div className="flex-1" />
        <div className="text-sm text-slate-600">
          <span className="font-medium">{summary.count}</span>件 /
          総額 <span className="font-medium">{summary.total.toFixed(1)}</span>億 /
          見込み <span className="font-medium text-indigo-600">{summary.weighted.toFixed(1)}</span>億
        </div>
      </div>

      {/* 月別売上情報（月が選択されている場合） */}
      {monthlyRevenue && (
        <div className={`rounded-lg border p-4 ${
          monthlyRevenue.isClosed
            ? 'bg-white border-slate-200'
            : 'bg-slate-50 border-slate-200 border-dashed'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-lg font-bold text-slate-800">{monthlyRevenue.label}売上</div>
              <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                monthlyRevenue.isClosed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
              }`}>
                {monthlyRevenue.isClosed ? '確定' : '未確定'}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-slate-500">予算</div>
                <div className="text-lg font-bold text-slate-700">{monthlyRevenue.budget.toFixed(1)}<span className="text-xs text-slate-400 ml-0.5">億</span></div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500">実績</div>
                <div className={`text-lg font-bold ${monthlyRevenue.isClosed ? 'text-indigo-600' : 'text-slate-300'}`}>
                  {monthlyRevenue.actual !== null ? `${monthlyRevenue.actual.toFixed(1)}` : '-'}<span className="text-xs text-slate-400 ml-0.5">億</span>
                </div>
              </div>
              {monthlyRevenue.isClosed && monthlyRevenue.variance !== null && (
                <div className="text-center">
                  <div className="text-xs text-slate-500">差異</div>
                  <div className={`text-lg font-bold ${
                    monthlyRevenue.variance >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {monthlyRevenue.variance >= 0 ? '+' : ''}{monthlyRevenue.variance.toFixed(1)}<span className="text-xs text-slate-400 ml-0.5">億</span>
                  </div>
                </div>
              )}
              <div className="text-center border-l border-slate-200 pl-6">
                <div className="text-xs text-slate-500">パイプライン</div>
                <div className="text-lg font-bold text-slate-800">
                  {summary.total.toFixed(1)}<span className="text-xs text-slate-400 ml-0.5">億</span>
                </div>
                <div className="text-xs text-slate-400">{summary.count}件</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ステージ別サマリー */}
      <div className="grid grid-cols-4 gap-3">
        {pipelineStages.map(stage => {
          const items = baseData.filter(p => p.stage === stage.id);
          const total = items.reduce((sum, p) => sum + p.amount, 0);
          const weighted = total * (stage.probability / 100);
          return (
            <div
              key={stage.id}
              onClick={() => setFilterStage(filterStage === stage.id ? 'all' : stage.id)}
              className={`${stage.bgColor} rounded-lg p-3 cursor-pointer transition-all ${
                filterStage === stage.id ? 'ring-2 ring-indigo-500' : 'hover:opacity-80'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-lg font-bold ${stage.color}`}>{stage.id}</span>
                <span className="text-xs text-slate-500">{stage.probability}%</span>
              </div>
              <div className={`text-2xl font-bold ${stage.color}`}>{total.toFixed(0)}<span className="text-sm">億</span></div>
              <div className="text-xs text-slate-500">{items.length}件 → {weighted.toFixed(1)}億見込</div>
            </div>
          );
        })}
      </div>

      {/* 案件テーブル */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-xs text-slate-600">
              <th className="py-2 px-2 text-center font-medium w-8"></th>
              <th className="py-2 px-2 text-left font-medium">ステージ</th>
              <th className="py-2 px-2 text-left font-medium">案件名</th>
              <th
                className="py-2 px-2 text-right font-medium cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('amount')}
              >
                合計
                <SortIcon active={sortKey === 'amount'} order={sortOrder} />
              </th>
              <th className="py-2 px-1 text-center font-medium" colSpan={12}>
                <div className="flex justify-between text-[10px]">
                  {monthOrder.map(m => (
                    <span key={m} className="w-6">{m}月</span>
                  ))}
                </div>
              </th>
              <th className="py-2 px-2 text-left font-medium">イベント</th>
              <th
                className="py-2 px-2 text-left font-medium cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('owner')}
              >
                担当
                <SortIcon active={sortKey === 'owner'} order={sortOrder} />
              </th>
              <th className="py-2 px-2 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
              const stage = pipelineStages.find(s => s.id === item.stage)!;
              const isExpanded = expandedRows.has(item.id);
              const latestEvent = item.events?.[item.events.length - 1];
              const latestEventConfig = latestEvent ? pipelineEventTypes.find(e => e.id === latestEvent.type) : null;
              const monthlyTotal = getItemMonthlyTotal(item);

              return (
                <>
                  <tr
                    key={item.id}
                    className={`border-t border-slate-100 hover:bg-slate-50 cursor-pointer ${isExpanded ? 'bg-indigo-50' : ''}`}
                    onClick={() => toggleRow(item.id)}
                  >
                    <td className="py-2 px-2 text-center">
                      <span className={`text-slate-400 transition-transform inline-block ${isExpanded ? 'rotate-90' : ''}`}>
                        ▶
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${stage.bgColor} ${stage.color}`}>
                        {item.stage}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.customer}</div>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <div className="font-bold">{item.amount.toFixed(1)}億</div>
                      {monthlyTotal > 0 && monthlyTotal !== item.amount && (
                        <div className="text-[9px] text-slate-400">配分:{monthlyTotal.toFixed(1)}</div>
                      )}
                    </td>
                    {/* 12ヶ月売上グリッド */}
                    <td className="py-1 px-1" colSpan={12}>
                      <div className="flex justify-between">
                        {monthOrder.map(m => {
                          const val = item.monthlyRevenue?.[m] || 0;
                          const hasValue = val > 0;
                          return (
                            <div
                              key={m}
                              className={`w-6 h-6 flex items-center justify-center text-[9px] rounded ${
                                hasValue
                                  ? 'bg-indigo-100 text-indigo-700 font-bold'
                                  : 'text-slate-200'
                              }`}
                              title={hasValue ? `${m}月: ${val.toFixed(1)}億` : ''}
                            >
                              {hasValue ? val.toFixed(1) : '-'}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      {latestEventConfig ? (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${latestEventConfig.bgColor} ${latestEventConfig.color}`}>
                          {latestEventConfig.name}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-slate-600 text-xs">{item.owner}</td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); }}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        編集
                      </button>
                    </td>
                  </tr>
                  {/* 展開時のイベント履歴・ネクストアクション */}
                  {isExpanded && (
                    <tr key={`${item.id}-events`} className="bg-slate-50 border-t border-slate-100">
                      <td colSpan={19} className="py-3 px-4">
                        <div className="flex gap-6">
                          {/* イベント履歴 */}
                          <div className="flex-1">
                            <div className="text-xs font-medium text-slate-600 mb-2">イベント履歴</div>
                            {item.events && item.events.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {item.events.map(event => {
                                  const config = pipelineEventTypes.find(e => e.id === event.type);
                                  return (
                                    <div key={event.id} className={`px-2 py-1 rounded ${config?.bgColor || 'bg-slate-100'}`}>
                                      <div className="flex items-center gap-1">
                                        <span className={`text-xs font-medium ${config?.color || 'text-slate-600'}`}>
                                          {config?.name || event.type}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{event.date}</span>
                                      </div>
                                      {event.note && (
                                        <div className="text-[10px] text-slate-500 mt-0.5">{event.note}</div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400">イベントなし</div>
                            )}
                          </div>
                          {/* ネクストアクション */}
                          <div className="text-xs">
                            <div className="font-medium text-slate-600 mb-1">ネクストアクション</div>
                            {item.nextAction ? (
                              <div>
                                <div className="text-slate-700">{item.nextAction}</div>
                                {item.nextActionDate && (
                                  <div className="text-slate-400">{item.nextActionDate}</div>
                                )}
                              </div>
                            ) : (
                              <div className="text-slate-400">未設定</div>
                            )}
                          </div>
                          {/* 詳細情報 */}
                          <div className="text-xs text-slate-500 space-y-1">
                            <div>部署: {departments.find(d => d.id === item.departmentId)?.name || '-'}</div>
                            <div>顧客: {item.customer}</div>
                            <div>担当: {item.owner}</div>
                          </div>
                          {/* イベント追加ボタン */}
                          <div>
                            <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700">
                              + イベント追加
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="bg-slate-50 rounded-lg p-8 text-center text-slate-500">
          条件に一致する案件がありません
        </div>
      )}
    </div>
  );
}
