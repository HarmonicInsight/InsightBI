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

// ============================================
// 時系列分析用の型定義
// ============================================

// 観測時点の種類
export type SnapshotType = 'actual' | 'forecast' | 'budget';

// 分析期間の種類
export type AnalysisPeriod =
  | 'ytd'           // 年度累計 (Year To Date)
  | 'q1' | 'q2' | 'q3' | 'q4'  // 四半期
  | 'monthly'       // 月次
  | 'full_year';    // 通期

// 月次データポイント
export interface MonthlyDataPoint {
  period: string;              // "2025-04", "2025-05", etc.
  revenue: number;
  grossProfit: number;
  grossMarginRate: number;
  type: SnapshotType;          // 実績/見通し/予算
}

// 支社別月次データ
export interface BranchMonthlyData {
  branch: string;
  monthly: MonthlyDataPoint[];
  segments: {
    [segmentName: string]: MonthlyDataPoint[];
  };
}

// 予実比較データ
export interface BudgetActualComparison {
  period: string;
  budget: number;
  forecast: number;
  actual: number | null;       // 未確定月はnull
  budgetVariance: number;      // 予算差異 (actual - budget)
  budgetVarianceRate: number;  // 予算差異率
  yoyActual: number | null;    // 前年実績
  yoyChange: number | null;    // 前年比変動率
}

// 時系列サマリー
export interface TimeSeriesSummary {
  fiscalYear: string;
  currentMonth: string;        // 現在の観測月 "2025-09"

  // 各期間の集計
  ytd: {
    budget: number;
    forecast: number;
    actual: number;
    achievementRate: number;   // 予算達成率
  };

  fullYear: {
    budget: number;
    forecast: number;
    forecastChangeFromInitial: number; // 期初見通しからの変動
  };

  // 前年比
  yoyComparison: {
    revenueChange: number;
    profitChange: number;
    marginChange: number;
  };
}

// 時系列データ全体
export interface TimeSeriesData {
  fiscalYear: string;
  asOfDate: string;            // データ基準日
  months: string[];            // ["2025-04", "2025-05", ...]

  summary: TimeSeriesSummary;

  // 全社月次推移
  companyMonthly: {
    revenue: BudgetActualComparison[];
    grossProfit: BudgetActualComparison[];
  };

  // 支社別時系列
  branchTimeSeries: BranchMonthlyData[];

  // 見通し変動履歴（いつ時点でいくらと予想したか）
  forecastHistory: {
    asOfMonth: string;         // "2025-04", "2025-06", "2025-09"
    fullYearForecast: number;
    note?: string;
  }[];
}

// 期間セレクターの状態
export interface PeriodSelectorState {
  asOfMonth: string;           // 観測時点
  analysisPeriod: AnalysisPeriod;
  comparisonMode: 'yoy' | 'budget' | 'none';
  showBudget: boolean;
  showForecast: boolean;
  showActual: boolean;
}
