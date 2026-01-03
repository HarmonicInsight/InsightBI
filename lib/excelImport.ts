// Excel インポートユーティリティ
import * as XLSX from 'xlsx';
import { PipelineItem, PipelineStage, ProjectType, pipelineStages, subTeams } from './pipelineData';

// Excelカラムマッピング（アカウントフォロー形式）
export interface ExcelColumnMapping {
  subTeam: string;        // サブチーム
  clientName: string;     // クライアント名
  projectName: string;    // PJ名
  projectType: string;    // 種類（継続/新規）
  comment: string;        // コメント
  member: string;         // メンバ
  stage: string;          // 確度
  grossMarginRate: string; // 粗利率
  monthColumns: { [month: number]: string }; // 月別売上カラム
}

// デフォルトカラムマッピング
export const defaultColumnMapping: ExcelColumnMapping = {
  subTeam: 'サブチーム',
  clientName: 'クライアント名',
  projectName: 'PJ名',
  projectType: '',  // 4列目が種類
  comment: 'コメント',
  member: 'メンバ',
  stage: '確度',
  grossMarginRate: '粗利率',
  monthColumns: {
    1: '1月', 2: '2月', 3: '3月', 4: '4月', 5: '5月', 6: '6月',
    7: '7月', 8: '8月', 9: '9月', 10: '10月', 11: '11月', 12: '12月',
  },
};

// 確度文字列をPipelineStageに変換
function parseStage(stageStr: string | undefined | null): PipelineStage {
  if (!stageStr) return 'O';
  const upper = String(stageStr).toUpperCase().trim();
  if (['A', 'B', 'C', 'D', 'O'].includes(upper)) {
    return upper as PipelineStage;
  }
  // '-' や 'ー' は O として扱う
  if (upper === '-' || upper === 'ー' || upper === '') {
    return 'O';
  }
  return 'O';
}

// プロジェクトタイプを解析
function parseProjectType(typeStr: string | undefined | null): ProjectType | undefined {
  if (!typeStr) return undefined;
  const lower = String(typeStr).toLowerCase().trim();
  if (lower.includes('継続') || lower === 'continue') return 'continue';
  if (lower.includes('新規') || lower === 'new') return 'new';
  return undefined;
}

// 粗利率を解析（0-1の範囲に正規化）
function parseGrossMarginRate(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return undefined;
  // 1より大きい場合はパーセント表記とみなす
  return num > 1 ? num / 100 : num;
}

// 金額を解析（億円単位に変換）
function parseAmount(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
  if (isNaN(num)) return 0;
  // 100万以上なら円単位とみなして億に変換
  if (num >= 1000000) {
    return num / 100000000; // 億円に変換
  }
  return num;
}

// メンバー文字列を配列に変換
function parseMembers(memberStr: string | undefined | null): string[] {
  if (!memberStr) return [];
  return String(memberStr).split(/[、,，]/).map(m => m.trim()).filter(m => m);
}

// サブチームIDを解決
function resolveSubTeamId(teamName: string | undefined | null): string | undefined {
  if (!teamName) return undefined;
  const name = String(teamName).trim();
  const found = subTeams.find(t => t.name === name || t.id === name);
  return found?.id;
}

// Excelファイルを解析してPipelineItemsに変換
export async function parseExcelFile(file: File, sheetName?: string): Promise<{
  items: PipelineItem[];
  errors: string[];
  warnings: string[];
}> {
  const items: PipelineItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // シート選択
    const targetSheet = sheetName || 'フォロー状況';
    const sheet = workbook.Sheets[targetSheet] || workbook.Sheets[workbook.SheetNames[0]];

    if (!sheet) {
      errors.push('シートが見つかりません');
      return { items, errors, warnings };
    }

    // シートをJSONに変換
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

    if (jsonData.length < 2) {
      errors.push('データが不足しています');
      return { items, errors, warnings };
    }

    // ヘッダー行を取得
    const headers = jsonData[0] as string[];
    const headerIndex: { [key: string]: number } = {};
    headers.forEach((h, i) => {
      if (h) headerIndex[String(h).trim()] = i;
    });

    // カラムインデックスを特定
    const colIdx = {
      subTeam: headerIndex['サブチーム'] ?? 0,
      clientName: headerIndex['クライアント名'] ?? 1,
      projectName: headerIndex['PJ名'] ?? 2,
      projectType: 3, // 4列目
      comment: headerIndex['コメント'] ?? 4,
      member: headerIndex['メンバ'] ?? 5,
      stage: headerIndex['確度'] ?? 6,
      grossMarginRate: headerIndex['粗利率'] ?? 7,
    };

    // 月別カラムを探す
    const monthColIdx: { [month: number]: number } = {};
    for (let m = 1; m <= 12; m++) {
      const monthName = `${m}月`;
      if (headerIndex[monthName] !== undefined) {
        monthColIdx[m] = headerIndex[monthName];
      }
      // 見込列も探す
      const forecastName = `${m}月見込`;
      if (headerIndex[forecastName] !== undefined) {
        monthColIdx[m] = headerIndex[forecastName];
      }
    }

    // データ行を処理
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i] as unknown[];
      if (!row || row.length === 0) continue;

      const clientName = row[colIdx.clientName];
      const projectName = row[colIdx.projectName];

      // クライアント名またはプロジェクト名がない行はスキップ
      if (!clientName && !projectName) continue;
      // 合計行などをスキップ
      if (String(clientName).includes('合計') || String(clientName).includes('計')) continue;

      try {
        // 月別売上を解析
        const monthlyRevenue: { [month: number]: number } = {};
        let totalMonthly = 0;
        Object.entries(monthColIdx).forEach(([m, idx]) => {
          const amount = parseAmount(row[idx]);
          if (amount > 0) {
            monthlyRevenue[parseInt(m)] = amount;
            totalMonthly += amount;
          }
        });

        const item: PipelineItem = {
          id: `IMPORT_${i}_${Date.now()}`,
          name: String(projectName || clientName || '').trim(),
          amount: totalMonthly > 0 ? totalMonthly : 0,
          stage: parseStage(row[colIdx.stage] as string),
          expectedCloseMonth: Object.keys(monthlyRevenue).length > 0
            ? Math.min(...Object.keys(monthlyRevenue).map(Number))
            : 10,
          customer: String(clientName || '').trim(),
          owner: parseMembers(row[colIdx.member] as string)[0] || '未設定',
          departmentId: 'sales1', // デフォルト
          subTeamId: resolveSubTeamId(row[colIdx.subTeam] as string),
          projectType: parseProjectType(row[colIdx.projectType] as string),
          grossMarginRate: parseGrossMarginRate(row[colIdx.grossMarginRate]),
          members: parseMembers(row[colIdx.member] as string),
          comment: row[colIdx.comment] ? String(row[colIdx.comment]).trim() : undefined,
          monthlyRevenue: Object.keys(monthlyRevenue).length > 0 ? monthlyRevenue : undefined,
        };

        // バリデーション
        if (!item.name) {
          warnings.push(`行${i + 1}: 案件名が空のためスキップ`);
          continue;
        }

        if (item.amount === 0 && !item.monthlyRevenue) {
          warnings.push(`行${i + 1}: ${item.name} - 金額が0`);
        }

        items.push(item);
      } catch (e) {
        errors.push(`行${i + 1}: 解析エラー - ${e}`);
      }
    }

    return { items, errors, warnings };
  } catch (e) {
    errors.push(`ファイル読み込みエラー: ${e}`);
    return { items, errors, warnings };
  }
}

// インポートしたデータをLocalStorageに保存
export function saveImportedPipeline(items: PipelineItem[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('insightbi_imported_pipeline', JSON.stringify(items));
    localStorage.setItem('insightbi_import_timestamp', new Date().toISOString());
  }
}

// LocalStorageからインポート済みデータを読み込み
export function loadImportedPipeline(): PipelineItem[] | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('insightbi_imported_pipeline');
    if (stored) {
      return JSON.parse(stored);
    }
  }
  return null;
}

// インポート日時を取得
export function getImportTimestamp(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('insightbi_import_timestamp');
  }
  return null;
}

// インポートデータをクリア
export function clearImportedPipeline(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('insightbi_imported_pipeline');
    localStorage.removeItem('insightbi_import_timestamp');
  }
}

// Excelシート一覧を取得
export async function getExcelSheetNames(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return workbook.SheetNames;
}
