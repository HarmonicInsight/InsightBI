// 案件パイプラインデータ（Sales Insightから取得想定）

// データ取得時点
export const pipelineAsOf = '2025-09-15 18:00';

export type PipelineStage = 'A' | 'B' | 'C' | 'D' | 'O';

// プロジェクトタイプ
export type ProjectType = 'new' | 'continue';

// サブチーム定義
export interface SubTeam {
  id: string;
  name: string;
  departmentId: string;
}

export const subTeams: SubTeam[] = [
  { id: 'bizit', name: '業務ITT', departmentId: 'sales1' },
  { id: 'bizimprove', name: '業務改善T', departmentId: 'sales1' },
  { id: 'manufacturing', name: '製造T', departmentId: 'sales2' },
  { id: 'presales', name: 'PreSales', departmentId: 'sales3' },
];

// イベントタイプ
export type PipelineEventType = 'initial_contact' | 'proposal' | 'negotiation' | 'contract' | 'delivery' | 'other';

export interface PipelineEventConfig {
  id: PipelineEventType;
  name: string;
  color: string;
  bgColor: string;
}

export const pipelineEventTypes: PipelineEventConfig[] = [
  { id: 'initial_contact', name: '初回接触', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { id: 'proposal', name: '提案', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'negotiation', name: '交渉', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { id: 'contract', name: '契約', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { id: 'delivery', name: '納品', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { id: 'other', name: 'その他', color: 'text-gray-500', bgColor: 'bg-gray-100' },
];

// パイプラインイベント
export interface PipelineEvent {
  id: string;
  type: PipelineEventType;
  date: string; // YYYY-MM-DD
  note?: string;
}

// 部署定義
export interface Department {
  id: string;
  name: string;
  target: number; // 通期目標（億円）
  confirmedYTD: number; // 確定売上（億円）
}

export const departments: Department[] = [
  { id: 'sales1', name: '営業1部', target: 70, confirmedYTD: 18.5 },
  { id: 'sales2', name: '営業2部', target: 65, confirmedYTD: 15.2 },
  { id: 'sales3', name: '営業3部', target: 65, confirmedYTD: 12.8 },
];

export interface PipelineStageConfig {
  id: PipelineStage;
  name: string;
  probability: number; // %
  color: string;
  bgColor: string;
  description: string;
}

// 月別売上配分
export type MonthlyRevenue = {
  [month: number]: number; // 月 -> 売上（億円）
};

export interface PipelineItem {
  id: string;
  name: string;
  amount: number; // 億円（合計）
  stage: PipelineStage;
  expectedCloseMonth: number; // 主な受注月 1-12
  customer: string;
  owner: string;
  departmentId: string; // 部署ID
  subTeamId?: string; // サブチームID
  projectType?: ProjectType; // 新規/継続
  grossMarginRate?: number; // 粗利率 (0-1)
  members?: string[]; // 担当メンバー（複数）
  comment?: string; // コメント
  events?: PipelineEvent[]; // イベント履歴
  nextAction?: string; // 次のアクション
  nextActionDate?: string; // 次のアクション日
  monthlyRevenue?: MonthlyRevenue; // 月別売上配分
}

export interface PipelineSummary {
  stage: PipelineStage;
  count: number;
  totalAmount: number;
  weightedAmount: number; // 金額 × 確度
}

// 案件ステージ定義（Excelの確度定義に準拠）
// A: 受注確定・契約済み (100%)
// B: 受注したが契約未締結 (99%)
// C: A/Bの継続案件で受注ほぼ確定 (80%)
// D: 提案実施済みだが受注可否未定 (50%)
// O: 白地・オポチュニティ認識レベル (20%以下)
export const pipelineStages: PipelineStageConfig[] = [
  { id: 'A', name: 'A案件', probability: 100, color: 'text-emerald-700', bgColor: 'bg-emerald-100', description: '受注確定・契約済み' },
  { id: 'B', name: 'B案件', probability: 99, color: 'text-blue-700', bgColor: 'bg-blue-100', description: '受注・契約未締結' },
  { id: 'C', name: 'C案件', probability: 80, color: 'text-cyan-700', bgColor: 'bg-cyan-100', description: '継続案件・受注見込み' },
  { id: 'D', name: 'D案件', probability: 50, color: 'text-amber-700', bgColor: 'bg-amber-100', description: '提案済み・可否未定' },
  { id: 'O', name: 'O案件', probability: 20, color: 'text-slate-500', bgColor: 'bg-slate-100', description: '白地・情報収集段階' },
];

// サンプルパイプラインデータ（実際はSales Insightから取得）
export const pipelineData: PipelineItem[] = [
  // A案件（100%）- 受注確定・契約済み
  { id: 'A001', name: '○○ビル新築工事', amount: 8.5, stage: 'A', expectedCloseMonth: 10, customer: '○○不動産', owner: '田中', departmentId: 'sales1',
    subTeamId: 'bizit', projectType: 'new', grossMarginRate: 0.35, members: ['田中', '佐藤'],
    monthlyRevenue: { 10: 2.0, 11: 3.0, 12: 2.0, 1: 1.5 },
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-04-10', note: '紹介で初回訪問' },
      { id: 'e2', type: 'proposal', date: '2025-05-20', note: '概算見積提出' },
      { id: 'e3', type: 'contract', date: '2025-09-01', note: '契約締結' },
    ],
    nextAction: '着工準備', nextActionDate: '2025-10-05' },
  { id: 'A002', name: '△△マンション改修', amount: 4.2, stage: 'A', expectedCloseMonth: 11, customer: '△△管理組合', owner: '佐藤', departmentId: 'sales1',
    subTeamId: 'bizimprove', projectType: 'continue', grossMarginRate: 0.42, members: ['佐藤'],
    monthlyRevenue: { 11: 1.5, 12: 1.5, 1: 1.2 },
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-03-15' },
      { id: 'e2', type: 'contract', date: '2025-09-10' },
    ],
    nextAction: '理事会報告', nextActionDate: '2025-10-20' },
  { id: 'A003', name: '□□工場増設', amount: 6.8, stage: 'A', expectedCloseMonth: 12, customer: '□□製作所', owner: '鈴木', departmentId: 'sales2',
    subTeamId: 'manufacturing', projectType: 'continue', grossMarginRate: 0.38, members: ['鈴木', '高橋'],
    monthlyRevenue: { 12: 2.5, 1: 2.5, 2: 1.8 },
    events: [
      { id: 'e1', type: 'proposal', date: '2025-07-10' },
      { id: 'e2', type: 'contract', date: '2025-09-15' },
    ] },
  { id: 'A004', name: '◇◇病院リニューアル', amount: 3.5, stage: 'A', expectedCloseMonth: 1, customer: '◇◇医療法人', owner: '高橋', departmentId: 'sales3',
    subTeamId: 'presales', projectType: 'new', grossMarginRate: 0.45, members: ['高橋'],
    monthlyRevenue: { 1: 1.5, 2: 1.0, 3: 1.0 },
    events: [
      { id: 'e1', type: 'contract', date: '2025-08-20' },
    ] },

  // B案件（99%）- 受注したが契約未締結
  { id: 'B001', name: '××商業施設', amount: 12.0, stage: 'B', expectedCloseMonth: 11, customer: '××リテール', owner: '伊藤', departmentId: 'sales1',
    subTeamId: 'bizit', projectType: 'new', grossMarginRate: 0.32, members: ['伊藤', '田中'],
    monthlyRevenue: { 11: 3.0, 12: 4.0, 1: 3.0, 2: 2.0 },
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-05-01' },
      { id: 'e2', type: 'proposal', date: '2025-08-10' },
    ],
    nextAction: '契約書作成', nextActionDate: '2025-10-10' },
  { id: 'B002', name: '▽▽オフィスビル', amount: 7.5, stage: 'B', expectedCloseMonth: 12, customer: '▽▽商事', owner: '渡辺', departmentId: 'sales2',
    subTeamId: 'manufacturing', projectType: 'new', grossMarginRate: 0.28, members: ['渡辺'],
    monthlyRevenue: { 12: 2.5, 1: 2.5, 2: 2.5 },
    events: [
      { id: 'e1', type: 'proposal', date: '2025-07-15' },
    ] },
  { id: 'B003', name: '◎◎物流センター', amount: 9.0, stage: 'B', expectedCloseMonth: 1, customer: '◎◎物流', owner: '山本', departmentId: 'sales2',
    subTeamId: 'manufacturing', projectType: 'new', grossMarginRate: 0.35, members: ['山本', '鈴木'],
    monthlyRevenue: { 1: 3.0, 2: 3.0, 3: 3.0 } },
  { id: 'B004', name: '☆☆学校体育館', amount: 4.5, stage: 'B', expectedCloseMonth: 2, customer: '☆☆市教育委員会', owner: '中村', departmentId: 'sales3',
    subTeamId: 'presales', projectType: 'new', grossMarginRate: 0.40, members: ['中村'],
    monthlyRevenue: { 2: 2.0, 3: 2.5 } },
  { id: 'B005', name: '◆◆ホテル改装', amount: 5.8, stage: 'B', expectedCloseMonth: 3, customer: '◆◆観光', owner: '小林', departmentId: 'sales3',
    subTeamId: 'presales', projectType: 'continue', grossMarginRate: 0.38, members: ['小林'],
    monthlyRevenue: { 3: 5.8 } },

  // C案件（80%）- 継続案件・受注見込み
  { id: 'C001', name: '●●タワー新築', amount: 25.0, stage: 'C', expectedCloseMonth: 2, customer: '●●開発', owner: '加藤', departmentId: 'sales1',
    subTeamId: 'bizit', projectType: 'continue', grossMarginRate: 0.30, members: ['加藤', '田中'],
    monthlyRevenue: { 2: 5.0, 3: 8.0 },
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-06-01' },
    ],
    nextAction: '提案書作成', nextActionDate: '2025-10-15' },
  { id: 'C002', name: '■■工場移転', amount: 15.0, stage: 'C', expectedCloseMonth: 3, customer: '■■工業', owner: '吉田', departmentId: 'sales2',
    subTeamId: 'manufacturing', projectType: 'continue', grossMarginRate: 0.33, members: ['吉田'],
    monthlyRevenue: { 3: 5.0 } },
  { id: 'C003', name: '▲▲研究施設', amount: 8.5, stage: 'C', expectedCloseMonth: 3, customer: '▲▲製薬', owner: '山田', departmentId: 'sales2',
    subTeamId: 'manufacturing', projectType: 'new', grossMarginRate: 0.36, members: ['山田'],
    monthlyRevenue: { 3: 3.0 } },
  { id: 'C004', name: '★★データセンター', amount: 18.0, stage: 'C', expectedCloseMonth: 3, customer: '★★IT', owner: '佐々木', departmentId: 'sales3',
    subTeamId: 'presales', projectType: 'new', grossMarginRate: 0.42, members: ['佐々木', '高橋'],
    monthlyRevenue: { 3: 6.0 } },

  // D案件（50%）- 提案済み・可否未定
  { id: 'D001', name: '○△複合施設計画', amount: 50.0, stage: 'D', expectedCloseMonth: 3, customer: '○△ホールディングス', owner: '松本', departmentId: 'sales1',
    subTeamId: 'bizit', projectType: 'new', grossMarginRate: 0.28, members: ['松本'],
    comment: '競合2社との比較検討中',
    events: [
      { id: 'e1', type: 'proposal', date: '2025-08-01' },
    ],
    nextAction: 'プレゼン日程調整', nextActionDate: '2025-10-20' },
  { id: 'D002', name: '□×再開発プロジェクト', amount: 35.0, stage: 'D', expectedCloseMonth: 3, customer: '□×都市開発', owner: '井上', departmentId: 'sales2',
    subTeamId: 'manufacturing', projectType: 'new', grossMarginRate: 0.32, members: ['井上'],
    comment: '年明け決定予定',
    events: [
      { id: 'e1', type: 'proposal', date: '2025-07-15' },
    ] },
  { id: 'D003', name: '◇◎新工場構想', amount: 20.0, stage: 'D', expectedCloseMonth: 3, customer: '◇◎自動車', owner: '木村', departmentId: 'sales3',
    subTeamId: 'presales', projectType: 'new', grossMarginRate: 0.35, members: ['木村'],
    comment: '設計段階で検討中' },

  // O案件（20%）- 白地・情報収集段階
  { id: 'O001', name: '▼▼本社ビル建替構想', amount: 80.0, stage: 'O', expectedCloseMonth: 3, customer: '▼▼グループ', owner: '田中', departmentId: 'sales1',
    subTeamId: 'bizit', projectType: 'new', grossMarginRate: 0.25, members: ['田中'],
    comment: '来期以降の大型案件。情報収集中',
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-09-01', note: '紹介で初回面談' },
    ],
    nextAction: 'ニーズヒアリング', nextActionDate: '2025-11-01' },
  { id: 'O002', name: '◆×駅前再開発', amount: 120.0, stage: 'O', expectedCloseMonth: 3, customer: '◆×市', owner: '加藤', departmentId: 'sales1',
    subTeamId: 'bizimprove', projectType: 'new', grossMarginRate: 0.22, members: ['加藤', '松本'],
    comment: '官民連携事業。入札情報収集中' },
  { id: 'O003', name: '●◎新研究棟計画', amount: 45.0, stage: 'O', expectedCloseMonth: 3, customer: '●◎大学', owner: '山田', departmentId: 'sales2',
    subTeamId: 'manufacturing', projectType: 'new', grossMarginRate: 0.30, members: ['山田'],
    comment: '来年度予算申請中',
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-08-15' },
    ] },
  { id: 'O004', name: '★□空港ターミナル拡張', amount: 200.0, stage: 'O', expectedCloseMonth: 3, customer: '★□空港会社', owner: '佐々木', departmentId: 'sales3',
    subTeamId: 'presales', projectType: 'new', grossMarginRate: 0.20, members: ['佐々木', '木村'],
    comment: '大型案件。中長期的にフォロー' },
];

// 案件の月別売上合計を計算
export function getItemMonthlyTotal(item: PipelineItem): number {
  if (!item.monthlyRevenue) return 0;
  return Object.values(item.monthlyRevenue).reduce((sum, v) => sum + v, 0);
}

// 月別のパイプライン売上合計を計算（全案件の月別売上を積み上げ）
export function calculateMonthlyPipelineRevenue(): { [month: number]: number } {
  const result: { [month: number]: number } = {};
  pipelineData.forEach(item => {
    if (item.monthlyRevenue) {
      Object.entries(item.monthlyRevenue).forEach(([m, v]) => {
        const month = parseInt(m);
        result[month] = (result[month] || 0) + v;
      });
    }
  });
  return result;
}

// パイプラインサマリーを計算
export function calculatePipelineSummary(): PipelineSummary[] {
  return pipelineStages.map(stage => {
    const items = pipelineData.filter(p => p.stage === stage.id);
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      stage: stage.id,
      count: items.length,
      totalAmount,
      weightedAmount: totalAmount * (stage.probability / 100),
    };
  });
}

// 加重合計（見込金額）
export function getWeightedTotal(): number {
  const summary = calculatePipelineSummary();
  return summary.reduce((sum, s) => sum + s.weightedAmount, 0);
}

// グロス合計
export function getGrossTotal(): number {
  const summary = calculatePipelineSummary();
  return summary.reduce((sum, s) => sum + s.totalAmount, 0);
}

// ステージ別取得
export function getStageConfig(stage: PipelineStage): PipelineStageConfig {
  return pipelineStages.find(s => s.id === stage)!;
}

// 部署別サマリー
export interface DepartmentSummary {
  department: Department;
  pipelineGross: number;
  pipelineWeighted: number;
  pipelineTotal: number; // 総額（pipelineGrossと同じ）
  dealCount: number; // 案件数
  currentStack: number; // 確定 + 加重見込み
  gap: number; // 目標との差
  achievementRate: number;
  stageBreakdown: { stage: PipelineStage; amount: number; weighted: number }[];
}

export function calculateDepartmentSummaries(): DepartmentSummary[] {
  return departments.map(dept => {
    const deptPipeline = pipelineData.filter(p => p.departmentId === dept.id);

    const stageBreakdown = pipelineStages.map(stage => {
      const stageItems = deptPipeline.filter(p => p.stage === stage.id);
      const amount = stageItems.reduce((sum, p) => sum + p.amount, 0);
      const weighted = amount * (stage.probability / 100);
      return { stage: stage.id, amount, weighted };
    });

    const pipelineGross = stageBreakdown.reduce((sum, s) => sum + s.amount, 0);
    const pipelineWeighted = stageBreakdown.reduce((sum, s) => sum + s.weighted, 0);
    const currentStack = dept.confirmedYTD + pipelineWeighted;
    const gap = dept.target - currentStack;
    const achievementRate = (currentStack / dept.target) * 100;

    return {
      department: dept,
      pipelineGross,
      pipelineWeighted,
      pipelineTotal: pipelineGross,
      dealCount: deptPipeline.length,
      currentStack,
      gap,
      achievementRate,
      stageBreakdown,
    };
  });
}

// 月別パイプラインデータ取得（インポートデータを優先）
export function getMonthlyPipelineData(month: number): PipelineItem[] {
  // クライアントサイドでのみLocalStorageにアクセス
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('insightbi_monthly_pipeline');
    if (stored) {
      const allMonthly = JSON.parse(stored);
      if (allMonthly[month] && allMonthly[month].length > 0) {
        // インポートされたデータにexpectedCloseMonthを付与
        return allMonthly[month].map((item: PipelineItem) => ({
          ...item,
          expectedCloseMonth: month,
        }));
      }
    }
  }
  // フォールバック: デフォルトデータから該当月をフィルター
  return pipelineData.filter(p => p.expectedCloseMonth === month);
}

// 月別にインポート済みかどうかを確認
export function hasMonthlyPipelineData(month: number): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('insightbi_monthly_pipeline');
  if (stored) {
    const allMonthly = JSON.parse(stored);
    return allMonthly[month] && allMonthly[month].length > 0;
  }
  return false;
}

// 月別パイプラインサマリー計算
export function calculatePipelineSummaryByMonth(month: number): PipelineSummary[] {
  const monthlyData = getMonthlyPipelineData(month);
  return pipelineStages.map(stage => {
    const items = monthlyData.filter(p => p.stage === stage.id);
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      stage: stage.id,
      count: items.length,
      totalAmount,
      weightedAmount: totalAmount * (stage.probability / 100),
    };
  });
}

// 月別・部署別サマリー計算
export function calculateDepartmentSummariesByMonth(month: number): DepartmentSummary[] {
  const monthlyData = getMonthlyPipelineData(month);

  return departments.map(dept => {
    const deptPipeline = monthlyData.filter(p => p.departmentId === dept.id);

    const stageBreakdown = pipelineStages.map(stage => {
      const stageItems = deptPipeline.filter(p => p.stage === stage.id);
      const amount = stageItems.reduce((sum, p) => sum + p.amount, 0);
      const weighted = amount * (stage.probability / 100);
      return { stage: stage.id, amount, weighted };
    });

    const pipelineGross = stageBreakdown.reduce((sum, s) => sum + s.amount, 0);
    const pipelineWeighted = stageBreakdown.reduce((sum, s) => sum + s.weighted, 0);
    // 月別では確定は考慮しない（月別はその月の案件のみ）
    const currentStack = pipelineWeighted;
    const gap = 0; // 月別では差分計算は意味が薄い
    const achievementRate = 0;

    return {
      department: dept,
      pipelineGross,
      pipelineWeighted,
      pipelineTotal: pipelineGross,
      dealCount: deptPipeline.length,
      currentStack,
      gap,
      achievementRate,
      stageBreakdown,
    };
  });
}

// 月別案件リスト取得
export function getPipelineByMonth(month: number): PipelineItem[] {
  return getMonthlyPipelineData(month);
}

// ============================================
// Phase 2: 計画バージョン管理・上期下期集計
// ============================================

// 計画バージョン
export interface PlanVersion {
  id: string;
  name: string; // "Plan1.0", "Plan1.2", "Plan1.3"
  createdAt: string;
  isActive: boolean;
  monthlyTargets: { [month: number]: number }; // 月別目標（億円）
  stageTargets?: { [stage: string]: number }; // 確度別目標
}

// サンプル計画バージョン
export const planVersions: PlanVersion[] = [
  {
    id: 'plan10',
    name: 'Plan1.0',
    createdAt: '2025-04-01',
    isActive: false,
    monthlyTargets: { 4: 15, 5: 16, 6: 17, 7: 18, 8: 18, 9: 19, 10: 20, 11: 21, 12: 22, 1: 18, 2: 17, 3: 19 },
  },
  {
    id: 'plan12',
    name: 'Plan1.2',
    createdAt: '2025-07-01',
    isActive: false,
    monthlyTargets: { 4: 15, 5: 16, 6: 18, 7: 19, 8: 19, 9: 20, 10: 21, 11: 22, 12: 23, 1: 19, 2: 18, 3: 20 },
  },
  {
    id: 'plan13',
    name: 'Plan1.3',
    createdAt: '2025-10-01',
    isActive: true,
    monthlyTargets: { 4: 15, 5: 16, 6: 18, 7: 20, 8: 20, 9: 21, 10: 22, 11: 23, 12: 24, 1: 20, 2: 19, 3: 21 },
    stageTargets: { A: 23, B: 38.8, C: 66.5, D: 105, O: 445 },
  },
];

// 上期・下期の月定義（会計年度基準: 4月始まり）
export const firstHalfMonths = [4, 5, 6, 7, 8, 9]; // 上期
export const secondHalfMonths = [10, 11, 12, 1, 2, 3]; // 下期

// 半期サマリーインターフェース
export interface HalfYearSummary {
  period: 'first' | 'second';
  label: string;
  months: number[];
  totalBudget: number;
  totalActual: number | null;
  totalPipeline: number;
  totalWeighted: number;
  variance: number | null;
  stageBreakdown: { stage: PipelineStage; amount: number; weighted: number }[];
}

// 上期/下期サマリーを計算
export function calculateHalfYearSummary(data: PipelineItem[], monthlyActuals: { [month: number]: number | null }, monthlyBudgets: { [month: number]: number }): { first: HalfYearSummary; second: HalfYearSummary } {
  const calcHalf = (months: number[], period: 'first' | 'second', label: string): HalfYearSummary => {
    // 月別売上を集計
    let totalPipeline = 0;
    data.forEach(item => {
      if (item.monthlyRevenue) {
        months.forEach(m => {
          totalPipeline += item.monthlyRevenue![m] || 0;
        });
      }
    });

    // 確度別集計
    const stageBreakdown = pipelineStages.map(stage => {
      const stageItems = data.filter(p => p.stage === stage.id);
      let amount = 0;
      stageItems.forEach(item => {
        if (item.monthlyRevenue) {
          months.forEach(m => {
            amount += item.monthlyRevenue![m] || 0;
          });
        }
      });
      const weighted = amount * (stage.probability / 100);
      return { stage: stage.id as PipelineStage, amount, weighted };
    });

    const totalWeighted = stageBreakdown.reduce((s, b) => s + b.weighted, 0);
    const totalBudget = months.reduce((s, m) => s + (monthlyBudgets[m] || 0), 0);

    // 実績は締め済み月のみ合計
    let totalActual: number | null = 0;
    let hasAnyActual = false;
    months.forEach(m => {
      if (monthlyActuals[m] !== null && monthlyActuals[m] !== undefined) {
        totalActual! += monthlyActuals[m]!;
        hasAnyActual = true;
      }
    });
    if (!hasAnyActual) totalActual = null;

    const variance = totalActual !== null ? totalActual - totalBudget : null;

    return {
      period,
      label,
      months,
      totalBudget,
      totalActual,
      totalPipeline,
      totalWeighted,
      variance,
      stageBreakdown,
    };
  };

  return {
    first: calcHalf(firstHalfMonths, 'first', '上期'),
    second: calcHalf(secondHalfMonths, 'second', '下期'),
  };
}

// 計画比較インターフェース
export interface PlanComparison {
  itemId: string;
  itemName: string;
  currentAmount: number;
  planAmounts: { planId: string; planName: string; amount: number }[];
  variances: { planId: string; variance: number; varianceRate: number }[];
}

// 現在のパイプラインと計画を比較
export function comparePipelineWithPlans(activePlanId?: string): {
  totalComparison: { planId: string; planName: string; planTotal: number; currentTotal: number; variance: number; varianceRate: number }[];
  monthlyComparison: { month: number; planAmounts: { planId: string; amount: number }[]; currentAmount: number }[];
} {
  const currentMonthlyRevenue = calculateMonthlyPipelineRevenue();
  const currentTotal = Object.values(currentMonthlyRevenue).reduce((s, v) => s + v, 0);

  const totalComparison = planVersions.map(plan => {
    const planTotal = Object.values(plan.monthlyTargets).reduce((s, v) => s + v, 0);
    const variance = currentTotal - planTotal;
    const varianceRate = planTotal > 0 ? (variance / planTotal) * 100 : 0;
    return {
      planId: plan.id,
      planName: plan.name,
      planTotal,
      currentTotal,
      variance,
      varianceRate,
    };
  });

  const allMonths = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
  const monthlyComparison = allMonths.map(month => ({
    month,
    planAmounts: planVersions.map(plan => ({
      planId: plan.id,
      amount: plan.monthlyTargets[month] || 0,
    })),
    currentAmount: currentMonthlyRevenue[month] || 0,
  }));

  return { totalComparison, monthlyComparison };
}

// アクティブな計画を取得
export function getActivePlan(): PlanVersion | undefined {
  return planVersions.find(p => p.isActive);
}

// 計画をLocalStorageに保存
export function savePlanVersions(plans: PlanVersion[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('insightbi_plan_versions', JSON.stringify(plans));
  }
}

// LocalStorageから計画を読み込み
export function loadPlanVersions(): PlanVersion[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('insightbi_plan_versions');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return planVersions;
}

// サブチーム別サマリー
export interface SubTeamSummary {
  subTeam: SubTeam;
  totalAmount: number;
  weightedAmount: number;
  dealCount: number;
  avgGrossMargin: number;
  stageBreakdown: { stage: PipelineStage; amount: number; count: number }[];
}

// サブチーム別サマリーを計算
export function calculateSubTeamSummaries(): SubTeamSummary[] {
  return subTeams.map(team => {
    const teamItems = pipelineData.filter(p => p.subTeamId === team.id);

    const stageBreakdown = pipelineStages.map(stage => {
      const stageItems = teamItems.filter(p => p.stage === stage.id);
      return {
        stage: stage.id as PipelineStage,
        amount: stageItems.reduce((s, p) => s + p.amount, 0),
        count: stageItems.length,
      };
    });

    const totalAmount = teamItems.reduce((s, p) => s + p.amount, 0);
    const weightedAmount = teamItems.reduce((s, p) => {
      const stage = pipelineStages.find(st => st.id === p.stage);
      return s + p.amount * ((stage?.probability || 0) / 100);
    }, 0);

    const itemsWithMargin = teamItems.filter(p => p.grossMarginRate);
    const avgGrossMargin = itemsWithMargin.length > 0
      ? itemsWithMargin.reduce((s, p) => s + (p.grossMarginRate || 0), 0) / itemsWithMargin.length
      : 0;

    return {
      subTeam: team,
      totalAmount,
      weightedAmount,
      dealCount: teamItems.length,
      avgGrossMargin,
      stageBreakdown,
    };
  });
}
