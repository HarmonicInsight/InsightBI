import Link from 'next/link';

export default function PrivacyPage() {
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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">プライバシーポリシー</h1>
          <p className="text-sm text-slate-500 mb-8">最終更新日: 2025年1月1日</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">1. はじめに</h2>
              <p className="text-slate-600 leading-relaxed">
                InsightBI（以下「当社」）は、お客様の個人情報の保護を重要な責務と認識し、
                個人情報の保護に関する法律（個人情報保護法）を遵守するとともに、
                本プライバシーポリシーに従って適切に取り扱います。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">2. 収集する情報</h2>
              <p className="text-slate-600 mb-3">当社は、以下の情報を収集することがあります。</p>

              <h3 className="text-lg font-semibold text-slate-700 mt-4 mb-2">2.1 お客様から直接提供される情報</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>氏名、メールアドレス、電話番号</li>
                <li>会社名、部署名、役職</li>
                <li>ログイン情報（ユーザーID、パスワード）</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-700 mt-4 mb-2">2.2 サービス利用時に自動的に収集される情報</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>IPアドレス、ブラウザの種類、アクセス日時</li>
                <li>利用ログ、操作履歴</li>
                <li>Cookie情報</li>
              </ul>

              <h3 className="text-lg font-semibold text-slate-700 mt-4 mb-2">2.3 お客様の業務データ</h3>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li>アップロードされた業績データ</li>
                <li>分析結果、レポートデータ</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">3. 情報の利用目的</h2>
              <p className="text-slate-600 mb-3">収集した情報は、以下の目的で利用します。</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>本サービスの提供、運営、維持</li>
                <li>ユーザー認証、アクセス管理</li>
                <li>カスタマーサポートの提供</li>
                <li>サービスの改善、新機能の開発</li>
                <li>利用状況の分析、統計データの作成</li>
                <li>重要なお知らせ、アップデート情報の通知</li>
                <li>不正利用の防止、セキュリティの確保</li>
                <li>法令に基づく対応</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">4. 情報の共有・提供</h2>
              <p className="text-slate-600 mb-3">
                当社は、以下の場合を除き、お客様の個人情報を第三者に提供することはありません。
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>お客様の同意がある場合</li>
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合</li>
                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">5. データセキュリティ</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                当社は、お客様の情報を保護するために、以下のセキュリティ対策を実施しています。
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>SSL/TLS暗号化通信の使用</li>
                <li>データの暗号化保存</li>
                <li>アクセス制御、認証管理</li>
                <li>定期的なセキュリティ監査</li>
                <li>従業員へのセキュリティ教育</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">6. データの保持期間</h2>
              <p className="text-slate-600 leading-relaxed">
                当社は、利用目的の達成に必要な期間、お客様の情報を保持します。
                アカウントが削除された場合、法令で保存が義務付けられている情報を除き、
                合理的な期間内にお客様の情報を削除します。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">7. Cookieの使用</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                当社は、サービスの提供およびユーザー体験の向上のためにCookieを使用しています。
                Cookieは以下の目的で使用されます。
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>ログイン状態の維持</li>
                <li>ユーザー設定の保存</li>
                <li>サービス利用状況の分析</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-3">
                ブラウザの設定により、Cookieの受け入れを拒否することができますが、
                その場合、本サービスの一部機能が利用できなくなる可能性があります。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">8. お客様の権利</h2>
              <p className="text-slate-600 mb-3">お客様は、以下の権利を有しています。</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>保有する個人情報の開示を請求する権利</li>
                <li>個人情報の訂正、追加または削除を請求する権利</li>
                <li>個人情報の利用停止を請求する権利</li>
                <li>個人情報の第三者提供の停止を請求する権利</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-3">
                これらの権利を行使される場合は、下記のお問い合わせ先までご連絡ください。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">9. 未成年者の利用</h2>
              <p className="text-slate-600 leading-relaxed">
                本サービスは、原則として企業向けのサービスです。
                18歳未満の方が本サービスを利用される場合は、保護者の同意を得た上でご利用ください。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">10. プライバシーポリシーの変更</h2>
              <p className="text-slate-600 leading-relaxed">
                当社は、必要に応じて本プライバシーポリシーを変更することがあります。
                重要な変更がある場合は、本サービス上での通知またはメールでお知らせします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">11. お問い合わせ</h2>
              <p className="text-slate-600 leading-relaxed">
                本プライバシーポリシーに関するお問い合わせは、以下までご連絡ください。
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-700 font-medium">InsightBI サポート</p>
                <p className="text-slate-600 text-sm mt-1">Email: support@insightbi.example.com</p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">© 2025 InsightBI. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
