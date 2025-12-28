'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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

interface ActivityEvent {
  id: string;
  type: 'comment' | 'status_change' | 'created' | 'assignee_change' | 'subtask';
  author: string;
  content: string;
  createdAt: string;
  metadata?: {
    from?: string;
    to?: string;
    mentions?: string[];
    reactions?: { emoji: string; users: string[] }[];
  };
}

interface SubTask {
  id: string;
  content: string;
  completed: boolean;
  assignee?: string;
}

interface EnhancedActionItem extends ActionItem {
  activities: ActivityEvent[];
  subTasks: SubTask[];
  watchers: string[];
}

const DEMO_USERS = [
  { id: '1', name: '山田太郎', avatar: 'YT', role: '部長' },
  { id: '2', name: '佐藤花子', avatar: 'SH', role: 'マネージャー' },
  { id: '3', name: '鈴木一郎', avatar: 'SI', role: 'リーダー' },
  { id: '4', name: '田中美咲', avatar: 'TM', role: '担当' },
  { id: '5', name: '高橋健二', avatar: 'TK', role: '担当' },
];

const CURRENT_USER = DEMO_USERS[0];

type UserFilter = 'all' | 'mine' | 'watching';
type DateFilter = 'all' | 'overdue' | 'this_week' | 'this_month' | 'this_quarter';
type SortOption = 'due_date' | 'priority' | 'updated' | 'created';

export default function ActionTracker({ data }: ActionTrackerProps) {
  const [actions, setActions] = useState<EnhancedActionItem[]>(() => generateInitialActions());
  const [selectedAction, setSelectedAction] = useState<EnhancedActionItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<ActionStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ActionCategory | 'all'>('all');
  const [filterUser, setFilterUser] = useState<UserFilter>('all');
  const [filterDate, setFilterDate] = useState<DateFilter>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('due_date');
  const [showArchived, setShowArchived] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ action: '', assignee: '', dueDate: '' });
  const [newSubTask, setNewSubTask] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Detect issues from performance data
  const detectedIssues = useMemo((): IssueTarget[] => {
    const issues: IssueTarget[] = [];
    const marginThreshold = data.thresholds.marginWarning;

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

  const filteredActions = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const quarterLater = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    let filtered = actions.filter(action => {
      // Status filter
      if (filterStatus !== 'all' && action.status !== filterStatus) return false;

      // Category filter
      if (filterCategory !== 'all' && action.category !== filterCategory) return false;

      // User filter
      if (filterUser === 'mine' && action.assignee !== CURRENT_USER.name) return false;
      if (filterUser === 'watching' && !action.watchers.includes(CURRENT_USER.name)) return false;

      // Assignee filter
      if (filterAssignee !== 'all' && action.assignee !== filterAssignee) return false;

      // Date filter
      if (filterDate !== 'all') {
        const dueDate = new Date(action.dueDate);
        switch (filterDate) {
          case 'overdue':
            if (dueDate >= now || action.status === 'completed') return false;
            break;
          case 'this_week':
            if (dueDate > weekLater || action.status === 'completed') return false;
            break;
          case 'this_month':
            if (dueDate > monthLater || action.status === 'completed') return false;
            break;
          case 'this_quarter':
            if (dueDate > quarterLater || action.status === 'completed') return false;
            break;
        }
      }

      // Archive filter (completed actions older than 30 days)
      if (!showArchived && action.status === 'completed') {
        const completedDate = new Date(action.updatedAt);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (completedDate < thirtyDaysAgo) return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTarget = action.targetName.toLowerCase().includes(query);
        const matchesIssue = action.issue.toLowerCase().includes(query);
        const matchesAction = action.action.toLowerCase().includes(query);
        const matchesAssignee = action.assignee.toLowerCase().includes(query);
        if (!matchesTarget && !matchesIssue && !matchesAction && !matchesAssignee) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [actions, filterStatus, filterCategory, filterUser, filterDate, filterAssignee, searchQuery, sortBy, showArchived]);

  const stats = useMemo(() => {
    const total = actions.length;
    const pending = actions.filter(a => a.status === 'pending').length;
    const inProgress = actions.filter(a => a.status === 'in_progress').length;
    const completed = actions.filter(a => a.status === 'completed').length;
    const overdue = actions.filter(a => a.status === 'overdue').length;
    const thisWeekDue = actions.filter(a => {
      const due = new Date(a.dueDate);
      const now = new Date();
      const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return due <= weekLater && a.status !== 'completed';
    }).length;
    return { total, pending, inProgress, completed, overdue, thisWeekDue };
  }, [actions]);

  function generateInitialActions(): EnhancedActionItem[] {
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
        comments: [],
        metrics: { before: 8.5, current: 9.2, target: 14.0 },
        watchers: ['佐藤花子', '鈴木一郎'],
        subTasks: [
          { id: 's1', content: '過去6ヶ月のプロジェクトデータを収集', completed: true, assignee: '田中美咲' },
          { id: 's2', content: '低採算案件のリストアップ', completed: true, assignee: '田中美咲' },
          { id: 's3', content: '原因分析レポート作成', completed: false, assignee: '山田太郎' },
          { id: 's4', content: '改善施策の提案', completed: false, assignee: '山田太郎' },
        ],
        activities: [
          {
            id: 'a1',
            type: 'created',
            author: '佐藤花子',
            content: 'アクションを作成しました',
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'a2',
            type: 'assignee_change',
            author: '佐藤花子',
            content: '担当者を変更しました',
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { from: '未定', to: '山田太郎' }
          },
          {
            id: 'a3',
            type: 'status_change',
            author: '山田太郎',
            content: 'ステータスを変更しました',
            createdAt: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { from: '未着手', to: '進行中' }
          },
          {
            id: 'a4',
            type: 'comment',
            author: '山田太郎',
            content: '分析を開始しました。@佐藤花子 来週中にレポートを提出予定です。進捗があればまた報告します。',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { mentions: ['佐藤花子'], reactions: [{ emoji: '👍', users: ['佐藤花子', '鈴木一郎'] }] }
          },
          {
            id: 'a5',
            type: 'subtask',
            author: '田中美咲',
            content: 'サブタスク「過去6ヶ月のプロジェクトデータを収集」を完了しました',
            createdAt: new Date(now.getTime() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'a6',
            type: 'comment',
            author: '佐藤花子',
            content: '@山田太郎 ありがとうございます。分析結果を楽しみにしています。特に大型案件の収益性について詳しく見てください。',
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { mentions: ['山田太郎'] }
          },
        ]
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
        metrics: { before: 11.2, current: 11.2, target: 15.0 },
        watchers: ['山田太郎'],
        subTasks: [],
        activities: [
          {
            id: 'a1',
            type: 'created',
            author: '山田太郎',
            content: 'アクションを作成しました',
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ]
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
        comments: [],
        metrics: { before: -5.2, current: -3.1, target: 10.0 },
        watchers: ['山田太郎', '佐藤花子'],
        subTasks: [
          { id: 's1', content: '追加工数の詳細分析', completed: true },
          { id: 's2', content: '顧客への説明資料作成', completed: false },
          { id: 's3', content: '交渉ミーティングの設定', completed: false },
        ],
        activities: [
          {
            id: 'a1',
            type: 'created',
            author: '佐藤花子',
            content: 'アクションを作成しました',
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'a2',
            type: 'comment',
            author: '鈴木一郎',
            content: '@山田太郎 @佐藤花子 顧客との調整が難航しています。上長のサポートをお願いできますか？先方は追加請求に難色を示しています。',
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { mentions: ['山田太郎', '佐藤花子'], reactions: [{ emoji: '👀', users: ['山田太郎'] }] }
          },
          {
            id: 'a3',
            type: 'comment',
            author: '山田太郎',
            content: '@鈴木一郎 了解しました。来週の顧客ミーティングに同席します。事前に資料を共有してください。',
            createdAt: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { mentions: ['鈴木一郎'], reactions: [{ emoji: '🙏', users: ['鈴木一郎'] }] }
          },
        ]
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
        comments: [],
        metrics: { before: 10.8, current: 11.5, target: 14.0 },
        watchers: ['山田太郎'],
        subTasks: [
          { id: 's1', content: '現行契約の分析', completed: true },
          { id: 's2', content: '改定案の作成', completed: false },
          { id: 's3', content: 'パートナーとの交渉', completed: false },
        ],
        activities: [
          {
            id: 'a1',
            type: 'created',
            author: '山田太郎',
            content: 'アクションを作成しました',
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'a2',
            type: 'comment',
            author: '田中美咲',
            content: 'シンガポールオフィスとのミーティングを設定しました。来週火曜日14:00（日本時間）です。',
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { reactions: [{ emoji: '👍', users: ['山田太郎'] }] }
          },
          {
            id: 'a3',
            type: 'comment',
            author: '高橋健二',
            content: '契約書のドラフトを準備中です。@田中美咲 明日までにレビュー用のファイルを共有します。',
            createdAt: new Date(now.getTime() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
            metadata: { mentions: ['田中美咲'] }
          },
        ]
      }
    ];
  }

  const handleStatusChange = (actionId: string, newStatus: ActionStatus) => {
    const oldAction = actions.find(a => a.id === actionId);
    if (!oldAction) return;

    const activity: ActivityEvent = {
      id: `act${Date.now()}`,
      type: 'status_change',
      author: CURRENT_USER.name,
      content: 'ステータスを変更しました',
      createdAt: new Date().toISOString(),
      metadata: { from: getStatusLabel(oldAction.status), to: getStatusLabel(newStatus) }
    };

    setActions(prev => prev.map(action =>
      action.id === actionId
        ? { ...action, status: newStatus, updatedAt: new Date().toISOString(), activities: [...action.activities, activity] }
        : action
    ));
    if (selectedAction?.id === actionId) {
      setSelectedAction(prev => prev ? {
        ...prev,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        activities: [...prev.activities, activity]
      } : null);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedAction) return;

    const mentions = newComment.match(/@(\S+)/g)?.map(m => m.slice(1)) || [];

    const activity: ActivityEvent = {
      id: `act${Date.now()}`,
      type: 'comment',
      author: CURRENT_USER.name,
      content: newComment,
      createdAt: new Date().toISOString(),
      metadata: { mentions, reactions: [] }
    };

    setActions(prev => prev.map(action =>
      action.id === selectedAction.id
        ? { ...action, activities: [...action.activities, activity], updatedAt: new Date().toISOString() }
        : action
    ));

    setSelectedAction(prev => prev ? {
      ...prev,
      activities: [...prev.activities, activity],
      updatedAt: new Date().toISOString()
    } : null);

    setNewComment('');
  };

  const handleAddReaction = (activityId: string, emoji: string) => {
    if (!selectedAction) return;

    setActions(prev => prev.map(action => {
      if (action.id !== selectedAction.id) return action;

      return {
        ...action,
        activities: action.activities.map(act => {
          if (act.id !== activityId) return act;

          const reactions = act.metadata?.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);

          if (existingReaction) {
            if (existingReaction.users.includes(CURRENT_USER.name)) {
              return {
                ...act,
                metadata: {
                  ...act.metadata,
                  reactions: reactions.map(r =>
                    r.emoji === emoji
                      ? { ...r, users: r.users.filter(u => u !== CURRENT_USER.name) }
                      : r
                  ).filter(r => r.users.length > 0)
                }
              };
            } else {
              return {
                ...act,
                metadata: {
                  ...act.metadata,
                  reactions: reactions.map(r =>
                    r.emoji === emoji
                      ? { ...r, users: [...r.users, CURRENT_USER.name] }
                      : r
                  )
                }
              };
            }
          } else {
            return {
              ...act,
              metadata: {
                ...act.metadata,
                reactions: [...reactions, { emoji, users: [CURRENT_USER.name] }]
              }
            };
          }
        })
      };
    }));

    // Update selected action
    setSelectedAction(prev => {
      if (!prev) return null;
      return {
        ...prev,
        activities: prev.activities.map(act => {
          if (act.id !== activityId) return act;

          const reactions = act.metadata?.reactions || [];
          const existingReaction = reactions.find(r => r.emoji === emoji);

          if (existingReaction) {
            if (existingReaction.users.includes(CURRENT_USER.name)) {
              return {
                ...act,
                metadata: {
                  ...act.metadata,
                  reactions: reactions.map(r =>
                    r.emoji === emoji
                      ? { ...r, users: r.users.filter(u => u !== CURRENT_USER.name) }
                      : r
                  ).filter(r => r.users.length > 0)
                }
              };
            } else {
              return {
                ...act,
                metadata: {
                  ...act.metadata,
                  reactions: reactions.map(r =>
                    r.emoji === emoji
                      ? { ...r, users: [...r.users, CURRENT_USER.name] }
                      : r
                  )
                }
              };
            }
          } else {
            return {
              ...act,
              metadata: {
                ...act.metadata,
                reactions: [...reactions, { emoji, users: [CURRENT_USER.name] }]
              }
            };
          }
        })
      };
    });
  };

  const handleToggleSubTask = (subTaskId: string) => {
    if (!selectedAction) return;

    setActions(prev => prev.map(action => {
      if (action.id !== selectedAction.id) return action;

      const updatedSubTasks = action.subTasks.map(st =>
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      );

      const toggledTask = action.subTasks.find(st => st.id === subTaskId);
      const newActivity: ActivityEvent = {
        id: `act${Date.now()}`,
        type: 'subtask',
        author: CURRENT_USER.name,
        content: `サブタスク「${toggledTask?.content}」を${toggledTask?.completed ? '未完了に戻し' : '完了し'}ました`,
        createdAt: new Date().toISOString(),
      };

      return {
        ...action,
        subTasks: updatedSubTasks,
        activities: [...action.activities, newActivity],
        updatedAt: new Date().toISOString()
      };
    }));

    setSelectedAction(prev => {
      if (!prev) return null;
      const updatedSubTasks = prev.subTasks.map(st =>
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
      );
      const toggledTask = prev.subTasks.find(st => st.id === subTaskId);
      const newActivity: ActivityEvent = {
        id: `act${Date.now()}`,
        type: 'subtask',
        author: CURRENT_USER.name,
        content: `サブタスク「${toggledTask?.content}」を${toggledTask?.completed ? '未完了に戻し' : '完了し'}ました`,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        subTasks: updatedSubTasks,
        activities: [...prev.activities, newActivity],
        updatedAt: new Date().toISOString()
      };
    });
  };

  const handleAddSubTask = () => {
    if (!newSubTask.trim() || !selectedAction) return;

    const subTask: SubTask = {
      id: `st${Date.now()}`,
      content: newSubTask,
      completed: false
    };

    setActions(prev => prev.map(action =>
      action.id === selectedAction.id
        ? { ...action, subTasks: [...action.subTasks, subTask] }
        : action
    ));

    setSelectedAction(prev => prev ? {
      ...prev,
      subTasks: [...prev.subTasks, subTask]
    } : null);

    setNewSubTask('');
  };

  const handleCreateAction = (issue: IssueTarget) => {
    const newAction: EnhancedActionItem = {
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
      metrics: { before: issue.currentValue, current: issue.currentValue, target: issue.targetValue },
      watchers: [],
      subTasks: [],
      activities: [{
        id: `act${Date.now()}`,
        type: 'created',
        author: CURRENT_USER.name,
        content: 'アクションを作成しました',
        createdAt: new Date().toISOString(),
      }]
    };
    setActions(prev => [...prev, newAction]);
    setSelectedAction(newAction);
    setIsEditing(true);
    setEditForm({ action: '', assignee: '', dueDate: newAction.dueDate });
  };

  const handleSaveEdit = () => {
    if (!selectedAction) return;

    const changes: string[] = [];
    if (editForm.action !== selectedAction.action) changes.push('アクション内容');
    if (editForm.assignee !== selectedAction.assignee) changes.push('担当者');
    if (editForm.dueDate !== selectedAction.dueDate) changes.push('期限');

    const activities = [...selectedAction.activities];

    if (editForm.assignee !== selectedAction.assignee) {
      activities.push({
        id: `act${Date.now()}`,
        type: 'assignee_change',
        author: CURRENT_USER.name,
        content: '担当者を変更しました',
        createdAt: new Date().toISOString(),
        metadata: { from: selectedAction.assignee || '未定', to: editForm.assignee || '未定' }
      });
    }

    setActions(prev => prev.map(action =>
      action.id === selectedAction.id
        ? {
            ...action,
            action: editForm.action,
            assignee: editForm.assignee,
            dueDate: editForm.dueDate,
            updatedAt: new Date().toISOString(),
            activities
          }
        : action
    ));

    setSelectedAction(prev => prev ? {
      ...prev,
      action: editForm.action,
      assignee: editForm.assignee,
      dueDate: editForm.dueDate,
      updatedAt: new Date().toISOString(),
      activities
    } : null);

    setIsEditing(false);
  };

  const handleMentionSelect = (userName: string) => {
    setNewComment(prev => prev.replace(/@\S*$/, `@${userName} `));
    setShowMentionList(false);
    commentInputRef.current?.focus();
  };

  const handleCommentChange = (value: string) => {
    setNewComment(value);
    const lastAtMatch = value.match(/@(\S*)$/);
    if (lastAtMatch) {
      setMentionSearch(lastAtMatch[1]);
      setShowMentionList(true);
    } else {
      setShowMentionList(false);
    }
  };

  const filteredUsers = DEMO_USERS.filter(user =>
    user.name.toLowerCase().includes(mentionSearch.toLowerCase())
  );

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

  const getCategoryColor = (category: ActionCategory) => {
    switch (category) {
      case 'branch': return 'bg-purple-100 text-purple-700';
      case 'segment': return 'bg-blue-100 text-blue-700';
      case 'project': return 'bg-green-100 text-green-700';
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

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    if (days < 7) return `${days}日前`;
    return formatDate(dateStr);
  };

  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'comment':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'status_change':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'created':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'assignee_change':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'subtask':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
    }
  };

  const renderHighlightedContent = (content: string) => {
    const parts = content.split(/(@\S+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="text-indigo-600 font-medium bg-indigo-50 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500">全アクション</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-2xl font-bold text-gray-500">{stats.pending}</div>
          <div className="text-xs text-gray-500">未着手</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-gray-500">進行中</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-gray-500">完了</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-red-200 bg-red-50">
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-xs text-red-600">期限超過</div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-amber-200 bg-amber-50">
          <div className="text-2xl font-bold text-amber-600">{stats.thisWeekDue}</div>
          <div className="text-xs text-amber-600">今週期限</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Issues Detection */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm border">
          <div className="p-3 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <span className="text-red-500">⚠</span>
              検出された課題
            </h3>
          </div>
          <div className="p-2 space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
            {detectedIssues.length === 0 ? (
              <p className="text-gray-500 text-sm p-2">課題なし</p>
            ) : (
              detectedIssues.slice(0, 8).map((issue, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getCategoryColor(issue.category)}`}>
                      {getCategoryLabel(issue.category)}
                    </span>
                    <span className={`text-xs font-bold ${getPriorityColor(issue.priority)}`}>
                      {getPriorityLabel(issue.priority)}
                    </span>
                  </div>
                  <div className="font-medium text-gray-900 truncate">{issue.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {issue.currentValue.toFixed(1)}% → {issue.targetValue.toFixed(1)}%
                  </div>
                  <button
                    onClick={() => handleCreateAction(issue)}
                    className="mt-2 w-full px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    アクション作成
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Middle: Action List */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border">
          <div className="p-3 border-b space-y-2">
            {/* Header with search */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">アクション一覧</h3>
              <span className="text-xs text-gray-500">{filteredActions.length}件</span>
            </div>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="案件名、課題、担当者で検索..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Quick filters */}
            <div className="flex gap-1">
              <button
                onClick={() => setFilterUser('mine')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filterUser === 'mine' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                自分の担当
              </button>
              <button
                onClick={() => setFilterUser('watching')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filterUser === 'watching' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ウォッチ中
              </button>
              <button
                onClick={() => setFilterUser('all')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  filterUser === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全員
              </button>
            </div>

            {/* Filters row 1 */}
            <div className="flex gap-1">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ActionStatus | 'all')}
                className="text-xs border rounded px-1.5 py-1 flex-1"
              >
                <option value="all">全ステータス</option>
                <option value="pending">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="completed">完了</option>
                <option value="overdue">期限超過</option>
              </select>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as DateFilter)}
                className="text-xs border rounded px-1.5 py-1 flex-1"
              >
                <option value="all">全期間</option>
                <option value="overdue">期限切れ</option>
                <option value="this_week">今週期限</option>
                <option value="this_month">今月期限</option>
                <option value="this_quarter">3ヶ月以内</option>
              </select>
            </div>

            {/* Filters row 2 */}
            <div className="flex gap-1">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as ActionCategory | 'all')}
                className="text-xs border rounded px-1.5 py-1 flex-1"
              >
                <option value="all">全カテゴリ</option>
                <option value="project">プロジェクト</option>
                <option value="branch">支社</option>
                <option value="segment">セグメント</option>
              </select>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="text-xs border rounded px-1.5 py-1 flex-1"
              >
                <option value="all">全担当者</option>
                {DEMO_USERS.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Sort and archive */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">並び替え:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-xs border rounded px-1.5 py-0.5"
                >
                  <option value="due_date">期限順</option>
                  <option value="priority">優先度順</option>
                  <option value="updated">更新順</option>
                  <option value="created">作成順</option>
                </select>
              </div>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                アーカイブ表示
              </label>
            </div>
          </div>
          <div className="divide-y max-h-[calc(100vh-480px)] overflow-y-auto">
            {filteredActions.map(action => (
              <div
                key={action.id}
                onClick={() => {
                  setSelectedAction(action);
                  setIsEditing(false);
                  setEditForm({ action: action.action, assignee: action.assignee, dueDate: action.dueDate });
                }}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${
                  selectedAction?.id === action.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${getStatusColor(action.status)}`}>
                    {getStatusLabel(action.status)}
                  </span>
                  <span className={`text-xs font-bold ${getPriorityColor(action.priority)}`}>
                    {getPriorityLabel(action.priority)}
                  </span>
                </div>
                <div className="font-medium text-gray-900 text-sm truncate">{action.targetName}</div>
                <div className="text-xs text-gray-600 truncate">{action.issue}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{action.assignee || '未定'}</span>
                    <span>{formatDate(action.dueDate)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {action.activities.filter(a => a.type === 'comment').length > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {action.activities.filter(a => a.type === 'comment').length}
                      </span>
                    )}
                    {action.subTasks.length > 0 && (
                      <span className="text-xs text-gray-400">
                        {action.subTasks.filter(s => s.completed).length}/{action.subTasks.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Action Detail with Thread */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border flex flex-col max-h-[calc(100vh-280px)]">
          {selectedAction ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getCategoryColor(selectedAction.category)}`}>
                        {getCategoryLabel(selectedAction.category)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${getStatusColor(selectedAction.status)}`}>
                        {getStatusLabel(selectedAction.status)}
                      </span>
                      <span className={`text-xs font-bold ${getPriorityColor(selectedAction.priority)}`}>
                        優先度: {getPriorityLabel(selectedAction.priority)}
                      </span>
                    </div>
                    <h4 className="font-bold text-lg text-gray-900">{selectedAction.targetName}</h4>
                    <p className="text-gray-600 text-sm mt-1">{selectedAction.issue}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setEditForm({
                        action: selectedAction.action,
                        assignee: selectedAction.assignee,
                        dueDate: selectedAction.dueDate
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>

                {/* Edit Form or Details */}
                {isEditing ? (
                  <div className="mt-4 space-y-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">対応アクション</label>
                      <textarea
                        value={editForm.action}
                        onChange={(e) => setEditForm(prev => ({ ...prev, action: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows={2}
                        placeholder="具体的なアクションを入力..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">担当者</label>
                        <select
                          value={editForm.assignee}
                          onChange={(e) => setEditForm(prev => ({ ...prev, assignee: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">未定</option>
                          {DEMO_USERS.map(user => (
                            <option key={user.id} value={user.name}>{user.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-1">期限</label>
                        <input
                          type="date"
                          value={editForm.dueDate}
                          onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-gray-500">対応アクション</span>
                      <p className="text-gray-900">{selectedAction.action || '（未設定）'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">担当者</span>
                      <p className="text-gray-900">{selectedAction.assignee || '（未定）'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">期限</span>
                      <p className="text-gray-900">{formatDate(selectedAction.dueDate)}</p>
                    </div>
                  </div>
                )}

                {/* Metrics */}
                {selectedAction.metrics && !isEditing && (
                  <div className="mt-3 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">改善状況</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{selectedAction.metrics.before.toFixed(1)}%</span>
                        <span className="text-gray-300">→</span>
                        <span className={`font-bold ${
                          selectedAction.metrics.current > selectedAction.metrics.before ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {selectedAction.metrics.current.toFixed(1)}%
                        </span>
                        <span className="text-gray-300">→</span>
                        <span className="text-indigo-600 font-medium">{selectedAction.metrics.target.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all"
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

                {/* Status Change */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">ステータス:</span>
                  {(['pending', 'in_progress', 'completed'] as ActionStatus[]).map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(selectedAction.id, status)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        selectedAction.status === status
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>

                {/* Sub Tasks */}
                {(selectedAction.subTasks.length > 0 || !isEditing) && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        サブタスク ({selectedAction.subTasks.filter(s => s.completed).length}/{selectedAction.subTasks.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {selectedAction.subTasks.map(task => (
                        <div
                          key={task.id}
                          onClick={() => handleToggleSubTask(task.id)}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'
                          }`}>
                            {task.completed && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm flex-1 ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                            {task.content}
                          </span>
                          {task.assignee && (
                            <span className="text-xs text-gray-400">{task.assignee}</span>
                          )}
                        </div>
                      ))}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={newSubTask}
                          onChange={(e) => setNewSubTask(e.target.value)}
                          placeholder="サブタスクを追加..."
                          className="flex-1 px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubTask()}
                        />
                        <button
                          onClick={handleAddSubTask}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          追加
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Activity Timeline / Thread */}
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-medium text-gray-700">アクティビティ</h5>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('timeline')}
                      className={`p-1 rounded ${viewMode === 'timeline' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedAction.activities.map((activity, idx) => (
                    <div
                      key={activity.id}
                      className={`${viewMode === 'timeline' ? 'relative pl-6' : ''}`}
                    >
                      {viewMode === 'timeline' && (
                        <>
                          <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-indigo-400 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          </div>
                          {idx < selectedAction.activities.length - 1 && (
                            <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-gray-200" style={{ height: 'calc(100% + 12px)' }} />
                          )}
                        </>
                      )}

                      {activity.type === 'comment' ? (
                        <div className="bg-white rounded-lg p-3 shadow-sm border">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">
                              {DEMO_USERS.find(u => u.name === activity.author)?.avatar || activity.author.slice(0, 2)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 text-sm">{activity.author}</span>
                                <span className="text-xs text-gray-400">{formatRelativeTime(activity.createdAt)}</span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                                {renderHighlightedContent(activity.content)}
                              </p>

                              {/* Reactions */}
                              <div className="flex items-center gap-2 mt-2">
                                {activity.metadata?.reactions?.map((reaction, i) => (
                                  <button
                                    key={i}
                                    onClick={() => handleAddReaction(activity.id, reaction.emoji)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                                      reaction.users.includes(CURRENT_USER.name)
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span>{reaction.users.length}</span>
                                  </button>
                                ))}
                                <div className="relative group">
                                  <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </button>
                                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:flex bg-white rounded-lg shadow-lg border p-1 gap-1">
                                    {['👍', '👀', '🙏', '✅', '❤️'].map(emoji => (
                                      <button
                                        key={emoji}
                                        onClick={() => handleAddReaction(activity.id, emoji)}
                                        className="p-1 hover:bg-gray-100 rounded"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-1">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            {getActivityIcon(activity.type)}
                          </div>
                          <span className="font-medium text-gray-700">{activity.author}</span>
                          <span>{activity.content}</span>
                          {activity.metadata?.from && activity.metadata?.to && (
                            <span className="text-gray-400">
                              ({activity.metadata.from} → {activity.metadata.to})
                            </span>
                          )}
                          <span className="text-xs text-gray-400">{formatRelativeTime(activity.createdAt)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t bg-white flex-shrink-0">
                <div className="relative">
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => handleCommentChange(e.target.value)}
                    placeholder="コメントを入力... (@でメンション)"
                    className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                  />

                  {/* Mention Dropdown */}
                  {showMentionList && filteredUsers.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-1 w-64 bg-white rounded-lg shadow-lg border max-h-48 overflow-y-auto">
                      {filteredUsers.map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleMentionSelect(user.name)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                        >
                          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                            {user.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.role}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-400">
                    Shift+Enter で改行 / Enter で送信
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    送信
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>アクションを選択してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
