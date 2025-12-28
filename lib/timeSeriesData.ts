// Time Series Demo Data Generator
import {
  TimeSeriesData,
  BudgetActualComparison,
  BranchMonthlyData,
  MonthlyDataPoint,
} from './types';

const BRANCHES = ['東京本社', '大阪支社', '名古屋支社', '福岡支社', '札幌支社', '海外事業部'];
const SEGMENTS = ['SaaS', 'AI/ML', 'クラウド', 'セキュリティ', 'データ分析', 'コンサル'];

// 季節性係数（月ごとの売上変動）
const SEASONALITY: { [key: string]: number } = {
  '04': 0.85,  // 期初は低め
  '05': 0.90,
  '06': 0.95,  // Q1締め
  '07': 0.92,
  '08': 0.88,  // 夏枯れ
  '09': 1.00,  // Q2締め
  '10': 1.05,
  '11': 1.10,
  '12': 1.15,  // Q3締め・繁忙期
  '01': 1.08,
  '02': 1.05,
  '03': 1.20,  // 期末追い込み
};

// 支社別の基本月次売上（億円）
const BRANCH_BASE_REVENUE: { [key: string]: number } = {
  '東京本社': 5.9,
  '大阪支社': 3.6,
  '名古屋支社': 2.4,
  '福岡支社': 2.0,
  '札幌支社': 1.3,
  '海外事業部': 1.3,
};

// 支社別の粗利率（%）
const BRANCH_MARGIN_RATE: { [key: string]: number } = {
  '東京本社': 14.9,
  '大阪支社': 13.6,
  '名古屋支社': 12.5,
  '福岡支社': 12.5,
  '札幌支社': 2.8,   // 課題あり
  '海外事業部': 24.6,
};

export function generateTimeSeriesData(): TimeSeriesData {
  const fiscalYear = '2025';
  const currentMonth = '2025-09';  // 9月末時点
  const months = [
    '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09',
    '2025-10', '2025-11', '2025-12',
    '2026-01', '2026-02', '2026-03',
  ];

  // 全社月次データ生成
  const companyRevenue: BudgetActualComparison[] = [];
  const companyProfit: BudgetActualComparison[] = [];

  // 前年実績（参考用）
  const lastYearRevenue = [
    7.5, 7.8, 8.2, 8.0, 7.6, 8.5,  // 前年4-9月
    9.0, 9.5, 10.0, 9.3, 9.0, 10.5  // 前年10-3月
  ];

  // 年間予算: 200億円、月割り + 季節性
  const annualBudget = 200;
  const avgMonthlyBudget = annualBudget / 12;

  let ytdActualRevenue = 0;
  let ytdBudgetRevenue = 0;
  let ytdActualProfit = 0;
  let ytdBudgetProfit = 0;

  months.forEach((month, idx) => {
    const monthKey = month.split('-')[1];
    const seasonFactor = SEASONALITY[monthKey];

    // 予算（季節性考慮）
    const budget = avgMonthlyBudget * seasonFactor;

    // 実績（4-9月のみ）
    const isActual = idx < 6;  // 4月〜9月
    const actual = isActual
      ? budget * (0.92 + Math.random() * 0.12)  // 予算の92-104%
      : null;

    // 見通し（10-3月）
    const forecast = isActual
      ? actual!
      : budget * (0.95 + Math.random() * 0.08);  // 予算の95-103%

    // 前年実績
    const yoyActual = lastYearRevenue[idx];

    // 差異計算
    const budgetVariance = actual !== null ? actual - budget : forecast - budget;
    const budgetVarianceRate = (budgetVariance / budget) * 100;
    const yoyChange = actual !== null
      ? ((actual - yoyActual) / yoyActual) * 100
      : null;

    companyRevenue.push({
      period: month,
      budget: budget * 100000000,  // 億円→円
      forecast: forecast * 100000000,
      actual: actual !== null ? actual * 100000000 : null,
      budgetVariance: budgetVariance * 100000000,
      budgetVarianceRate,
      yoyActual: yoyActual * 100000000,
      yoyChange,
    });

    // 粗利（全社平均14.5%）
    const avgMargin = 0.145;
    companyProfit.push({
      period: month,
      budget: budget * avgMargin * 100000000,
      forecast: forecast * avgMargin * 100000000,
      actual: actual !== null ? actual * avgMargin * 100000000 : null,
      budgetVariance: budgetVariance * avgMargin * 100000000,
      budgetVarianceRate,
      yoyActual: yoyActual * avgMargin * 100000000,
      yoyChange,
    });

    // YTD集計
    if (isActual) {
      ytdActualRevenue += actual!;
      ytdActualProfit += actual! * avgMargin;
    }
    if (idx < 6) {
      ytdBudgetRevenue += budget;
      ytdBudgetProfit += budget * avgMargin;
    }
  });

  // 支社別時系列データ
  const branchTimeSeries: BranchMonthlyData[] = BRANCHES.map(branch => {
    const baseRevenue = BRANCH_BASE_REVENUE[branch];
    const marginRate = BRANCH_MARGIN_RATE[branch] / 100;

    const monthly: MonthlyDataPoint[] = months.map((month, idx) => {
      const monthKey = month.split('-')[1];
      const seasonFactor = SEASONALITY[monthKey];
      const isActual = idx < 6;

      // 札幌支社は改善傾向を反映
      let adjustedMargin = marginRate;
      if (branch === '札幌支社' && idx >= 3) {
        adjustedMargin = marginRate + (idx * 0.005);  // 徐々に改善
      }

      const revenue = baseRevenue * seasonFactor * (0.95 + Math.random() * 0.1);
      const grossProfit = revenue * adjustedMargin;

      return {
        period: month,
        revenue: revenue * 100000000,
        grossProfit: grossProfit * 100000000,
        grossMarginRate: adjustedMargin * 100,
        type: isActual ? 'actual' : 'forecast',
      };
    });

    // セグメント別（簡略化）
    const segments: { [seg: string]: MonthlyDataPoint[] } = {};
    SEGMENTS.forEach(seg => {
      const segShare = 1 / SEGMENTS.length;
      segments[seg] = monthly.map(m => ({
        ...m,
        revenue: m.revenue * segShare,
        grossProfit: m.grossProfit * segShare,
      }));
    });

    return { branch, monthly, segments };
  });

  // 見通し変動履歴
  const forecastHistory = [
    { asOfMonth: '2025-04', fullYearForecast: 200 * 100000000, note: '期初予算' },
    { asOfMonth: '2025-06', fullYearForecast: 195 * 100000000, note: 'Q1実績反映・やや下方修正' },
    { asOfMonth: '2025-09', fullYearForecast: 192 * 100000000, note: '上期実績反映・下期見通し精緻化' },
  ];

  // サマリー
  const summary = {
    fiscalYear,
    currentMonth,
    ytd: {
      budget: ytdBudgetRevenue * 100000000,
      forecast: ytdActualRevenue * 100000000,
      actual: ytdActualRevenue * 100000000,
      achievementRate: (ytdActualRevenue / ytdBudgetRevenue) * 100,
    },
    fullYear: {
      budget: 200 * 100000000,
      forecast: 192 * 100000000,
      forecastChangeFromInitial: -8 * 100000000,
    },
    yoyComparison: {
      revenueChange: 5.1,    // +5.1%
      profitChange: 11.5,    // +11.5%
      marginChange: 0.8,     // +0.8pt
    },
  };

  return {
    fiscalYear,
    asOfDate: '2025年9月末時点',
    months,
    summary,
    companyMonthly: {
      revenue: companyRevenue,
      grossProfit: companyProfit,
    },
    branchTimeSeries,
    forecastHistory,
  };
}

// ユーティリティ関数
export function getQuarterData(data: BudgetActualComparison[], quarter: 'q1' | 'q2' | 'q3' | 'q4') {
  const quarterMonths: { [key: string]: number[] } = {
    q1: [0, 1, 2],    // 4-6月
    q2: [3, 4, 5],    // 7-9月
    q3: [6, 7, 8],    // 10-12月
    q4: [9, 10, 11],  // 1-3月
  };

  return quarterMonths[quarter].map(idx => data[idx]);
}

export function getYTDData(data: BudgetActualComparison[], currentMonthIdx: number) {
  return data.slice(0, currentMonthIdx + 1);
}

export function formatCurrencyBillions(value: number): string {
  return (value / 100000000).toFixed(1) + '億';
}

export function formatCurrencyMillions(value: number): string {
  return (value / 1000000).toFixed(0) + '百万';
}
