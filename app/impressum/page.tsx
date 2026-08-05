import Link from "next/link";

export const metadata = {
  title: "Impressum – ONEmatic",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-slate-600 transition-colors">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="#1e293b" />
              <circle cx="11" cy="11" r="4.5" fill="white" />
              <circle cx="11" cy="11" r="2" fill="#1e293b" />
            </svg>
            ONEmatic
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            ← Zurück zur Startseite
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Impressum</h1>
        <p className="text-sm text-slate-500 mb-10">Angaben gemäß § 5 DDG</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <p>
              OneTitel – Digital &amp; Business Solutions<br />
              Oliver M. Müller<br />
              Am Bruchborn 6<br />
              54570 Kirchweiler<br />
              Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Kontakt</h2>
            <p>
              E-Mail: <a href="mailto:ONEmatic@onetitel.de" className="text-blue-600 hover:underline">ONEmatic@onetitel.de</a><br />
              Website: <span className="text-slate-700">www.onematic.de</span>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Umsatzsteuer</h2>
            <p>
              USt-IdNr. gemäß § 27a UStG: DE326064654<br />
              <span className="text-slate-500 text-xs">Freiwillige Zusatzangabe: Finanzamt Wittlich, Steuernummer 43/222/06195</span>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
            <p>
              Oliver M. Müller<br />
              Am Bruchborn 6, 54570 Kirchweiler, Deutschland
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Haftungshinweis</h2>
            <p>
              Hinweis: ONEmatic ist keine Rechts-, Steuer- oder Finanzberatung. Alle Inhalte dienen der
              allgemeinen Information und ersetzen keine rechtliche oder steuerliche Beratung.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Haftungsausschluss</h2>

            <h3 className="font-medium text-slate-800 mb-1">Haftung für Inhalte</h3>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht
              verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
              zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>
            <p className="mt-2">
              Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
              Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt
              der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
              Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-1">Haftung für Links</h3>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
              haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte
              der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
              Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
            </p>
            <p className="mt-2">
              Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete Anhaltspunkte
              einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen werden wir
              derartige Links umgehend entfernen.
            </p>

            <h3 className="font-medium text-slate-800 mt-4 mb-1">Urheberrecht</h3>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
              deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
              jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten,
              nicht kommerziellen Gebrauch gestattet.
            </p>
            <p className="mt-2">
              Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte
              Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie
              trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden
              Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} ONEmatic · Oliver M. Müller</span>
          <div className="flex gap-4">
            <Link href="/impressum" className="hover:text-slate-600 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-slate-600 transition-colors">Datenschutz</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
