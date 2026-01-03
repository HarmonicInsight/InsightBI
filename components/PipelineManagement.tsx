'use client';

import { useState, useMemo } from 'react';
import {
  pipelineStages,
  pipelineData,
  pipelineAsOf,
  PipelineItem,
  PipelineStage,
} from '@/lib/pipelineData';

type SortKey = 'amount' | 'stage' | 'expectedCloseMonth' | 'customer' | 'owner';
type SortOrder = 'asc' | 'desc';

export default function PipelineManagement() {
  const [filterStage, setFilterStage] = useState<PipelineStage | 'all'>('all');
  const [filterOwner, setFilterOwner] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('amount');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 担当者リスト
  const owners = useMemo(() => {
    const ownerSet = new Set(pipelineData.map(p => p.owner));
    return Array.from(ownerSet).sort();
  }, []);

  // フィルター＆ソート済みデータ
  const filteredData = useMemo(() => {
    let data = [...pipelineData];

    if (filterStage !== 'all') {
      data = data.filter(p => p.stage === filterStage);
    }
    if (filterOwner !== 'all') {
      data = data.filter(p => p.owner === filterOwner);
    }

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
  }, [filterStage, filterOwner, sortKey, sortOrder]);

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
          <h1 className="text-xl font-bold text-slate-900">パイプライン管理</h1>
          <p className="text-xs text-slate-500">Sales Insight {pipelineAsOf} 時点</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          + 案件追加
        </button>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-4">
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
        <div className="flex-1" />
        <div className="text-sm text-slate-600">
          <span className="font-medium">{summary.count}</span>件 /
          総額 <span className="font-medium">{summary.total.toFixed(1)}</span>億 /
          見込み <span className="font-medium text-indigo-600">{summary.weighted.toFixed(1)}</span>億
        </div>
      </div>

      {/* ステージ別サマリー */}
      <div className="grid grid-cols-4 gap-3">
        {pipelineStages.map(stage => {
          const items = pipelineData.filter(p => p.stage === stage.id);
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
              <th className="py-2 px-3 text-left font-medium">ステージ</th>
              <th className="py-2 px-3 text-left font-medium">案件名</th>
              <th
                className="py-2 px-3 text-left font-medium cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('customer')}
              >
                顧客
                <SortIcon active={sortKey === 'customer'} order={sortOrder} />
              </th>
              <th
                className="py-2 px-3 text-right font-medium cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('amount')}
              >
                金額
                <SortIcon active={sortKey === 'amount'} order={sortOrder} />
              </th>
              <th
                className="py-2 px-3 text-center font-medium cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('expectedCloseMonth')}
              >
                受注予定
                <SortIcon active={sortKey === 'expectedCloseMonth'} order={sortOrder} />
              </th>
              <th
                className="py-2 px-3 text-left font-medium cursor-pointer hover:text-indigo-600"
                onClick={() => handleSort('owner')}
              >
                担当
                <SortIcon active={sortKey === 'owner'} order={sortOrder} />
              </th>
              <th className="py-2 px-3 text-center font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => {
              const stage = pipelineStages.find(s => s.id === item.stage)!;
              return (
                <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${stage.bgColor} ${stage.color}`}>
                      {item.stage}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                  <td className="py-2 px-3 text-slate-600">{item.customer}</td>
                  <td className="py-2 px-3 text-right font-bold">{item.amount.toFixed(1)}億</td>
                  <td className="py-2 px-3 text-center text-slate-600">{item.expectedCloseMonth}月</td>
                  <td className="py-2 px-3 text-slate-600">{item.owner}</td>
                  <td className="py-2 px-3 text-center">
                    <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                      編集
                    </button>
                  </td>
                </tr>
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
