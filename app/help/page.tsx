import Link from 'next/link';

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        <div className="space-y-6">
          {/* バージョン情報 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">InsightBI</h1>
                <p className="text-slate-500">経営ダッシュボード</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">バージョン</p>
                <p className="text-lg font-bold text-slate-800">{APP_VERSION}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">リリース日</p>
                <p className="text-lg font-bold text-slate-800">2025年1月</p>
              </div>
            </div>
          </div>

          {/* クイックスタートガイド */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              クイックスタートガイド
            </h2>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h3 className="font-medium text-slate-800">ダッシュボードを確認</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    「全社ダッシュボード」タブで、売上・粗利などの主要KPIを一覧で確認できます。
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <h3 className="font-medium text-slate-800">支社・セグメント分析</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    「支社分析」「セグメント」タブで、詳細な分析を行えます。ヒートマップで問題箇所を特定できます。
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h3 className="font-medium text-slate-800">アクション管理</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    問題点に対するアクションアイテムを登録・管理できます。担当者へのアサインや期限管理も可能です。
                  </p>
                </div>
              </div>

              <div className="flex gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                <div>
                  <h3 className="font-medium text-slate-800">時系列分析</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    「時系列」タブで、月次推移や予算比較を確認できます。見通しの変動履歴も追跡可能です。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* よくある質問 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              よくある質問
            </h2>

            <div className="space-y-4">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="font-medium text-slate-800">データはどこに保存されますか？</span>
                  <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-4 text-slate-600">
                  データはセキュアなクラウドサーバーに暗号化して保存されます。
                  お客様のデータは厳格なアクセス制御により保護されています。
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="font-medium text-slate-800">複数ユーザーで利用できますか？</span>
                  <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-4 text-slate-600">
                  はい、チームプランでは複数ユーザーでの利用が可能です。
                  ユーザーごとに権限を設定することもできます。
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="font-medium text-slate-800">データのエクスポートは可能ですか？</span>
                  <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-4 text-slate-600">
                  設定画面からCSV形式でデータをエクスポートできます。
                  レポートの印刷機能もご利用いただけます。
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <span className="font-medium text-slate-800">セッションの有効期限はどのくらいですか？</span>
                  <svg className="w-5 h-5 text-slate-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="p-4 text-slate-600">
                  セキュリティのため、セッションは8時間で自動的に期限切れとなります。
                  また、30分間操作がない場合は自動ログアウトされます。
                </div>
              </details>
            </div>
          </div>

          {/* お問い合わせ */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              お問い合わせ・サポート
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-medium text-slate-800 mb-2">テクニカルサポート</h3>
                <p className="text-sm text-slate-600 mb-2">技術的なお問い合わせはこちら</p>
                <p className="text-indigo-600 font-medium">support@insightbi.example.com</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-medium text-slate-800 mb-2">営業・契約について</h3>
                <p className="text-sm text-slate-600 mb-2">契約・プランのご相談はこちら</p>
                <p className="text-indigo-600 font-medium">sales@insightbi.example.com</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-sm text-indigo-800">
                <span className="font-medium">サポート受付時間:</span> 平日 9:00 - 18:00（土日祝日を除く）
              </p>
            </div>
          </div>

          {/* 法的情報へのリンク */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4">法的情報</h2>
            <div className="flex gap-4">
              <Link
                href="/terms"
                className="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                利用規約
              </Link>
              <Link
                href="/privacy"
                className="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                プライバシーポリシー
              </Link>
            </div>
          </div>

          {/* フッター */}
          <div className="text-center pt-8">
            <p className="text-sm text-slate-500">© 2025 InsightBI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
