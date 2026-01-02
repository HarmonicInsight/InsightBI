// 月次データ管理 - 通期（4月〜3月）対応

export type KPIStatus = 'good' | 'warning' | 'critical' | 'pending';

export interface MonthlyKPIValue {
  budget: number;
  actual: number | null; // null = 未確定
  variance: number | null;
  varianceRate: number | null;
}

export interface KPIItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  isHigherBetter: boolean;
}

export interface MonthlyData {
  month: number; // 4-12, 1-3
  year: number;
  label: string;
  isClosed: boolean; // 月次締め済みか
  kpis: Record<string, MonthlyKPIValue>;
}

// KPI定義
export const kpiDefinitions: KPIItem[] = [
  { id: 'revenue', name: '売上高', category: '収益', unit: '億円', isHigherBetter: true },
  { id: 'gross_profit', name: '粗利益', category: '収益', unit: '億円', isHigherBetter: true },
  { id: 'margin_rate', name: '粗利率', category: '収益', unit: '%', isHigherBetter: true },
  { id: 'operating_profit', name: '営業利益', category: '収益', unit: '億円', isHigherBetter: true },
  { id: 'orders', name: '受注金額', category: '営業', unit: '億円', isHigherBetter: true },
  { id: 'pipeline', name: 'パイプライン', category: '営業', unit: '億円', isHigherBetter: true },
  { id: 'new_deals', name: '新規商談数', category: '営業', unit: '件', isHigherBetter: true },
  { id: 'win_rate', name: '成約率', category: '営業', unit: '%', isHigherBetter: true },
  { id: 'project_count', name: '稼働PJ数', category: 'プロジェクト', unit: '件', isHigherBetter: true },
  { id: 'project_margin', name: 'PJ平均粗利率', category: 'プロジェクト', unit: '%', isHigherBetter: true },
  { id: 'red_projects', name: '赤字PJ数', category: 'プロジェクト', unit: '件', isHigherBetter: false },
  { id: 'headcount', name: '社員数', category: '人事', unit: '名', isHigherBetter: true },
  { id: 'sales_headcount', name: '営業人員', category: '人事', unit: '名', isHigherBetter: true },
  { id: 'turnover_rate', name: '離職率', category: '人事', unit: '%', isHigherBetter: false },
  { id: 'cash', name: '現預金残高', category: '財務', unit: '億円', isHigherBetter: true },
  { id: 'sga', name: '販管費', category: '財務', unit: '億円', isHigherBetter: false },
];

// 通期予算
export const fyBudget: Record<string, number> = {
  revenue: 200.0, gross_profit: 30.0, margin_rate: 15.0, operating_profit: 12.0,
  orders: 100.0, pipeline: 120.0, new_deals: 360, win_rate: 35.0,
  project_count: 130, project_margin: 15.0, red_projects: 0,
  headcount: 145, sales_headcount: 55, turnover_rate: 10.0,
  cash: 30.0, sga: 34.0,
};

// 月次予算配分（季節性を考慮）
const monthlyBudgetRatio: Record<number, number> = {
  4: 0.075, 5: 0.08, 6: 0.09, 7: 0.08, 8: 0.07, 9: 0.085,
  10: 0.09, 11: 0.085, 12: 0.10, 1: 0.08, 2: 0.075, 3: 0.095,
};

// 月次予算計算
function getMonthlyBudget(kpiId: string, month: number): number {
  const annual = fyBudget[kpiId] || 0;
  const kpi = kpiDefinitions.find(k => k.id === kpiId);
  if (kpi?.unit === '%') return annual; // 率は年間値をそのまま
  return Math.round(annual * (monthlyBudgetRatio[month] || 0.083) * 10) / 10;
}

// 2025年度 月次データ（4月〜3月）- 9月まで実績あり
export const monthlyDataset: MonthlyData[] = [
  // 4月（実績あり）
  {
    month: 4, year: 2025, label: '4月', isClosed: true,
    kpis: {
      revenue: { budget: 15.0, actual: 14.2, variance: -0.8, varianceRate: -5.3 },
      gross_profit: { budget: 2.3, actual: 2.1, variance: -0.2, varianceRate: -8.7 },
      margin_rate: { budget: 15.0, actual: 14.8, variance: -0.2, varianceRate: -1.3 },
      operating_profit: { budget: 0.9, actual: 0.8, variance: -0.1, varianceRate: -11.1 },
      orders: { budget: 7.5, actual: 7.5, variance: 0, varianceRate: 0 },
      pipeline: { budget: 95.0, actual: 92.0, variance: -3.0, varianceRate: -3.2 },
      new_deals: { budget: 28, actual: 24, variance: -4, varianceRate: -14.3 },
      win_rate: { budget: 35.0, actual: 32.0, variance: -3.0, varianceRate: -8.6 },
      project_count: { budget: 100, actual: 98, variance: -2, varianceRate: -2.0 },
      project_margin: { budget: 15.0, actual: 13.5, variance: -1.5, varianceRate: -10.0 },
      red_projects: { budget: 0, actual: 2, variance: 2, varianceRate: 0 },
      headcount: { budget: 128, actual: 126, variance: -2, varianceRate: -1.6 },
      sales_headcount: { budget: 45, actual: 40, variance: -5, varianceRate: -11.1 },
      turnover_rate: { budget: 10.0, actual: 9.2, variance: -0.8, varianceRate: -8.0 },
      cash: { budget: 20.0, actual: 21.5, variance: 1.5, varianceRate: 7.5 },
      sga: { budget: 2.8, actual: 2.7, variance: -0.1, varianceRate: -3.6 },
    }
  },
  // 5月
  {
    month: 5, year: 2025, label: '5月', isClosed: true,
    kpis: {
      revenue: { budget: 16.0, actual: 15.8, variance: -0.2, varianceRate: -1.3 },
      gross_profit: { budget: 2.4, actual: 2.5, variance: 0.1, varianceRate: 4.2 },
      margin_rate: { budget: 15.0, actual: 15.8, variance: 0.8, varianceRate: 5.3 },
      operating_profit: { budget: 1.0, actual: 1.0, variance: 0, varianceRate: 0 },
      orders: { budget: 8.0, actual: 9.0, variance: 1.0, varianceRate: 12.5 },
      pipeline: { budget: 98.0, actual: 100.0, variance: 2.0, varianceRate: 2.0 },
      new_deals: { budget: 30, actual: 28, variance: -2, varianceRate: -6.7 },
      win_rate: { budget: 35.0, actual: 34.0, variance: -1.0, varianceRate: -2.9 },
      project_count: { budget: 105, actual: 108, variance: 3, varianceRate: 2.9 },
      project_margin: { budget: 15.0, actual: 14.2, variance: -0.8, varianceRate: -5.3 },
      red_projects: { budget: 0, actual: 2, variance: 2, varianceRate: 0 },
      headcount: { budget: 130, actual: 128, variance: -2, varianceRate: -1.5 },
      sales_headcount: { budget: 46, actual: 41, variance: -5, varianceRate: -10.9 },
      turnover_rate: { budget: 10.0, actual: 8.8, variance: -1.2, varianceRate: -12.0 },
      cash: { budget: 21.0, actual: 22.8, variance: 1.8, varianceRate: 8.6 },
      sga: { budget: 2.8, actual: 2.65, variance: -0.15, varianceRate: -5.4 },
    }
  },
  // 6月
  {
    month: 6, year: 2025, label: '6月', isClosed: true,
    kpis: {
      revenue: { budget: 18.0, actual: 16.5, variance: -1.5, varianceRate: -8.3 },
      gross_profit: { budget: 2.7, actual: 2.4, variance: -0.3, varianceRate: -11.1 },
      margin_rate: { budget: 15.0, actual: 14.5, variance: -0.5, varianceRate: -3.3 },
      operating_profit: { budget: 1.1, actual: 0.9, variance: -0.2, varianceRate: -18.2 },
      orders: { budget: 8.5, actual: 8.8, variance: 0.3, varianceRate: 3.5 },
      pipeline: { budget: 102.0, actual: 105.0, variance: 3.0, varianceRate: 2.9 },
      new_deals: { budget: 30, actual: 26, variance: -4, varianceRate: -13.3 },
      win_rate: { budget: 35.0, actual: 33.5, variance: -1.5, varianceRate: -4.3 },
      project_count: { budget: 110, actual: 112, variance: 2, varianceRate: 1.8 },
      project_margin: { budget: 15.0, actual: 13.0, variance: -2.0, varianceRate: -13.3 },
      red_projects: { budget: 0, actual: 3, variance: 3, varianceRate: 0 },
      headcount: { budget: 132, actual: 129, variance: -3, varianceRate: -2.3 },
      sales_headcount: { budget: 47, actual: 41, variance: -6, varianceRate: -12.8 },
      turnover_rate: { budget: 10.0, actual: 9.5, variance: -0.5, varianceRate: -5.0 },
      cash: { budget: 22.0, actual: 23.5, variance: 1.5, varianceRate: 6.8 },
      sga: { budget: 2.9, actual: 2.75, variance: -0.15, varianceRate: -5.2 },
    }
  },
  // 7月
  {
    month: 7, year: 2025, label: '7月', isClosed: true,
    kpis: {
      revenue: { budget: 16.0, actual: 15.5, variance: -0.5, varianceRate: -3.1 },
      gross_profit: { budget: 2.4, actual: 2.2, variance: -0.2, varianceRate: -8.3 },
      margin_rate: { budget: 15.0, actual: 14.2, variance: -0.8, varianceRate: -5.3 },
      operating_profit: { budget: 1.0, actual: 0.85, variance: -0.15, varianceRate: -15.0 },
      orders: { budget: 8.0, actual: 8.5, variance: 0.5, varianceRate: 6.3 },
      pipeline: { budget: 105.0, actual: 108.0, variance: 3.0, varianceRate: 2.9 },
      new_deals: { budget: 30, actual: 25, variance: -5, varianceRate: -16.7 },
      win_rate: { budget: 35.0, actual: 32.0, variance: -3.0, varianceRate: -8.6 },
      project_count: { budget: 112, actual: 115, variance: 3, varianceRate: 2.7 },
      project_margin: { budget: 15.0, actual: 12.5, variance: -2.5, varianceRate: -16.7 },
      red_projects: { budget: 0, actual: 3, variance: 3, varianceRate: 0 },
      headcount: { budget: 133, actual: 130, variance: -3, varianceRate: -2.3 },
      sales_headcount: { budget: 48, actual: 41, variance: -7, varianceRate: -14.6 },
      turnover_rate: { budget: 10.0, actual: 8.5, variance: -1.5, varianceRate: -15.0 },
      cash: { budget: 23.0, actual: 24.0, variance: 1.0, varianceRate: 4.3 },
      sga: { budget: 2.85, actual: 2.7, variance: -0.15, varianceRate: -5.3 },
    }
  },
  // 8月
  {
    month: 8, year: 2025, label: '8月', isClosed: true,
    kpis: {
      revenue: { budget: 14.0, actual: 13.8, variance: -0.2, varianceRate: -1.4 },
      gross_profit: { budget: 2.1, actual: 2.0, variance: -0.1, varianceRate: -4.8 },
      margin_rate: { budget: 15.0, actual: 14.5, variance: -0.5, varianceRate: -3.3 },
      operating_profit: { budget: 0.85, actual: 0.75, variance: -0.1, varianceRate: -11.8 },
      orders: { budget: 7.0, actual: 7.8, variance: 0.8, varianceRate: 11.4 },
      pipeline: { budget: 108.0, actual: 112.0, variance: 4.0, varianceRate: 3.7 },
      new_deals: { budget: 25, actual: 22, variance: -3, varianceRate: -12.0 },
      win_rate: { budget: 35.0, actual: 33.0, variance: -2.0, varianceRate: -5.7 },
      project_count: { budget: 115, actual: 118, variance: 3, varianceRate: 2.6 },
      project_margin: { budget: 15.0, actual: 12.0, variance: -3.0, varianceRate: -20.0 },
      red_projects: { budget: 0, actual: 3, variance: 3, varianceRate: 0 },
      headcount: { budget: 134, actual: 131, variance: -3, varianceRate: -2.2 },
      sales_headcount: { budget: 49, actual: 42, variance: -7, varianceRate: -14.3 },
      turnover_rate: { budget: 10.0, actual: 8.2, variance: -1.8, varianceRate: -18.0 },
      cash: { budget: 24.0, actual: 25.0, variance: 1.0, varianceRate: 4.2 },
      sga: { budget: 2.75, actual: 2.6, variance: -0.15, varianceRate: -5.5 },
    }
  },
  // 9月（最新月）
  {
    month: 9, year: 2025, label: '9月', isClosed: true,
    kpis: {
      revenue: { budget: 17.0, actual: 15.2, variance: -1.8, varianceRate: -10.6 },
      gross_profit: { budget: 2.55, actual: 2.2, variance: -0.35, varianceRate: -13.7 },
      margin_rate: { budget: 15.0, actual: 14.5, variance: -0.5, varianceRate: -3.3 },
      operating_profit: { budget: 1.0, actual: 0.85, variance: -0.15, varianceRate: -15.0 },
      orders: { budget: 8.5, actual: 9.2, variance: 0.7, varianceRate: 8.2 },
      pipeline: { budget: 110.0, actual: 115.0, variance: 5.0, varianceRate: 4.5 },
      new_deals: { budget: 30, actual: 25, variance: -5, varianceRate: -16.7 },
      win_rate: { budget: 35.0, actual: 32.0, variance: -3.0, varianceRate: -8.6 },
      project_count: { budget: 118, actual: 120, variance: 2, varianceRate: 1.7 },
      project_margin: { budget: 15.0, actual: 12.2, variance: -2.8, varianceRate: -18.7 },
      red_projects: { budget: 0, actual: 3, variance: 3, varianceRate: 0 },
      headcount: { budget: 135, actual: 132, variance: -3, varianceRate: -2.2 },
      sales_headcount: { budget: 50, actual: 42, variance: -8, varianceRate: -16.0 },
      turnover_rate: { budget: 10.0, actual: 8.5, variance: -1.5, varianceRate: -15.0 },
      cash: { budget: 22.0, actual: 25.3, variance: 3.3, varianceRate: 15.0 },
      sga: { budget: 2.8, actual: 2.6, variance: -0.2, varianceRate: -7.1 },
    }
  },
  // 10月〜3月（未来月 - 予算のみ）
  ...([10, 11, 12, 1, 2, 3] as number[]).map(m => {
    const year = m >= 10 ? 2025 : 2026;
    const kpis: Record<string, MonthlyKPIValue> = {};
    kpiDefinitions.forEach(kpi => {
      kpis[kpi.id] = {
        budget: getMonthlyBudget(kpi.id, m),
        actual: null,
        variance: null,
        varianceRate: null,
      };
    });
    return {
      month: m,
      year,
      label: `${m}月`,
      isClosed: false,
      kpis,
    };
  }),
];

// 月の順序（4月始まり）
export const monthOrder = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];

// 累計計算（実績がある月のみ）
export function calculateYTD(data: MonthlyData[], upToMonth: number): Record<string, { budget: number; actual: number | null; variance: number | null; varianceRate: number | null }> {
  const result: Record<string, { budget: number; actual: number | null; variance: number | null; varianceRate: number | null }> = {};

  // 4月から指定月までのデータを取得
  const upToIndex = monthOrder.indexOf(upToMonth);
  const targetMonths = monthOrder.slice(0, upToIndex + 1);
  const monthsData = data.filter(d => targetMonths.includes(d.month));
  const closedMonths = monthsData.filter(d => d.isClosed);

  kpiDefinitions.forEach(kpi => {
    let budgetSum = 0;
    let actualSum: number | null = 0;
    let hasActual = false;

    const isRate = kpi.unit === '%';

    monthsData.forEach(m => {
      const v = m.kpis[kpi.id];
      if (v) {
        if (isRate) {
          budgetSum += v.budget;
        } else {
          budgetSum += v.budget;
        }
        if (v.actual !== null) {
          hasActual = true;
          actualSum = (actualSum || 0) + v.actual;
        }
      }
    });

    if (isRate && closedMonths.length > 0) {
      budgetSum = budgetSum / monthsData.length;
      actualSum = hasActual ? (actualSum || 0) / closedMonths.length : null;
    }

    const variance = hasActual && actualSum !== null ? actualSum - (isRate ? budgetSum : budgetSum * closedMonths.length / monthsData.length) : null;
    const varianceRate = variance !== null && budgetSum !== 0 ? (variance / budgetSum) * 100 : null;

    result[kpi.id] = {
      budget: Math.round(budgetSum * 10) / 10,
      actual: actualSum !== null ? Math.round(actualSum * 10) / 10 : null,
      variance: variance !== null ? Math.round(variance * 10) / 10 : null,
      varianceRate: varianceRate !== null ? Math.round(varianceRate * 10) / 10 : null,
    };
  });

  return result;
}

// 通期見込計算
export function calculateForecast(data: MonthlyData[], currentMonth: number): Record<string, { budget: number; forecast: number | null; variance: number | null; varianceRate: number | null }> {
  const result: Record<string, { budget: number; forecast: number | null; variance: number | null; varianceRate: number | null }> = {};

  const closedMonths = data.filter(d => d.isClosed);
  const closedCount = closedMonths.length;

  if (closedCount === 0) {
    kpiDefinitions.forEach(kpi => {
      result[kpi.id] = { budget: fyBudget[kpi.id], forecast: null, variance: null, varianceRate: null };
    });
    return result;
  }

  kpiDefinitions.forEach(kpi => {
    const budget = fyBudget[kpi.id];
    const isRate = kpi.unit === '%';

    // 実績合計
    let actualSum = 0;
    closedMonths.forEach(m => {
      const v = m.kpis[kpi.id];
      if (v?.actual !== null) actualSum += v.actual;
    });

    let forecast: number;
    if (isRate) {
      forecast = actualSum / closedCount;
    } else {
      const monthlyAvg = actualSum / closedCount;
      forecast = actualSum + monthlyAvg * (12 - closedCount);
    }

    forecast = Math.round(forecast * 10) / 10;
    const variance = forecast - budget;
    const varianceRate = budget !== 0 ? (variance / budget) * 100 : 0;

    result[kpi.id] = {
      budget,
      forecast,
      variance: Math.round(variance * 10) / 10,
      varianceRate: Math.round(varianceRate * 10) / 10,
    };
  });

  return result;
}

// KPIステータス判定
export function getKPIStatus(varianceRate: number | null, isHigherBetter: boolean): KPIStatus {
  if (varianceRate === null) return 'pending';
  const effectiveRate = isHigherBetter ? varianceRate : -varianceRate;
  if (effectiveRate >= -3) return 'good';
  if (effectiveRate >= -10) return 'warning';
  return 'critical';
}

// ステータス設定
export const statusConfig: Record<KPIStatus, { label: string; color: string; bg: string }> = {
  good: { label: '順調', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  warning: { label: '注意', color: 'text-amber-700', bg: 'bg-amber-100' },
  critical: { label: '要対策', color: 'text-red-700', bg: 'bg-red-100' },
  pending: { label: '未確定', color: 'text-slate-400', bg: 'bg-slate-100' },
};

// カテゴリ一覧
export const categories = ['収益', '営業', 'プロジェクト', '人事', '財務'];

// 現在の月を取得（最新の締め月）
export function getCurrentClosedMonth(): number {
  const closed = monthlyDataset.filter(d => d.isClosed);
  return closed.length > 0 ? closed[closed.length - 1].month : 4;
}
