'use client';

import { useState, useMemo } from 'react';
import {
  PerformanceData,
  ActionItem,
  ActionStatus,
  ActionPriority,
  ActionCategory,
  IssueTarget,
  ActionComment
} from '@/lib/types';

interface ActionTrackerProps {
  data: PerformanceData;
}

const DEMO_ASSIGNEES = ['山田太郎', '佐藤花子', '鈴木一郎', '田中美咲', '高橋健二'];

export default function ActionTracker({ data }: ActionTrackerProps) {
  const [actions, setActions] = useState<ActionItem[]>(() => generateInitialActions());
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ActionStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ActionCategory | 'all'>('all');
  const [newComment, setNewComment] = useState('');

  // Detect issues from performance data
  const detectedIssues = useMemo((): IssueTarget[] => {
    const issues: IssueTarget[] = [];
    const marginThreshold = data.thresholds.marginWarning;

    // Check branch performance
    data.branchPerformance.forEach(branch => {
      if (branch.total.grossMargin < marginThreshold) {
        issues.push({
          category: 'branch',
          name: branch.branch,
          issue: `粗利率が目標（${marginThreshold}%）を下回っています`,
          currentValue: branch.total.grossMargin,
          targetValue: marginThreshold,
          priority: branch.total.grossMargin < data.thresholds.marginCritical ? 'high' : 'medium'
        });
      }

      // Check each segment within branch
      Object.entries(branch.segments).forEach(([segmentName, segment]) => {
        if (segment.grossMargin < marginThreshold) {
          issues.push({
            category: 'segment',
            name: `${branch.branch} - ${segmentName}`,
            issue: `セグメント粗利率が低下`,
            currentValue: segment.grossMargin,
            targetValue: marginThreshold,
            priority: segment.grossMargin < data.thresholds.marginCritical ? 'high' : 'medium'
          });
        }
      });
    });

    return issues;
  }, [data]);

  // Filter actions
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      if (filterStatus !== 'all' && action.status !== filterStatus) return false;
      if (filterCategory !== 'all' && action.category !== filterCategory) return false;
      return true;
    });
  }, [actions, filterStatus, filterCategory]);

  // Statistics
  const stats = useMemo(() => {
    const total = actions.length;
    const pending = actions.filter(a => a.status === 'pending').length;
    const inProgress = actions.filter(a => a.status === 'in_progress').length;
    const completed = actions.filter(a => a.status === 'completed').length;
    const overdue = actions.filter(a => a.status === 'overdue').length;
    return { total, pending, inProgress, completed, overdue };
  }, [actions]);

  function generateInitialActions(): ActionItem[] {
    const now = new Date();
    return [
      {
        id: '1',
        category: 'branch',
        targetName: '札幌支社',
        issue: '粗利率が目標を大幅に下回っている',
        action: 'プロジェクト別収益分析を実施し、低採算案件の原因を特定',
        assignee: '山田太郎',
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in_progress',
        priority: 'high',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        comments: [
          {
            id: 'c1',
            author: '山田太郎',
            content: '分析を開始しました。来週中にレポートを提出予定です。',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        metrics: { before: 8.5, current: 9.2, target: 14.0 }
      },
      {
        id: '2',
        category: 'segment',
        targetName: 'セキュリティ',
        issue: '全社的にセキュリティ事業の粗利率が低い',
        action: '価格設定の見直しと原価削減施策の検討',
        assignee: '佐藤花子',
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        priority: 'medium',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        comments: [],
        metrics: { before: 11.2, current: 11.2, target: 15.0 }
      },
      {
        id: '3',
        category: 'project',
        targetName: 'AIチャットボット導入支援',
        issue: '予算超過により粗利がマイナス',
        action: '追加工数の原因分析と顧客への追加請求交渉',
        assignee: '鈴木一郎',
        dueDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'overdue',
        priority: 'high',
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        comments: [
          {
            id: 'c2',
            author: '鈴木一郎',
            content: '顧客との調整が難航しています。上長のサポートをお願いします。',
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        metrics: { before: -5.2, current: -3.1, target: 10.0 }
      },
      {
        id: '4',
        category: 'branch',
        targetName: '海外事業部',
        issue: '売上は好調だが粗利率が低迷',
        action: '現地パートナーとの契約条件の見直し',
        assignee: '田中美咲',
        dueDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'in_progress',
        priority: 'medium',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        comments: [
          {
            id: 'c3',
            author: '田中美咲',
            content: 'シンガポールオフィスとのミーティングを設定しました。',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'c4',
            author: '高橋健二',
            content: '契約書のドラフトを準備中です。',
            createdAt: new Date().toISOString()
          }
        ],
        metrics: { before: 10.8, current: 11.5, target: 14.0 }
      }
    ];
  }

  const handleStatusChange = (actionId: string, newStatus: ActionStatus) => {
    setActions(prev => prev.map(action =>
      action.id === actionId
        ? { ...action, status: newStatus, updatedAt: new Date().toISOString() }
        : action
    ));
    if (selectedAction?.id === actionId) {
      setSelectedAction(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null);
    }
  };

  const handleAddComment = (actionId: string) => {
    if (!newComment.trim()) return;

    const comment: ActionComment = {
      id: `c${Date.now()}`,
      author: 'デモユーザー',
      content: newComment,
      createdAt: new Date().toISOString()
    };

    setActions(prev => prev.map(action =>
      action.id === actionId
        ? { ...action, comments: [...action.comments, comment], updatedAt: new Date().toISOString() }
        : action
    ));

    if (selectedAction?.id === actionId) {
      setSelectedAction(prev => prev ? {
        ...prev,
        comments: [...prev.comments, comment],
        updatedAt: new Date().toISOString()
      } : null);
    }

    setNewComment('');
  };

  const handleCreateAction = (issue: IssueTarget) => {
    const newAction: ActionItem = {
      id: `a${Date.now()}`,
      category: issue.category,
      targetName: issue.name,
      issue: issue.issue,
      action: '',
      assignee: '',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      priority: issue.priority,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      metrics: { before: issue.currentValue, current: issue.currentValue, target: issue.targetValue }
    };
    setActions(prev => [...prev, newAction]);
    setSelectedAction(newAction);
  };

  const getStatusColor = (status: ActionStatus) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'overdue': return 'bg-red-100 text-red-700';
    }
  };

  const getStatusLabel = (status: ActionStatus) => {
    switch (status) {
      case 'pending': return '未着手';
      case 'in_progress': return '進行中';
      case 'completed': return '完了';
      case 'overdue': return '期限超過';
    }
  };

  const getPriorityColor = (priority: ActionPriority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
    }
  };

  const getPriorityLabel = (priority: ActionPriority) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
    }
  };

  const getCategoryLabel = (category: ActionCategory) => {
    switch (category) {
      case 'project': return 'プロジェクト';
      case 'branch': return '支社';
      case 'segment': return 'セグメント';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">全アクション</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
          <div className="text-sm text-gray-500">未着手</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-sm text-gray-500">進行中</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">完了</div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-sm text-gray-500">期限超過</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Issues Detection Panel */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-red-500">⚠</span>
              検出された課題
            </h3>
            <p className="text-sm text-gray-500 mt-1">業績データから自動検出</p>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {detectedIssues.length === 0 ? (
              <p className="text-gray-500 text-sm">現在、検出された課題はありません</p>
            ) : (
              detectedIssues.map((issue, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          issue.category === 'branch' ? 'bg-purple-100 text-purple-700' :
                          issue.category === 'segment' ? 'bg-blue-100 text-blue-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {getCategoryLabel(issue.category)}
                        </span>
                        <span className={`text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                          {getPriorityLabel(issue.priority)}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900 mt-1 truncate">{issue.name}</div>
                      <div className="text-sm text-gray-600 mt-0.5">{issue.issue}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        現在: {issue.currentValue.toFixed(1)}% → 目標: {issue.targetValue.toFixed(1)}%
                      </div>
                    </div>
                    <button
                      onClick={() => handleCreateAction(issue)}
                      className="shrink-0 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      アクション作成
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">アクション一覧</h3>
            <div className="flex gap-2 mt-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ActionStatus | 'all')}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">全ステータス</option>
                <option value="pending">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="completed">完了</option>
                <option value="overdue">期限超過</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as ActionCategory | 'all')}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">全カテゴリ</option>
                <option value="project">プロジェクト</option>
                <option value="branch">支社</option>
                <option value="segment">セグメント</option>
              </select>
            </div>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {filteredActions.length === 0 ? (
              <p className="p-4 text-gray-500 text-sm">該当するアクションがありません</p>
            ) : (
              filteredActions.map(action => (
                <div
                  key={action.id}
                  onClick={() => setSelectedAction(action)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 ${
                    selectedAction?.id === action.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(action.status)}`}>
                          {getStatusLabel(action.status)}
                        </span>
                        <span className={`text-xs font-bold ${getPriorityColor(action.priority)}`}>
                          {getPriorityLabel(action.priority)}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900 mt-1 truncate">{action.targetName}</div>
                      <div className="text-sm text-gray-600 truncate">{action.issue}</div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>担当: {action.assignee || '未定'}</span>
                        <span>期限: {formatDate(action.dueDate)}</span>
                      </div>
                    </div>
                    {action.comments.length > 0 && (
                      <span className="shrink-0 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                        {action.comments.length}件
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Detail Panel */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">アクション詳細</h3>
          </div>
          {selectedAction ? (
            <div className="p-4 space-y-4">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    selectedAction.category === 'branch' ? 'bg-purple-100 text-purple-700' :
                    selectedAction.category === 'segment' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {getCategoryLabel(selectedAction.category)}
                  </span>
                  <span className={`text-xs font-bold ${getPriorityColor(selectedAction.priority)}`}>
                    優先度: {getPriorityLabel(selectedAction.priority)}
                  </span>
                </div>
                <h4 className="font-bold text-lg text-gray-900">{selectedAction.targetName}</h4>
                <p className="text-gray-600 mt-1">{selectedAction.issue}</p>
              </div>

              {/* Metrics */}
              {selectedAction.metrics && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 mb-2">改善状況</div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{selectedAction.metrics.before.toFixed(1)}%</span>
                    <span className="text-gray-400">→</span>
                    <span className={`font-bold ${
                      selectedAction.metrics.current > selectedAction.metrics.before
                        ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {selectedAction.metrics.current.toFixed(1)}%
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-indigo-600">目標 {selectedAction.metrics.target.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0,
                          ((selectedAction.metrics.current - selectedAction.metrics.before) /
                           (selectedAction.metrics.target - selectedAction.metrics.before)) * 100
                        ))}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Action Details */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">対応アクション</label>
                  <p className="text-gray-900">{selectedAction.action || '（未設定）'}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">担当者</label>
                    <p className="text-gray-900">{selectedAction.assignee || '（未定）'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">期限</label>
                    <p className="text-gray-900">{formatDate(selectedAction.dueDate)}</p>
                  </div>
                </div>
              </div>

              {/* Status Change */}
              <div>
                <label className="text-xs text-gray-500 block mb-2">ステータス変更</label>
                <div className="flex gap-2">
                  {(['pending', 'in_progress', 'completed'] as ActionStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedAction.id, status)}
                      className={`px-3 py-1.5 text-sm rounded transition-colors ${
                        selectedAction.status === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments */}
              <div>
                <label className="text-xs text-gray-500 block mb-2">
                  コメント ({selectedAction.comments.length}件)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
                  {selectedAction.comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 rounded p-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="font-medium">{comment.author}</span>
                        <span>{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="コメントを追加..."
                    className="flex-1 px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(selectedAction.id)}
                  />
                  <button
                    onClick={() => handleAddComment(selectedAction.id)}
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    送信
                  </button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-400 pt-2 border-t">
                作成: {formatDateTime(selectedAction.createdAt)} / 更新: {formatDateTime(selectedAction.updatedAt)}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>アクションを選択してください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
