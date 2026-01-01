import Link from 'next/link';

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-slate-800 mb-2">利用規約</h1>
          <p className="text-sm text-slate-500 mb-8">最終更新日: 2025年1月1日</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第1条（適用）</h2>
              <p className="text-slate-600 leading-relaxed">
                本利用規約（以下「本規約」）は、InsightBI（以下「本サービス」）の利用条件を定めるものです。
                ユーザーは本規約に同意の上、本サービスを利用するものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第2条（利用登録）</h2>
              <ol className="list-decimal list-inside text-slate-600 space-y-2">
                <li>本サービスの利用を希望する者は、当社の定める方法により利用登録を申請するものとします。</li>
                <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録を拒否することがあります。
                  <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                    <li>虚偽の事項を届け出た場合</li>
                    <li>本規約に違反したことがある者からの申請である場合</li>
                    <li>その他、当社が利用登録を相当でないと判断した場合</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第3条（禁止事項）</h2>
              <p className="text-slate-600 mb-3">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当社のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>他のユーザーに成りすます行為</li>
                <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
                <li>当社、本サービスの他のユーザーまたは第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第4条（本サービスの提供の停止等）</h2>
              <p className="text-slate-600 mb-3">
                当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく
                本サービスの全部または一部の提供を停止または中断することができるものとします。
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-2">
                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第5条（著作権）</h2>
              <p className="text-slate-600 leading-relaxed">
                本サービスに含まれるすべてのコンテンツ（テキスト、画像、ソフトウェア等）の著作権は、
                当社または正当な権利を有する第三者に帰属します。ユーザーは、当社の事前の書面による
                承諾なく、これらのコンテンツを複製、転載、改変、その他の二次利用をすることはできません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第6条（免責事項）</h2>
              <ol className="list-decimal list-inside text-slate-600 space-y-2">
                <li>当社は、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。</li>
                <li>当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。</li>
                <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、
                連絡または紛争等について一切責任を負いません。</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第7条（サービス内容の変更等）</h2>
              <p className="text-slate-600 leading-relaxed">
                当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を
                中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第8条（利用規約の変更）</h2>
              <p className="text-slate-600 leading-relaxed">
                当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することが
                できるものとします。変更後の利用規約は、本サービス上に表示した時点より効力を生じるものとします。
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">第9条（準拠法・裁判管轄）</h2>
              <p className="text-slate-600 leading-relaxed">
                本規約の解釈にあたっては、日本法を準拠法とします。
                本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
              </p>
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
