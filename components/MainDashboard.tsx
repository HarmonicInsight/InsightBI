'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';
import DIDashboard from '@/components/DIDashboard';
import ActionTracker from '@/components/ActionTracker';
import SettingsModal from '@/components/SettingsModal';
import BusinessTreeDashboard from '@/components/BusinessTreeDashboard';
import MonthlyFollowDashboard from '@/components/MonthlyFollowDashboard';
import PipelineManagement from '@/components/PipelineManagement';
import { PerformanceData } from '@/lib/types';
import { DashboardData } from '@/lib/processData';
import { useSessionTimeout } from '@/lib/useSessionTimeout';
import { addAuditLog } from '@/lib/exportUtils';
import { PipelineStage } from '@/lib/pipelineData';

interface MainDashboardProps {
  performanceData: PerformanceData;
  diData: DashboardData;
}

const mainTabs = [
  {
    id: 'monthly',
    label: '月次フォロー',
    description: 'KPI予実管理',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'pipeline',
    label: 'パイプライン',
    description: '案件管理',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ),
  },
  {
    id: 'kpi',
    label: '業務KPI',
    description: '部門別KPIツリー',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    id: 'company',
    label: '全社業績',
    description: '支社・PJ詳細',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'action',
    label: 'アクション',
    description: '課題フォロー',
    icon: (
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

interface PipelineFilter {
  departmentId?: string;
  stage?: PipelineStage;
}

export default function MainDashboard({ performanceData, diData }: MainDashboardProps) {
  const [activeMain, setActiveMain] = useState<'monthly' | 'pipeline' | 'kpi' | 'company' | 'action'>('monthly');
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  // Session timeout handler
  const handleSessionTimeout = useCallback(async () => {
    addAuditLog('session_timeout', 'セッションがタイムアウトしました');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout on timeout failed:', e);
    }
    setIsAuthenticated(false);
    setShowTimeoutWarning(false);
  }, []);

  // Use session timeout hook (30 minutes default, 5 min warning)
  useSessionTimeout({
    timeoutMinutes: 30,
    onTimeout: handleSessionTimeout,
    warningMinutes: 5,
    onWarning: () => setShowTimeoutWarning(true),
  });

  // Handle navigation to pipeline with filter
  const handleNavigateToPipeline = useCallback((filter: PipelineFilter) => {
    setPipelineFilter(filter);
    setActiveMain('pipeline');
  }, []);

  // Check authentication on mount (server-side session)
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch (err) {
      console.error('Session check failed:', err);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAuthenticated(true);
        setError('');
        addAuditLog('login', `ユーザー "${username}" がログインしました`);
      } else {
        setError(data.error || 'ログインに失敗しました');
        addAuditLog('login_failed', `ログイン失敗: ${username}`);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('サーバーに接続できません');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    addAuditLog('logout', 'ユーザーがログアウトしました');
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setShowTimeoutWarning(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">InsightBI</h1>
            <p className="text-slate-500 mt-2">経営ダッシュボード</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ユーザー名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="ユーザー名を入力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="パスワードを入力"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              © 2025 InsightBI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <div className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="font-bold text-sm">InsightBI 経営ダッシュボード</span>
            </div>
            <div className="flex gap-1">
              {mainTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveMain(tab.id as 'monthly' | 'pipeline' | 'kpi' | 'company' | 'action')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    activeMain === tab.id
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70 hidden sm:inline">
                {performanceData.summary.fiscalYear}
              </span>
              {/* ヘルプ */}
              <Link
                href="/help"
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="ヘルプ"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
              {/* 設定 */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="設定"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              {/* ログアウト */}
              <button
                onClick={handleLogout}
                className="text-xs text-white/70 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* セッションタイムアウト警告 */}
      {showTimeoutWarning && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm">
          <span className="font-medium">セッションがまもなく期限切れになります。</span>
          <span className="ml-2">操作を続けるか、再度ログインしてください。</span>
          <button
            onClick={() => setShowTimeoutWarning(false)}
            className="ml-4 px-2 py-0.5 bg-white/20 rounded hover:bg-white/30 transition-colors"
          >
            閉じる
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeMain === 'monthly' && (
          <MonthlyFollowDashboard onNavigateToPipeline={handleNavigateToPipeline} />
        )}
        {activeMain === 'pipeline' && (
          <PipelineManagement
            initialFilter={pipelineFilter}
            onClearFilter={() => setPipelineFilter({})}
          />
        )}
        {activeMain === 'kpi' && (
          <BusinessTreeDashboard />
        )}
        {activeMain === 'company' && (
          <Dashboard data={performanceData} diData={diData} />
        )}
        {activeMain === 'action' && (
          <div className="h-full overflow-auto bg-slate-50 p-4">
            <ActionTracker data={performanceData} />
          </div>
        )}
      </div>

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
