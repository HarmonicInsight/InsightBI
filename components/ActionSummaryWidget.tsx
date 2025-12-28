'use client';

import { useMemo } from 'react';
import { ActionStatus, ActionPriority } from '@/lib/types';

interface ActionSummaryData {
  id: string;
  targetName: string;
  issue: string;
  assignee: string;
  dueDate: string;
  status: ActionStatus;
  priority: ActionPriority;
  category: 'project' | 'branch' | 'segment';
  commentCount: number;
}

interface ActionSummaryWidgetProps {
  onNavigateToActions?: () => void;
  currentUser?: string;
}

// Demo data - in real app this would come from props or context
const DEMO_ACTIONS: ActionSummaryData[] = [
  { id: '1', targetName: '札幌支社', issue: '粗利率が目標を下回っている', assignee: '山田太郎', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'in_progress', priority: 'high', category: 'branch', commentCount: 3 },
  { id: '2', targetName: 'セキュリティ', issue: '粗利率が低い', assignee: '佐藤花子', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'pending', priority: 'medium', category: 'segment', commentCount: 0 },
  { id: '3', targetName: 'AIチャットボット導入支援', issue: '予算超過', assignee: '鈴木一郎', dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'overdue', priority: 'high', category: 'project', commentCount: 2 },
  { id: '4', targetName: '海外事業部', issue: '粗利率が低迷', assignee: '田中美咲', dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), status: 'in_progress', priority: 'medium', category: 'branch', commentCount: 2 },
  { id: '5', targetName: '東京本社 - データ分析', issue: '大型案件の遅延', assignee: '山田太郎', dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'in_progress', priority: 'high', category: 'segment', commentCount: 5 },
];

const CURRENT_USER = '山田太郎';

export default function ActionSummaryWidget({ onNavigateToActions, currentUser = CURRENT_USER }: ActionSummaryWidgetProps) {
  const stats = useMemo(() => {
    const myActions = DEMO_ACTIONS.filter(a => a.assignee === currentUser);
    const overdue = DEMO_ACTIONS.filter(a => a.status === 'overdue').length;
    const myOverdue = myActions.filter(a => a.status === 'overdue').length;

    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thisWeekDue = DEMO_ACTIONS.filter(a => {
      const due = new Date(a.dueDate);
      return due <= weekLater && a.status !== 'completed';
    }).length;
    const myThisWeek = myActions.filter(a => {
      const due = new Date(a.dueDate);
      return due <= weekLater && a.status !== 'completed';
    }).length;

    const inProgress = DEMO_ACTIONS.filter(a => a.status === 'in_progress').length;
    const pending = DEMO_ACTIONS.filter(a => a.status === 'pending').length;
    const highPriority = DEMO_ACTIONS.filter(a => a.priority === 'high' && a.status !== 'completed').length;

    return {
      total: DEMO_ACTIONS.length,
      myTotal: myActions.length,
      overdue,
      myOverdue,
      thisWeekDue,
      myThisWeek,
      inProgress,
      pending,
      highPriority,
    };
  }, [currentUser]);

  const urgentActions = useMemo(() => {
    return DEMO_ACTIONS
      .filter(a => a.status === 'overdue' || (a.priority === 'high' && a.status !== 'completed'))
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 3);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));

    if (days < 0) return `${Math.abs(days)}日超過`;
    if (days === 0) return '今日';
    if (days === 1) return '明日';
    if (days <= 7) return `${days}日後`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: ActionStatus) => {
    switch (status) {
      case 'overdue': return 'text-red-600 bg-red-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      case 'completed': return 'text-green-600 bg-green-50';
    }
  };

  const getPriorityIcon = (priority: ActionPriority) => {
    if (priority === 'high') {
      return <span className="text-red-500">●</span>;
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">アクション管理</h3>
            <p className="text-xs text-slate-500">要対応: {stats.overdue + stats.highPriority}件</p>
          </div>
        </div>
        {onNavigateToActions && (
          <button
            onClick={onNavigateToActions}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            詳細
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        <div className="p-3 text-center">
          <div className="text-lg font-bold text-slate-800">{stats.myTotal}</div>
          <div className="text-xs text-slate-500">自分の担当</div>
        </div>
        <div className="p-3 text-center">
          <div className={`text-lg font-bold ${stats.myOverdue > 0 ? 'text-red-600' : 'text-slate-800'}`}>
            {stats.myOverdue}
          </div>
          <div className="text-xs text-slate-500">期限超過</div>
        </div>
        <div className="p-3 text-center">
          <div className={`text-lg font-bold ${stats.myThisWeek > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
            {stats.myThisWeek}
          </div>
          <div className="text-xs text-slate-500">今週期限</div>
        </div>
        <div className="p-3 text-center">
          <div className="text-lg font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-500">全体</div>
        </div>
      </div>

      {/* Urgent Actions */}
      <div className="p-3">
        <div className="text-xs font-medium text-slate-500 mb-2">要対応アクション</div>
        <div className="space-y-2">
          {urgentActions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">要対応のアクションはありません</p>
          ) : (
            urgentActions.map(action => (
              <div
                key={action.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
                onClick={onNavigateToActions}
              >
                <div className={`w-2 h-2 rounded-full ${
                  action.status === 'overdue' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {getPriorityIcon(action.priority)}
                    <span className="text-sm font-medium text-slate-800 truncate">{action.targetName}</span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">{action.issue}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xs font-medium ${
                    action.status === 'overdue' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {formatDate(action.dueDate)}
                  </div>
                  <div className="text-xs text-slate-400">{action.assignee}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Filters */}
      {onNavigateToActions && (
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={onNavigateToActions}
            className="flex-1 py-1.5 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
          >
            自分の担当
          </button>
          <button
            onClick={onNavigateToActions}
            className="flex-1 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
          >
            期限超過
          </button>
          <button
            onClick={onNavigateToActions}
            className="flex-1 py-1.5 text-xs bg-amber-50 text-amber-600 rounded hover:bg-amber-100 transition-colors"
          >
            今週期限
          </button>
        </div>
      )}
    </div>
  );
}
