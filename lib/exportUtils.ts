/**
 * データエクスポートユーティリティ
 */

// CSVエスケープ処理
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 配列データをCSV文字列に変換
export function arrayToCSV<T extends object>(
  data: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return '';

  const keys = headers ? headers.map(h => h.key) : Object.keys(data[0]) as (keyof T)[];
  const headerRow = headers
    ? headers.map(h => escapeCSV(h.label)).join(',')
    : keys.map(k => escapeCSV(String(k))).join(',');

  const rows = data.map(item =>
    keys.map(key => escapeCSV(item[key] as string | number)).join(',')
  );

  return [headerRow, ...rows].join('\n');
}

// CSVファイルをダウンロード
export function downloadCSV(csv: string, filename: string): void {
  // BOMを追加してExcelで文字化けを防ぐ
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// JSONファイルをダウンロード
export function downloadJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 支社パフォーマンスデータをCSVにエクスポート
export function exportBranchPerformanceCSV(
  branchPerformance: Array<{
    branch: string;
    total: { revenue: number; grossProfit: number; grossMargin: number };
    segments: Record<string, { revenue: number; grossProfit: number; grossMargin: number }>;
  }>
): void {
  const rows: Array<{
    支社: string;
    セグメント: string;
    売上高: number;
    粗利益: number;
    粗利率: string;
  }> = [];

  branchPerformance.forEach(branch => {
    // 支社合計
    rows.push({
      支社: branch.branch,
      セグメント: '合計',
      売上高: branch.total.revenue,
      粗利益: branch.total.grossProfit,
      粗利率: `${branch.total.grossMargin.toFixed(1)}%`,
    });

    // セグメント別
    Object.entries(branch.segments).forEach(([segmentName, segment]) => {
      rows.push({
        支社: branch.branch,
        セグメント: segmentName,
        売上高: segment.revenue,
        粗利益: segment.grossProfit,
        粗利率: `${segment.grossMargin.toFixed(1)}%`,
      });
    });
  });

  const csv = arrayToCSV(rows, [
    { key: '支社', label: '支社' },
    { key: 'セグメント', label: 'セグメント' },
    { key: '売上高', label: '売上高' },
    { key: '粗利益', label: '粗利益' },
    { key: '粗利率', label: '粗利率' },
  ]);

  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `支社別業績_${date}.csv`);
}

// アクションアイテムをCSVにエクスポート
export function exportActionsCSV(
  actions: Array<{
    id: string;
    category: string;
    targetName: string;
    issue: string;
    action: string;
    assignee: string;
    dueDate: string;
    status: string;
    priority: string;
  }>
): void {
  const rows = actions.map(action => ({
    ID: action.id,
    カテゴリ: action.category,
    対象: action.targetName,
    課題: action.issue,
    アクション: action.action,
    担当者: action.assignee,
    期限: action.dueDate,
    ステータス: action.status,
    優先度: action.priority,
  }));

  const csv = arrayToCSV(rows, [
    { key: 'ID', label: 'ID' },
    { key: 'カテゴリ', label: 'カテゴリ' },
    { key: '対象', label: '対象' },
    { key: '課題', label: '課題' },
    { key: 'アクション', label: 'アクション' },
    { key: '担当者', label: '担当者' },
    { key: '期限', label: '期限' },
    { key: 'ステータス', label: 'ステータス' },
    { key: '優先度', label: '優先度' },
  ]);

  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `アクション一覧_${date}.csv`);
}

// 印刷用のウィンドウを開く
export function printDashboard(): void {
  window.print();
}

// 監査ログエントリの型
export interface AuditLogEntry {
  timestamp: string;
  action: string;
  userId?: string;
  details?: string;
  ipAddress?: string;
}

// 監査ログを取得（ローカルストレージから）
export function getAuditLogs(): AuditLogEntry[] {
  try {
    const logs = localStorage.getItem('insightbi_audit_logs');
    return logs ? JSON.parse(logs) : [];
  } catch {
    return [];
  }
}

// 監査ログを追加
export function addAuditLog(action: string, details?: string): void {
  try {
    const logs = getAuditLogs();
    const newEntry: AuditLogEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
    };
    logs.unshift(newEntry);
    // 最新100件のみ保持
    const trimmedLogs = logs.slice(0, 100);
    localStorage.setItem('insightbi_audit_logs', JSON.stringify(trimmedLogs));
  } catch (e) {
    console.error('Failed to add audit log:', e);
  }
}

// 監査ログをエクスポート
export function exportAuditLogs(): void {
  const logs = getAuditLogs();
  const csv = arrayToCSV(logs, [
    { key: 'timestamp', label: 'タイムスタンプ' },
    { key: 'action', label: 'アクション' },
    { key: 'details', label: '詳細' },
  ]);

  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `監査ログ_${date}.csv`);
}
