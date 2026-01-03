// 案件パイプラインデータ（Sales Insightから取得想定）

// データ取得時点
export const pipelineAsOf = '2025-09-15 18:00';

export type PipelineStage = 'A' | 'B' | 'C' | 'D';

export interface PipelineStageConfig {
  id: PipelineStage;
  name: string;
  probability: number; // %
  color: string;
  bgColor: string;
  description: string;
}

export interface PipelineItem {
  id: string;
  name: string;
  amount: number; // 億円
  stage: PipelineStage;
  expectedCloseMonth: number; // 1-12
  customer: string;
  owner: string;
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
  // A案件（80%）
  { id: 'A001', name: '○○ビル新築工事', amount: 8.5, stage: 'A', expectedCloseMonth: 10, customer: '○○不動産', owner: '田中' },
  { id: 'A002', name: '△△マンション改修', amount: 4.2, stage: 'A', expectedCloseMonth: 11, customer: '△△管理組合', owner: '佐藤' },
  { id: 'A003', name: '□□工場増設', amount: 6.8, stage: 'A', expectedCloseMonth: 12, customer: '□□製作所', owner: '鈴木' },
  { id: 'A004', name: '◇◇病院リニューアル', amount: 3.5, stage: 'A', expectedCloseMonth: 1, customer: '◇◇医療法人', owner: '高橋' },

  // B案件（50%）
  { id: 'B001', name: '××商業施設', amount: 12.0, stage: 'B', expectedCloseMonth: 11, customer: '××リテール', owner: '伊藤' },
  { id: 'B002', name: '▽▽オフィスビル', amount: 7.5, stage: 'B', expectedCloseMonth: 12, customer: '▽▽商事', owner: '渡辺' },
  { id: 'B003', name: '◎◎物流センター', amount: 9.0, stage: 'B', expectedCloseMonth: 1, customer: '◎◎物流', owner: '山本' },
  { id: 'B004', name: '☆☆学校体育館', amount: 4.5, stage: 'B', expectedCloseMonth: 2, customer: '☆☆市教育委員会', owner: '中村' },
  { id: 'B005', name: '◆◆ホテル改装', amount: 5.8, stage: 'B', expectedCloseMonth: 3, customer: '◆◆観光', owner: '小林' },

  // C案件（20%）
  { id: 'C001', name: '●●タワー新築', amount: 25.0, stage: 'C', expectedCloseMonth: 2, customer: '●●開発', owner: '加藤' },
  { id: 'C002', name: '■■工場移転', amount: 15.0, stage: 'C', expectedCloseMonth: 3, customer: '■■工業', owner: '吉田' },
  { id: 'C003', name: '▲▲研究施設', amount: 8.5, stage: 'C', expectedCloseMonth: 3, customer: '▲▲製薬', owner: '山田' },
  { id: 'C004', name: '★★データセンター', amount: 18.0, stage: 'C', expectedCloseMonth: 3, customer: '★★IT', owner: '佐々木' },

  // D案件（話のみ）
  { id: 'D001', name: '○△複合施設計画', amount: 50.0, stage: 'D', expectedCloseMonth: 3, customer: '○△ホールディングス', owner: '松本' },
  { id: 'D002', name: '□×再開発プロジェクト', amount: 35.0, stage: 'D', expectedCloseMonth: 3, customer: '□×都市開発', owner: '井上' },
  { id: 'D003', name: '◇◎新工場構想', amount: 20.0, stage: 'D', expectedCloseMonth: 3, customer: '◇◎自動車', owner: '木村' },
];

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
