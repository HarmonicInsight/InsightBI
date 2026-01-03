// 案件パイプラインデータ（Sales Insightから取得想定）

// データ取得時点
export const pipelineAsOf = '2025-09-15 18:00';

export type PipelineStage = 'A' | 'B' | 'C' | 'D';

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

// 案件ステージ定義
export const pipelineStages: PipelineStageConfig[] = [
  { id: 'A', name: 'A案件', probability: 80, color: 'text-emerald-700', bgColor: 'bg-emerald-100', description: '内示・ほぼ確定' },
  { id: 'B', name: 'B案件', probability: 50, color: 'text-blue-700', bgColor: 'bg-blue-100', description: '見積提出・交渉中' },
  { id: 'C', name: 'C案件', probability: 20, color: 'text-amber-700', bgColor: 'bg-amber-100', description: '提案中・検討中' },
  { id: 'D', name: 'D案件', probability: 5, color: 'text-slate-600', bgColor: 'bg-slate-100', description: '情報収集・話のみ' },
];

// サンプルパイプラインデータ（実際はSales Insightから取得）
export const pipelineData: PipelineItem[] = [
  // A案件（80%）- 月別売上配分あり
  { id: 'A001', name: '○○ビル新築工事', amount: 8.5, stage: 'A', expectedCloseMonth: 10, customer: '○○不動産', owner: '田中', departmentId: 'sales1',
    monthlyRevenue: { 10: 2.0, 11: 3.0, 12: 2.0, 1: 1.5 }, // 10月から4ヶ月で計上
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-04-10', note: '紹介で初回訪問' },
      { id: 'e2', type: 'proposal', date: '2025-05-20', note: '概算見積提出' },
      { id: 'e3', type: 'negotiation', date: '2025-08-15', note: '最終交渉中' },
    ],
    nextAction: '契約書確認', nextActionDate: '2025-10-05' },
  { id: 'A002', name: '△△マンション改修', amount: 4.2, stage: 'A', expectedCloseMonth: 11, customer: '△△管理組合', owner: '佐藤', departmentId: 'sales1',
    monthlyRevenue: { 11: 1.5, 12: 1.5, 1: 1.2 }, // 3ヶ月で計上
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-03-15' },
      { id: 'e2', type: 'proposal', date: '2025-06-01' },
    ],
    nextAction: '理事会承認待ち', nextActionDate: '2025-10-20' },
  { id: 'A003', name: '□□工場増設', amount: 6.8, stage: 'A', expectedCloseMonth: 12, customer: '□□製作所', owner: '鈴木', departmentId: 'sales2',
    monthlyRevenue: { 12: 2.5, 1: 2.5, 2: 1.8 }, // 3ヶ月
    events: [
      { id: 'e1', type: 'proposal', date: '2025-07-10' },
      { id: 'e2', type: 'negotiation', date: '2025-09-01' },
    ] },
  { id: 'A004', name: '◇◇病院リニューアル', amount: 3.5, stage: 'A', expectedCloseMonth: 1, customer: '◇◇医療法人', owner: '高橋', departmentId: 'sales3',
    monthlyRevenue: { 1: 1.5, 2: 1.0, 3: 1.0 },
    events: [
      { id: 'e1', type: 'proposal', date: '2025-08-20' },
    ] },

  // B案件（50%）
  { id: 'B001', name: '××商業施設', amount: 12.0, stage: 'B', expectedCloseMonth: 11, customer: '××リテール', owner: '伊藤', departmentId: 'sales1',
    monthlyRevenue: { 11: 3.0, 12: 4.0, 1: 3.0, 2: 2.0 }, // 4ヶ月
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-05-01' },
      { id: 'e2', type: 'proposal', date: '2025-08-10' },
    ],
    nextAction: '詳細見積提出', nextActionDate: '2025-10-10' },
  { id: 'B002', name: '▽▽オフィスビル', amount: 7.5, stage: 'B', expectedCloseMonth: 12, customer: '▽▽商事', owner: '渡辺', departmentId: 'sales2',
    monthlyRevenue: { 12: 2.5, 1: 2.5, 2: 2.5 },
    events: [
      { id: 'e1', type: 'proposal', date: '2025-07-15' },
    ] },
  { id: 'B003', name: '◎◎物流センター', amount: 9.0, stage: 'B', expectedCloseMonth: 1, customer: '◎◎物流', owner: '山本', departmentId: 'sales2',
    monthlyRevenue: { 1: 3.0, 2: 3.0, 3: 3.0 } },
  { id: 'B004', name: '☆☆学校体育館', amount: 4.5, stage: 'B', expectedCloseMonth: 2, customer: '☆☆市教育委員会', owner: '中村', departmentId: 'sales3',
    monthlyRevenue: { 2: 2.0, 3: 2.5 } },
  { id: 'B005', name: '◆◆ホテル改装', amount: 5.8, stage: 'B', expectedCloseMonth: 3, customer: '◆◆観光', owner: '小林', departmentId: 'sales3',
    monthlyRevenue: { 3: 5.8 } }, // 一括計上

  // C案件（20%）
  { id: 'C001', name: '●●タワー新築', amount: 25.0, stage: 'C', expectedCloseMonth: 2, customer: '●●開発', owner: '加藤', departmentId: 'sales1',
    monthlyRevenue: { 2: 5.0, 3: 8.0 }, // 初期の一部のみ計画
    events: [
      { id: 'e1', type: 'initial_contact', date: '2025-06-01' },
    ],
    nextAction: '提案書作成', nextActionDate: '2025-10-15' },
  { id: 'C002', name: '■■工場移転', amount: 15.0, stage: 'C', expectedCloseMonth: 3, customer: '■■工業', owner: '吉田', departmentId: 'sales2',
    monthlyRevenue: { 3: 5.0 } }, // 一部のみ
  { id: 'C003', name: '▲▲研究施設', amount: 8.5, stage: 'C', expectedCloseMonth: 3, customer: '▲▲製薬', owner: '山田', departmentId: 'sales2',
    monthlyRevenue: { 3: 3.0 } },
  { id: 'C004', name: '★★データセンター', amount: 18.0, stage: 'C', expectedCloseMonth: 3, customer: '★★IT', owner: '佐々木', departmentId: 'sales3',
    monthlyRevenue: { 3: 6.0 } },

  // D案件（話のみ）- 月配分はまだ未定
  { id: 'D001', name: '○△複合施設計画', amount: 50.0, stage: 'D', expectedCloseMonth: 3, customer: '○△ホールディングス', owner: '松本', departmentId: 'sales1' },
  { id: 'D002', name: '□×再開発プロジェクト', amount: 35.0, stage: 'D', expectedCloseMonth: 3, customer: '□×都市開発', owner: '井上', departmentId: 'sales2' },
  { id: 'D003', name: '◇◎新工場構想', amount: 20.0, stage: 'D', expectedCloseMonth: 3, customer: '◇◎自動車', owner: '木村', departmentId: 'sales3' },
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
