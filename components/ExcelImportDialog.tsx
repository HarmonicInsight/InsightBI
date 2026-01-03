'use client';

import { useState, useCallback } from 'react';
import { parseExcelFile, getExcelSheetNames, saveImportedPipeline } from '@/lib/excelImport';
import { PipelineItem } from '@/lib/pipelineData';

interface ExcelImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: PipelineItem[]) => void;
}

export default function ExcelImportDialog({ isOpen, onClose, onImport }: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<PipelineItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsLoading(true);
    setErrors([]);
    setWarnings([]);

    try {
      const sheets = await getExcelSheetNames(selectedFile);
      setSheetNames(sheets);
      // デフォルトでフォロー状況を選択、なければ最初のシート
      const defaultSheet = sheets.find(s => s.includes('フォロー')) || sheets[0];
      setSelectedSheet(defaultSheet);
    } catch (e) {
      setErrors([`ファイル読み込みエラー: ${e}`]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePreview = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setErrors([]);
    setWarnings([]);

    try {
      const result = await parseExcelFile(file, selectedSheet);
      setPreviewData(result.items);
      setErrors(result.errors);
      setWarnings(result.warnings);
      setStep('preview');
    } catch (e) {
      setErrors([`解析エラー: ${e}`]);
    } finally {
      setIsLoading(false);
    }
  }, [file, selectedSheet]);

  const handleImport = useCallback(() => {
    if (previewData.length === 0) return;

    saveImportedPipeline(previewData);
    onImport(previewData);
    setStep('complete');
  }, [previewData, onImport]);

  const handleClose = useCallback(() => {
    setFile(null);
    setSheetNames([]);
    setSelectedSheet('');
    setPreviewData([]);
    setErrors([]);
    setWarnings([]);
    setStep('upload');
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Excelインポート</h2>
            <p className="text-xs text-slate-500">アカウントフォロー形式のExcelファイルをインポート</p>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* ファイル選択 */}
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file-input"
                />
                <label htmlFor="excel-file-input" className="cursor-pointer">
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-sm text-slate-600 mb-2">
                    Excelファイルをドラッグ＆ドロップ、またはクリックして選択
                  </div>
                  <div className="text-xs text-slate-400">.xlsx, .xls 形式に対応</div>
                </label>
              </div>

              {/* ファイル情報 */}
              {file && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <div className="font-medium text-slate-800">{file.name}</div>
                      <div className="text-xs text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>

                  {sheetNames.length > 0 && (
                    <div className="mt-3">
                      <label className="text-xs text-slate-500 block mb-1">インポートするシート</label>
                      <select
                        value={selectedSheet}
                        onChange={(e) => setSelectedSheet(e.target.value)}
                        className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
                      >
                        {sheetNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* エラー */}
              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-red-700 mb-1">エラー</div>
                  {errors.map((e, i) => (
                    <div key={i} className="text-xs text-red-600">{e}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              {/* サマリー */}
              <div className="bg-indigo-50 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-indigo-700">
                    {previewData.length}件の案件を検出
                  </div>
                  <div className="text-xs text-indigo-500">
                    総額: {previewData.reduce((s, p) => s + p.amount, 0).toFixed(1)}億円
                  </div>
                </div>
                {warnings.length > 0 && (
                  <span className="text-xs text-amber-600">{warnings.length}件の警告</span>
                )}
              </div>

              {/* 警告 */}
              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-24 overflow-y-auto">
                  <div className="text-sm font-medium text-amber-700 mb-1">警告</div>
                  {warnings.slice(0, 5).map((w, i) => (
                    <div key={i} className="text-xs text-amber-600">{w}</div>
                  ))}
                  {warnings.length > 5 && (
                    <div className="text-xs text-amber-500 mt-1">...他{warnings.length - 5}件</div>
                  )}
                </div>
              )}

              {/* プレビューテーブル */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-xs text-slate-600">
                      <th className="py-2 px-3 text-left font-medium">確度</th>
                      <th className="py-2 px-3 text-left font-medium">案件名</th>
                      <th className="py-2 px-3 text-left font-medium">顧客</th>
                      <th className="py-2 px-3 text-right font-medium">金額</th>
                      <th className="py-2 px-3 text-left font-medium">チーム</th>
                      <th className="py-2 px-3 text-left font-medium">担当</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((item, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            item.stage === 'A' ? 'bg-emerald-100 text-emerald-700' :
                            item.stage === 'B' ? 'bg-blue-100 text-blue-700' :
                            item.stage === 'C' ? 'bg-cyan-100 text-cyan-700' :
                            item.stage === 'D' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {item.stage}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">{item.name}</td>
                        <td className="py-2 px-3 text-slate-600">{item.customer}</td>
                        <td className="py-2 px-3 text-right font-medium">{item.amount.toFixed(2)}億</td>
                        <td className="py-2 px-3 text-slate-500 text-xs">{item.subTeamId || '-'}</td>
                        <td className="py-2 px-3 text-slate-500 text-xs">{item.owner}</td>
                      </tr>
                    ))}
                    {previewData.length > 10 && (
                      <tr className="border-t border-slate-100 bg-slate-50">
                        <td colSpan={6} className="py-2 px-3 text-center text-xs text-slate-500">
                          ...他{previewData.length - 10}件
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <div className="text-lg font-bold text-slate-800 mb-2">インポート完了</div>
              <div className="text-sm text-slate-600">
                {previewData.length}件の案件をインポートしました
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          {step === 'upload' && (
            <>
              <button onClick={handleClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                キャンセル
              </button>
              <button
                onClick={handlePreview}
                disabled={!file || isLoading}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '読み込み中...' : 'プレビュー'}
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('upload')} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
                戻る
              </button>
              <button
                onClick={handleImport}
                disabled={previewData.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                インポート実行
              </button>
            </>
          )}
          {step === 'complete' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
