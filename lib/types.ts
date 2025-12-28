export interface Summary {
  totalRevenue: number;
  totalGrossProfit: number;
  grossMarginRate: number;
  totalRemainingWork: number;
  operatingProfit: number;
  fiscalYear: string;
  asOfDate: string;
  previousYearRevenue: number;
  previousYearGrossProfit: number;
}

export interface Targets {
  revenue: number;
  grossProfit: number;
  grossMarginRate: number;
  remainingWork: number;
  branchMarginTarget: number;
  segmentMarginTarget: number;
}

export interface Thresholds {
  marginGood: number;
  marginWarning: number;
  marginCritical: number;
  revenueAchievementGood: number;
  revenueAchievementWarning: number;
}

export interface SegmentPerformance {
  revenue: number;
  grossProfit: number;
  grossMargin: number;
}

export interface BranchTarget {
  revenue: number;
  grossProfit: number;
  grossMargin: number;
}

export interface BranchPerformance {
  branch: string;
  target?: BranchTarget;
  segments: {
    [segmentName: string]: SegmentPerformance;
  };
  total: SegmentPerformance;
}

export interface SegmentRemaining {
  remaining: number;
  expectedProfit: number;
  expectedMargin: number;
}

export interface RemainingWork {
  branch: string;
  segments: {
    [segmentName: string]: SegmentRemaining;
  };
  total: SegmentRemaining;
}

export interface SegmentImprovement {
  initialProfit: number;
  finalProfit: number;
  improvement: number;
}

export interface ProfitImprovement {
  branch: string;
  segments: {
    [segmentName: string]: SegmentImprovement;
  };
  total: SegmentImprovement;
}

export interface SalesSimulation {
  segments: string[];
  carryoverTotal: number[];
  currentForecast: number[];
  targetRevenue: number[];
  shortfall: number[];
}

export interface PerformanceData {
  summary: Summary;
  targets: Targets;
  thresholds: Thresholds;
  branchPerformance: BranchPerformance[];
  remainingWork: RemainingWork[];
  profitImprovement: ProfitImprovement[];
  salesSimulation: SalesSimulation;
}

// Status types for visual indicators
export type StatusLevel = 'good' | 'warning' | 'critical';

export interface Alert {
  id: string;
  level: StatusLevel;
  category: 'revenue' | 'margin' | 'branch' | 'segment';
  title: string;
  description: string;
  value: number;
  target?: number;
  actions: string[];
}

// Action management types
export type ActionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type ActionPriority = 'high' | 'medium' | 'low';
export type ActionCategory = 'project' | 'branch' | 'segment';

export interface ActionItem {
  id: string;
  category: ActionCategory;
  targetName: string;
  issue: string;
  action: string;
  assignee: string;
  dueDate: string;
  status: ActionStatus;
  priority: ActionPriority;
  createdAt: string;
  updatedAt: string;
  comments: ActionComment[];
  metrics?: {
    before: number;
    current: number;
    target: number;
  };
}

export interface ActionComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

// Enhanced Thread-based Comment System
export type UserRole = '経営層' | '現場担当' | '管理部門' | 'プロジェクトマネージャー';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarColor?: string;
}

export interface ThreadComment {
  id: string;
  actionId: string;
  parentId: string | null;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatarColor?: string;
  content: string;
  mentions: string[]; // User IDs mentioned
  reactions: CommentReaction[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  replies?: ThreadComment[];
}

export interface CommentReaction {
  emoji: string;
  userIds: string[];
}

// Notification System
export type NotificationType =
  | 'mention'           // @メンション通知
  | 'reply'             // 返信通知
  | 'status_change'     // ステータス変更通知
  | 'assignment'        // 担当割り当て通知
  | 'due_reminder'      // 期限リマインダー
  | 'comment'           // 新規コメント通知
  | 'reaction';         // リアクション通知

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionId?: string;
  actionTitle?: string;
  commentId?: string;
  fromUserId?: string;
  fromUserName?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  mention: boolean;
  reply: boolean;
  statusChange: boolean;
  assignment: boolean;
  dueReminder: boolean;
  comment: boolean;
  reaction: boolean;
}

export interface IssueTarget {
  category: ActionCategory;
  name: string;
  issue: string;
  currentValue: number;
  targetValue: number;
  priority: ActionPriority;
}
