'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  displayDensity: 'compact' | 'normal' | 'comfortable';
  theme: 'light' | 'dark' | 'system';
  currency: 'jpy' | 'usd';
  dateFormat: 'japanese' | 'iso';
  autoLogout: number; // minutes
  notifications: {
    email: boolean;
    browser: boolean;
    actionReminders: boolean;
  };
}

const defaultSettings: UserSettings = {
  displayDensity: 'normal',
  theme: 'light',
  currency: 'jpy',
  dateFormat: 'japanese',
  autoLogout: 30,
  notifications: {
    email: true,
    browser: true,
    actionReminders: true,
  },
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'display' | 'notifications' | 'security' | 'data'>('display');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('insightbi_settings');
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('insightbi_settings', JSON.stringify(settings));
      setSaveMessage('設定を保存しました');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (e) {
      setSaveMessage('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    // Export all data as JSON
    const exportData = {
      exportDate: new Date().toISOString(),
      settings: settings,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insightbi-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">設定</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex h-[500px]">
            {/* Sidebar */}
            <div className="w-48 bg-slate-50 border-r border-slate-200 p-4">
              <nav className="space-y-1">
                {[
                  { id: 'display', label: '表示設定', icon: '🖥️' },
                  { id: 'notifications', label: '通知', icon: '🔔' },
                  { id: 'security', label: 'セキュリティ', icon: '🔒' },
                  { id: 'data', label: 'データ管理', icon: '📦' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-100 text-indigo-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* 表示設定 */}
              {activeTab === 'display' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      表示密度
                    </label>
                    <select
                      value={settings.displayDensity}
                      onChange={(e) => setSettings({ ...settings, displayDensity: e.target.value as UserSettings['displayDensity'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="compact">コンパクト</option>
                      <option value="normal">標準</option>
                      <option value="comfortable">ゆったり</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      テーマ
                    </label>
                    <select
                      value={settings.theme}
                      onChange={(e) => setSettings({ ...settings, theme: e.target.value as UserSettings['theme'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="light">ライト</option>
                      <option value="dark">ダーク（準備中）</option>
                      <option value="system">システム設定に従う</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      通貨表示
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value as UserSettings['currency'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="jpy">日本円（¥）</option>
                      <option value="usd">米ドル（$）</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      日付形式
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value as UserSettings['dateFormat'] })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="japanese">和暦形式（2025年1月1日）</option>
                      <option value="iso">ISO形式（2025-01-01）</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 通知設定 */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800">メール通知</p>
                      <p className="text-sm text-slate-500">重要な更新をメールで受け取る</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, email: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800">ブラウザ通知</p>
                      <p className="text-sm text-slate-500">デスクトップ通知を表示する</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.browser}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, browser: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-slate-100">
                    <div>
                      <p className="font-medium text-slate-800">アクションリマインダー</p>
                      <p className="text-sm text-slate-500">期限が近いアクションを通知</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications.actionReminders}
                        onChange={(e) => setSettings({
                          ...settings,
                          notifications: { ...settings.notifications, actionReminders: e.target.checked }
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* セキュリティ設定 */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      自動ログアウト（分）
                    </label>
                    <select
                      value={settings.autoLogout}
                      onChange={(e) => setSettings({ ...settings, autoLogout: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value={15}>15分</option>
                      <option value={30}>30分</option>
                      <option value={60}>60分</option>
                      <option value={120}>2時間</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      操作がない場合、指定時間後に自動的にログアウトします
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-2">セキュリティに関する注意</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      <li>• 共有PCでは使用後に必ずログアウトしてください</li>
                      <li>• パスワードは定期的に変更することを推奨します</li>
                      <li>• 不審なアクセスに気づいた場合はすぐにご連絡ください</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* データ管理 */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2">設定のエクスポート</h4>
                    <p className="text-sm text-slate-600 mb-3">
                      現在の設定をJSONファイルとしてダウンロードします
                    </p>
                    <button
                      onClick={handleExportData}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      設定をエクスポート
                    </button>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-800 mb-2">キャッシュのクリア</h4>
                    <p className="text-sm text-slate-600 mb-3">
                      ブラウザに保存されているキャッシュデータを削除します
                    </p>
                    <button
                      onClick={() => {
                        localStorage.removeItem('insightbi_settings');
                        setSettings(defaultSettings);
                        setSaveMessage('キャッシュをクリアしました');
                        setTimeout(() => setSaveMessage(''), 3000);
                      }}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
                    >
                      キャッシュをクリア
                    </button>
                  </div>

                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">データの削除</h4>
                    <p className="text-sm text-red-700 mb-3">
                      アカウントを削除すると、すべてのデータが完全に削除されます。
                      この操作は取り消せません。
                    </p>
                    <button
                      disabled
                      className="px-4 py-2 bg-red-600 text-white rounded-lg opacity-50 cursor-not-allowed text-sm font-medium"
                    >
                      アカウント削除（管理者へ連絡）
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            {saveMessage ? (
              <span className="text-sm text-emerald-600 font-medium">{saveMessage}</span>
            ) : (
              <span className="text-xs text-slate-500">変更は自動的に保存されません</span>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors text-sm font-medium"
              >
                キャンセル
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
