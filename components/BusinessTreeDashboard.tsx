'use client';

import { useState } from 'react';
import {
  TreeNode,
  businessTree,
  departmentSummaries,
  urgencyConfig,
  kpiStatusConfig,
  DepartmentSummary,
} from '@/lib/businessTreeData';
import { DEMO_DECISIONS } from '@/lib/decisionData';
import { DecisionBox } from '@/lib/types';

// ツリーノードコンポーネント
function TreeNodeItem({
  node,
  level = 0,
  expandedNodes,
  toggleNode,
  onDecisionClick,
}: {
  node: TreeNode;
  level?: number;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
  onDecisionClick: (decisionId: string) => void;
}) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const paddingLeft = level * 20;

  // 意思決定ノード
  if (node.type === 'decision') {
    const urgency = node.urgency ? urgencyConfig[node.urgency] : null;
    return (
      <div
        className="flex items-center gap-2 py-2 px-3 ml-2 my-1 rounded-lg bg-indigo-50 border border-indigo-200 cursor-pointer hover:bg-indigo-100 transition-colors"
        style={{ marginLeft: paddingLeft }}
        onClick={() => node.decisionId && onDecisionClick(node.decisionId)}
      >
        <span className="text-indigo-600">⚡</span>
        <span className="flex-1 text-sm font-medium text-indigo-900">{node.name}</span>
        {urgency && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${urgency.color}`}>
            {urgency.label}
          </span>
        )}
        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    );
  }

  // KPIノード
  if (node.type === 'kpi') {
    const status = node.kpiStatus ? kpiStatusConfig[node.kpiStatus] : kpiStatusConfig.neutral;
    const trendIcon = node.kpiTrend === 'up' ? '↑' : node.kpiTrend === 'down' ? '↓' : '→';
    const trendColor = node.kpiTrend === 'up' ? 'text-emerald-600' : node.kpiTrend === 'down' ? 'text-red-600' : 'text-slate-500';

    return (
      <div
        className={`flex items-center gap-3 py-2 px-3 ml-2 my-1 rounded-lg ${status.bg} border border-slate-200`}
        style={{ marginLeft: paddingLeft }}
      >
        <span className={`${status.color} text-xs`}>{status.icon}</span>
        <span className="flex-1 text-sm text-slate-700">{node.name}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">
            {node.kpiValue}{node.kpiUnit}
          </span>
          {node.kpiTarget && (
            <span className="text-xs text-slate-500">/ {node.kpiTarget}{node.kpiUnit}</span>
          )}
          <span className={`text-sm ${trendColor}`}>{trendIcon}</span>
        </div>
      </div>
    );
  }

  // 部門・カテゴリノード
  return (
    <div style={{ marginLeft: paddingLeft }}>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
          node.type === 'department'
            ? 'bg-slate-100 hover:bg-slate-200 font-semibold'
            : 'hover:bg-slate-50'
        }`}
        onClick={() => hasChildren && toggleNode(node.id)}
      >
        {hasChildren && (
          <svg
            className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
        {!hasChildren && <span className="w-4" />}
        {node.icon && <span>{node.icon}</span>}
        <span className={`text-sm ${node.type === 'department' ? 'text-slate-900' : 'text-slate-700'}`}>
          {node.name}
        </span>
        {node.type === 'category' && node.children && (
          <span className="text-xs text-slate-400 ml-auto">
            {node.children.length}項目
          </span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div className="border-l-2 border-slate-200 ml-4">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              onDecisionClick={onDecisionClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 部門カードコンポーネント
function DepartmentCard({
  dept,
  isSelected,
  onClick,
}: {
  dept: DepartmentSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{dept.icon}</span>
        <div>
          <h3 className="font-semibold text-slate-900">{dept.name}</h3>
          <p className="text-xs text-slate-500">{dept.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-100 rounded-lg p-2">
          <div className="text-lg font-bold text-slate-900">{dept.kpiCount}</div>
          <div className="text-xs text-slate-500">KPI</div>
        </div>
        <div className={`rounded-lg p-2 ${dept.decisionCount > 0 ? 'bg-indigo-100' : 'bg-slate-100'}`}>
          <div className={`text-lg font-bold ${dept.decisionCount > 0 ? 'text-indigo-600' : 'text-slate-900'}`}>
            {dept.decisionCount}
          </div>
          <div className="text-xs text-slate-500">判断待ち</div>
        </div>
        <div className={`rounded-lg p-2 ${dept.alertCount > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
          <div className={`text-lg font-bold ${dept.alertCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {dept.alertCount > 0 ? dept.alertCount : dept.goodCount}
          </div>
          <div className="text-xs text-slate-500">{dept.alertCount > 0 ? 'アラート' : '正常'}</div>
        </div>
      </div>
    </div>
  );
}

// 意思決定詳細モーダル
function DecisionDetailModal({
  decision,
  onClose,
}: {
  decision: DecisionBox;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'inputs' | 'options'>('overview');

  const urgencyConfig: Record<string, { label: string; color: string }> = {
    immediate: { label: '緊急', color: 'bg-red-100 text-red-800' },
    this_week: { label: '今週中', color: 'bg-orange-100 text-orange-800' },
    this_month: { label: '今月中', color: 'bg-yellow-100 text-yellow-800' },
    this_quarter: { label: '今四半期', color: 'bg-blue-100 text-blue-800' },
  };

  const urgency = urgencyConfig[decision.urgency];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-1 rounded-full ${urgency.color}`}>
                  {urgency.label}
                </span>
                {decision.deadline && (
                  <span className="text-xs text-indigo-200">期限: {decision.deadline}</span>
                )}
              </div>
              <h2 className="text-xl font-bold">{decision.title}</h2>
              <p className="text-indigo-200 mt-1">{decision.purpose}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* タブ */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: '概要' },
            { id: 'inputs', label: 'インプット' },
            { id: 'options', label: '選択肢' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setActiveTab(tab.id as 'overview' | 'inputs' | 'options')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">目的</h3>
                <p className="text-slate-600">{decision.purpose}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-500 mb-1">担当者</h4>
                  <p className="font-semibold">{decision.owner}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-slate-500 mb-1">関係者</h4>
                  <p className="font-semibold">{decision.stakeholders.join(', ')}</p>
                </div>
              </div>
              {decision.constraints.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">制約条件</h3>
                  <div className="space-y-2">
                    {decision.constraints.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${c.type === 'hard' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                        <span className="text-slate-700">{c.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inputs' && (
            <div className="space-y-4">
              {decision.inputs.map((input) => (
                <div key={input.id} className="bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">{input.label}</h4>
                    {input.trend && (
                      <span className={`text-sm ${
                        input.trend === 'up' ? 'text-emerald-600' : input.trend === 'down' ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        {input.trend === 'up' ? '↑' : input.trend === 'down' ? '↓' : '→'}
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {input.value}{input.unit}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    出典: {input.source} ({input.updatedAt})
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'options' && (
            <div className="space-y-4">
              {decision.options.map((option) => (
                <div
                  key={option.id}
                  className={`rounded-lg p-4 border-2 ${
                    option.isRecommended
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-slate-900">{option.label}</h4>
                    {option.isRecommended && (
                      <span className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-full">推奨</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{option.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-medium text-emerald-700 mb-1">メリット</h5>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {option.pros.map((pro, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-emerald-500">+</span> {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-xs font-medium text-red-700 mb-1">デメリット</h5>
                      <ul className="text-xs text-slate-600 space-y-1">
                        {option.cons.map((con, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-red-500">-</span> {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// メインコンポーネント
export default function BusinessTreeDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['management']));
  const [selectedDecision, setSelectedDecision] = useState<DecisionBox | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'tree'>('cards');

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDecisionClick = (decisionId: string) => {
    const decision = DEMO_DECISIONS.find((d) => d.id === decisionId);
    if (decision) {
      setSelectedDecision(decision);
    }
  };

  const filteredTree = selectedDepartment
    ? businessTree.filter((node) => node.id === selectedDepartment)
    : businessTree;

  // 全体サマリー計算
  const totalKpis = departmentSummaries.reduce((sum, d) => sum + d.kpiCount, 0);
  const totalDecisions = departmentSummaries.reduce((sum, d) => sum + d.decisionCount, 0);
  const totalAlerts = departmentSummaries.reduce((sum, d) => sum + d.alertCount, 0);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">業務KPIツリー</h1>
          <p className="text-slate-500 mt-1">
            部門別のKPIと意思決定項目をツリー構造で確認できます
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'cards'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setViewMode('cards')}
          >
            カード表示
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'tree'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            onClick={() => setViewMode('tree')}
          >
            ツリー表示
          </button>
        </div>
      </div>

      {/* 全体サマリー */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-3xl font-bold text-slate-900">{departmentSummaries.length}</div>
          <div className="text-sm text-slate-500">部門</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-3xl font-bold text-slate-900">{totalKpis}</div>
          <div className="text-sm text-slate-500">KPI指標</div>
        </div>
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4">
          <div className="text-3xl font-bold text-indigo-600">{totalDecisions}</div>
          <div className="text-sm text-indigo-600">判断待ち</div>
        </div>
        <div className={`rounded-xl border p-4 ${totalAlerts > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className={`text-3xl font-bold ${totalAlerts > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {totalAlerts}
          </div>
          <div className={`text-sm ${totalAlerts > 0 ? 'text-red-600' : 'text-emerald-600'}`}>アラート</div>
        </div>
      </div>

      {viewMode === 'cards' ? (
        <>
          {/* 部門カード一覧 */}
          <div className="grid grid-cols-3 gap-4">
            {departmentSummaries.map((dept) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                isSelected={selectedDepartment === dept.id}
                onClick={() =>
                  setSelectedDepartment(selectedDepartment === dept.id ? null : dept.id)
                }
              />
            ))}
          </div>

          {/* 選択された部門のツリー */}
          {selectedDepartment && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {departmentSummaries.find((d) => d.id === selectedDepartment)?.name} のKPIツリー
                </h2>
                <button
                  className="text-sm text-slate-500 hover:text-slate-700"
                  onClick={() => {
                    const deptNode = businessTree.find((n) => n.id === selectedDepartment);
                    if (deptNode) {
                      const allIds = new Set<string>();
                      const collectIds = (node: TreeNode) => {
                        allIds.add(node.id);
                        node.children?.forEach(collectIds);
                      };
                      collectIds(deptNode);
                      setExpandedNodes(allIds);
                    }
                  }}
                >
                  すべて展開
                </button>
              </div>
              <div className="space-y-1">
                {filteredTree.map((node) => (
                  <TreeNodeItem
                    key={node.id}
                    node={node}
                    expandedNodes={expandedNodes}
                    toggleNode={toggleNode}
                    onDecisionClick={handleDecisionClick}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        /* フルツリー表示 */
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-slate-900">全部門KPIツリー</h2>
            <div className="flex gap-2">
              <button
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1 rounded border border-slate-300"
                onClick={() => {
                  const allIds = new Set<string>();
                  const collectIds = (node: TreeNode) => {
                    allIds.add(node.id);
                    node.children?.forEach(collectIds);
                  };
                  businessTree.forEach(collectIds);
                  setExpandedNodes(allIds);
                }}
              >
                すべて展開
              </button>
              <button
                className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1 rounded border border-slate-300"
                onClick={() => setExpandedNodes(new Set())}
              >
                すべて折りたたむ
              </button>
            </div>
          </div>
          <div className="space-y-1">
            {businessTree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                expandedNodes={expandedNodes}
                toggleNode={toggleNode}
                onDecisionClick={handleDecisionClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* 意思決定詳細モーダル */}
      {selectedDecision && (
        <DecisionDetailModal
          decision={selectedDecision}
          onClose={() => setSelectedDecision(null)}
        />
      )}
    </div>
  );
}
