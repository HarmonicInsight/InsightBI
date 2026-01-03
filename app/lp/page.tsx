'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-800">InsightBI <span className="text-indigo-600">Suite</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#features" className="text-slate-600 hover:text-slate-900">特徴</a>
              <a href="#pricing" className="text-slate-600 hover:text-slate-900">料金</a>
              <a href="#cases" className="text-slate-600 hover:text-slate-900">導入事例</a>
              <a href="#faq" className="text-slate-600 hover:text-slate-900">よくある質問</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">ログイン</Link>
              <a href="#cta" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                無料で試す
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ① ヒーローセクション */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4 tracking-wide">
              プロジェクト型ビジネス専用
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              財務会計が確定する<span className="text-indigo-600">前</span>に、<br />
              目標達成の可否を判断する
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
              月次PLを待っていては遅すぎる。<br />
              InsightBI は、経営者が「次の一手」を決めるための<br className="sm:hidden" />
              管理会計ダッシュボードです。
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {['建設業', 'システム開発・SI', 'コンサルティング', 'エンジニアリング'].map((t, i) => (
                <span key={i} className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {t}
                </span>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <a href="#cta" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-bold transition-colors shadow-lg shadow-indigo-600/30">
                お問い合わせ
              </a>
              <a href="#problem" className="w-full sm:w-auto flex items-center justify-center gap-2 text-slate-700 hover:text-slate-900 px-6 py-4 border border-slate-200 rounded-xl">
                <span className="font-medium">詳しく見る</span>
              </a>
            </div>
          </div>

          {/* ダッシュボードプレビュー */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="p-4 bg-slate-50">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: '売上高', value: '92.5億', rate: '93%', color: 'bg-amber-50' },
                    { label: '粗利益', value: '13.5億', rate: '90%', color: 'bg-amber-50' },
                    { label: '粗利率', value: '14.6%', rate: '目標15%', color: 'bg-slate-50' },
                    { label: '受注残', value: '115億', rate: '順調', color: 'bg-emerald-50' },
                  ].map((kpi, i) => (
                    <div key={i} className={`${kpi.color} rounded-lg p-3`}>
                      <div className="text-[10px] text-slate-500">{kpi.label}</div>
                      <div className="text-lg font-bold text-slate-800">{kpi.value}</div>
                      <div className="text-[10px] text-slate-500">{kpi.rate}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg p-3 h-32 flex items-end gap-1">
                  {[40, 65, 55, 75, 60, 80, 45, 70, 85, 50, 30, 20].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-full shadow-lg border border-slate-100">
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  導入企業 50社+
                </span>
                <span className="text-slate-300">|</span>
                <span>建設業専門</span>
                <span className="text-slate-300">|</span>
                <span>初期費用0円</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ② 問題提起セクション */}
      <section id="problem" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-xs font-semibold text-indigo-600 mb-2 tracking-wide">問題提起</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            なぜ今のダッシュボードは経営判断に使えないのか
          </h2>
          <p className="text-slate-600 mb-8">
            多くのBI・ERPは「財務会計で確定した後の世界」しか見ていません。<br />
            しかしプロジェクト型ビジネスでは、問題は会計に出る前に起きています。
          </p>

          <div className="space-y-4">
            {[
              {
                title: '判断が常に1〜3ヶ月遅れる',
                desc: '売上は未来に確定し、原価は後から効いてくる。なのにダッシュボードは「確定してから」しか見せない。会計が確定するのを待っていたら、手を打つタイミングを逃す。',
              },
              {
                title: '原価管理は「管理会計」なのに、ダッシュボードがそれを前提にしていない',
                desc: '管理会計では、原価は「結果」ではなく「コントロール対象」。原価率を前提に売上・利益を読む。しかし多くのダッシュボードは、売上が先、原価は後追い。',
              },
              {
                title: '総原価が分かっている前提で設計されている',
                desc: '建設・SI請負の実務では、総原価は最後まで分からない。追加・設計変更・天候・人手不足。分からないのに「確定値」を出すから、ダッシュボードが嘘をつく。',
              },
              {
                title: '工事原価・未収金・未払金の振替が仕組みとして難しい',
                desc: '原価発生と請求・検収のタイミングがズレる。工事別に原価を集めきれない。未成工事支出金への振替が手作業・月末調整・属人化。',
              },
            ].map((p, i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="font-bold text-red-600 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* インサイト（核心メッセージ） */}
      <section className="py-12 bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <blockquote className="text-xl font-medium text-white leading-relaxed mb-4">
            「正しい会計処理をしようとすると、経営判断が遅れる」<br />
            この矛盾を、構造で解決する。
          </blockquote>
          <p className="text-slate-400 text-sm">
            InsightBI は、財務会計で正しいかどうかより、経営判断に使えるかどうかを優先します。
          </p>
        </div>
      </section>

      {/* ③ 設計思想セクション */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-xs font-semibold text-indigo-600 mb-2 tracking-wide">設計思想</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            財務会計中心から、管理会計中心へ
          </h2>
          <p className="text-slate-600 mb-8">
            目的が違うのに、同じ構造を使っていることが問題の本質です。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* 現状 */}
            <div className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h3 className="text-xs font-bold text-red-600 mb-4 tracking-wide">現状のダッシュボード</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {['中心は財務会計', '売上は確定値', '原価は結果', '原価率は表示するだけ', '未収未払は会計処理', 'ダッシュボードは集計ツール'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-red-400">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* InsightBI */}
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
              <h3 className="text-xs font-bold text-indigo-600 mb-4 tracking-wide">InsightBI</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                {['中心は管理会計', '売上は「状態」で見る', '原価はコントロール対象', '原価率は判断軸', '未収未払はリスク信号', 'ダッシュボードは意思決定ツール'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 font-medium">
                    <span className="text-indigo-500">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3レイヤー構造 */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-xs font-semibold text-indigo-600 mb-2 tracking-wide">構造</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            売上・利益は「確定値」ではなく「3つの状態」で見る
          </h2>
          <p className="text-slate-600 mb-8">
            売上を1つの数字に決めた瞬間、他が見えなくなる。InsightBI は3レイヤーで構造的に把握します。
          </p>

          <div className="space-y-3">
            {[
              { badge: '会計', badgeColor: 'bg-slate-200 text-slate-600', title: 'Accounting Revenue', desc: '完成基準・進行基準・請求基準。財務諸表と一致する確定売上。', role: '結果確認', main: false },
              { badge: '経営', badgeColor: 'bg-indigo-600 text-white', title: 'Management Revenue', desc: '内部進捗 × 見積総額。最新見込み原価に基づく将来着地予測。', role: '意思決定の主役', main: true },
              { badge: '現金', badgeColor: 'bg-amber-400 text-white', title: 'Cash Revenue', desc: '請求額・入金額・滞留額。実際のお金の動き。', role: '資金繰り警戒', main: false },
            ].map((layer, i) => (
              <div key={i} className={`p-5 rounded-xl border ${layer.main ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded ${layer.badgeColor}`}>{layer.badge}</span>
                    <div>
                      <h3 className="font-semibold text-slate-800">{layer.title}</h3>
                      <p className="text-sm text-slate-500">{layer.desc}</p>
                    </div>
                  </div>
                  <span className={`text-xs ${layer.main ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>{layer.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9つのKPI */}
      <section id="kpi" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-xs font-semibold text-indigo-600 mb-2 tracking-wide">KPI</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            目標達成を判断するための9つの指標
          </h2>
          <p className="text-slate-600 mb-8">
            すべてが経営判断に直結。見た瞬間に「やる／やらない」が決まる。
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { num: '01', title: '着地売上見込み', desc: '確度加重で算出' },
              { num: '02', title: '売上目標ギャップ', desc: '今後積むべき売上' },
              { num: '03', title: '確定売上', desc: '受注済み、守るべき売上' },
              { num: '04', title: '見込み売上の質', desc: '確度別の構成' },
              { num: '05', title: '新規売上比率', desc: '成長構造の依存度' },
              { num: '06', title: '既存顧客の追加余地', desc: '最短で積める領域' },
              { num: '07', title: '案件別粗利率の劣化', desc: '利益を失っていないか' },
              { num: '08', title: '原価消化 vs 進捗', desc: '赤字化の予兆' },
              { num: '09', title: '売上・案件の集中度', desc: '依存リスク' },
            ].map((kpi, i) => (
              <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="text-xs font-bold text-indigo-600 mb-1">{kpi.num}</div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">{kpi.title}</h3>
                <p className="text-xs text-slate-500">{kpi.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 仕組み（簡潔に） */}
      <section className="py-20 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-xs font-semibold text-indigo-600 mb-2 tracking-wide">仕組み</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
            CSVを入れるだけで動く
          </h2>
          <p className="text-slate-600 mb-8">高額なETLツールや専門知識は不要。</p>

          <div className="grid grid-cols-3 gap-6">
            {[
              { num: '1', title: 'CSVをアップロード', desc: '会計・営業管理からエクスポートしたCSVをそのまま' },
              { num: '2', title: '自動でデータ変換', desc: '独自ETLエンジンが整形。AIがマッピングを提案' },
              { num: '3', title: '判断に使う', desc: '3レイヤー × 9 KPIで即座に状況把握' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                  {s.num}
                </div>
                <h3 className="font-bold text-slate-800 mb-1">{s.title}</h3>
                <p className="text-xs text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ④ 機能紹介セクション */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4">
            建設会社に必要な数字が、ひと目でわかる
          </h2>
          <p className="text-center text-slate-600 mb-12">経営者が本当に見たい指標を厳選</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '📈', title: 'P/L推移', desc: '月次の売上・原価・利益を時系列で把握' },
              { icon: '🏗️', title: '工事別採算', desc: '案件ごとの粗利・進捗・原価推移を確認' },
              { icon: '⚠️', title: 'アラート', desc: '粗利率低下、滞留債権を自動で検知・通知' },
              { icon: '📱', title: 'スマホ対応', desc: '外出先でもスマホで数字をチェック' },
              { icon: '💬', title: 'アクション管理', desc: '課題をその場で担当者にアサイン' },
              { icon: '🔒', title: 'セキュリティ', desc: '銀行レベルの暗号化で安心' },
            ].map((f, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6 hover:bg-slate-100 transition-colors">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑤ 比較セクション */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            他のBIツールとの違い
          </h2>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="py-4 px-4 text-left font-medium"></th>
                    <th className="py-4 px-4 text-center font-bold bg-indigo-600">InsightBI Suite</th>
                    <th className="py-4 px-4 text-center font-medium">Power BI</th>
                    <th className="py-4 px-4 text-center font-medium">Tableau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { label: '月額費用', genba: '3万円〜', power: '無料〜', tableau: '9万円〜' },
                    { label: 'ETLツール', genba: '✅ 不要', power: '別途必要', tableau: '別途必要' },
                    { label: '導入期間', genba: '✅ 即日', power: '1-3ヶ月', tableau: '1-3ヶ月' },
                    { label: '専門知識', genba: '✅ 不要', power: 'SQL必要', tableau: 'SQL必要' },
                    { label: '建設業対応', genba: '✅ 標準', power: '要カスタム', tableau: '要カスタム' },
                    { label: '日本語サポート', genba: '✅ 完全対応', power: '限定的', tableau: '限定的' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-700">{row.label}</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600 bg-indigo-50">{row.genba}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{row.power}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{row.tableau}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 bg-amber-50 rounded-lg p-4 border border-amber-200">
            <p className="text-sm text-amber-800">
              💡 Power BI は「無料」でも、使うには専門知識が必要です。InsightBI Suite は「すぐ使える」にこだわりました。
            </p>
          </div>
        </div>
      </section>

      {/* ⑥ 料金セクション */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-4">
            シンプルな料金体系
          </h2>
          <p className="text-center text-slate-600 mb-12">初期費用0円、いつでも解約OK</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* スタンダード */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-8">
              <h3 className="text-lg font-bold text-slate-800 mb-2">スタンダード</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-800">¥30,000</span>
                <span className="text-slate-500">/月（税別）</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['ダッシュボード', 'CSV取込', 'ユーザー3名', 'メールサポート'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-slate-600">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-lg font-medium transition-colors">
                無料で試す
              </a>
            </div>

            {/* プロ */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                おすすめ
              </div>
              <h3 className="text-lg font-bold mb-2">プロ</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">¥50,000</span>
                <span className="text-white/80">/月（税別）</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['スタンダード全機能', 'ユーザー10名', '専任サポート', '工事別分析', 'API連携'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#cta" className="block w-full text-center bg-white text-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-50 transition-colors">
                無料で試す
              </a>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              初期費用 0円
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              14日間無料トライアル
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              いつでも解約OK
            </span>
          </div>
        </div>
      </section>

      {/* ⑦ 導入事例セクション */}
      <section id="cases" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            導入企業の声
          </h2>

          <div className="space-y-6">
            {[
              {
                quote: '毎月の経営会議が、数字を見ながら議論できるようになりました',
                name: '山田 太郎',
                role: '株式会社○○建設 代表取締役',
                company: '従業員50名 / 売上高30億円',
                problem: 'Excelでの報告資料作成に毎月3日かかっていた',
                result: '報告資料が不要に。会議時間も半減。',
              },
              {
                quote: 'Power BI で挫折した経験がありましたが、これは本当にCSVを入れるだけでした',
                name: '佐藤 花子',
                role: '株式会社△△組 経理部長',
                company: '従業員120名 / 売上高80億円',
                problem: 'BIツール導入に何度も失敗',
                result: '導入初日から稼働。社長も毎日見ている。',
              },
            ].map((case_, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {case_.name[0]}
                  </div>
                  <div className="flex-1">
                    <blockquote className="text-lg font-medium text-slate-800 mb-4">
                      &quot;{case_.quote}&quot;
                    </blockquote>
                    <div className="text-sm text-slate-600 mb-4">
                      <div className="font-medium">{case_.name}</div>
                      <div>{case_.role}</div>
                      <div className="text-slate-400">{case_.company}</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400 text-xs mb-1">課題</div>
                        <div className="text-slate-600">{case_.problem}</div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">効果</div>
                        <div className="text-emerald-600 font-medium">{case_.result}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑧ よくある質問 */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-12">
            よくある質問
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'どの会計ソフトに対応していますか？',
                a: '勘定奉行、弥生会計、freee、マネーフォワード、建設大臣など、CSVエクスポートできるソフトならすべて対応しています。',
              },
              {
                q: '本当にCSVを入れるだけですか？',
                a: 'はい。初回のみ「この列が売上」「この列が原価」という対応付けが必要ですが、AIが自動提案します。2回目以降は完全自動です。',
              },
              {
                q: 'セキュリティは大丈夫ですか？',
                a: '銀行と同レベルの暗号化（SSL/TLS）を採用。データは日本国内のサーバーに保存されます。',
              },
              {
                q: '建設業以外でも使えますか？',
                a: 'はい。製造業、卸売業向けのテンプレートもご用意しています。お問い合わせください。',
              },
              {
                q: '無料トライアルで何ができますか？',
                a: '14日間、すべての機能をお試しいただけます。クレジットカード登録不要で始められます。',
              },
            ].map((faq, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-800">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-slate-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⑨ CTAセクション */}
      <section id="cta" className="py-20 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            今すぐ、経営の見える化を始めよう
          </h2>
          <p className="text-white/90 mb-8">
            14日間無料。クレジットカード不要。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              無料で試す
            </Link>
            <a
              href="mailto:contact@insightbi.jp"
              className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/10 transition-colors"
            >
              お問い合わせ
            </a>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-white font-bold">InsightBI Suite</span>
              </div>
              <p className="text-sm">建設会社のための経営ダッシュボード</p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">サービス</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white">機能紹介</a></li>
                <li><a href="#pricing" className="hover:text-white">料金</a></li>
                <li><a href="#cases" className="hover:text-white">導入事例</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">サポート</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#faq" className="hover:text-white">よくある質問</a></li>
                <li><a href="mailto:support@insightbi.jp" className="hover:text-white">お問い合わせ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">会社情報</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="hover:text-white">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-white">プライバシーポリシー</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            © 2025 InsightBI Suite. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
