import Link from "next/link";

export const metadata = {
  title: "Datenschutzerklärung – ONEmatic",
};

export default function DatenschutzPage() {
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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-sm text-slate-500 mb-10">Stand: April 2026</p>

        <div className="space-y-10 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">1. Verantwortlicher</h2>
            <p>
              Verantwortlicher im Sinne der DSGVO für die Verarbeitung personenbezogener Daten auf dieser
              Plattform ist:
            </p>
            <p className="mt-2">
              Oliver M. Müller<br />
              Am Bruchborn 6<br />
              54570 Kirchweiler<br />
              Deutschland<br />
              E-Mail: <a href="mailto:om@onetitel.de" className="text-blue-600 hover:underline">om@onetitel.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">2. Welche Daten wir erheben</h2>
            <p>Bei der Nutzung von ONEmatic werden folgende personenbezogene Daten erhoben und verarbeitet:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>E-Mail-Adresse (für Registrierung und Authentifizierung)</li>
              <li>Name (für die Nutzerprofil-Anzeige)</li>
              <li>Firmenname (optional, für Agentur-/Unternehmensprofile)</li>
              <li>Kampagnen- und Creative-Daten, die Sie im Rahmen der Plattformnutzung eingeben</li>
              <li>Nutzungsdaten (Login-Zeitpunkte, Seitenaufrufe innerhalb der Plattform)</li>
              <li>Zahlungsdaten (werden direkt bei Stripe verarbeitet, nicht bei uns gespeichert)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">3. Zweck der Datenverarbeitung</h2>
            <p>Wir verarbeiten Ihre Daten zu folgenden Zwecken:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Betrieb und Bereitstellung der ONEmatic Plattform</li>
              <li>Nutzerauthentifizierung und Kontoverwaltung</li>
              <li>Verarbeitung und Verwaltung Ihrer Kampagnendaten</li>
              <li>KI-gestützte Analyse und Optimierung von Mediaplänen</li>
              <li>Abrechnung und Zahlungsabwicklung</li>
              <li>Kommunikation bei Support-Anfragen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">4. Rechtsgrundlage</h2>
            <p>Die Verarbeitung Ihrer Daten erfolgt auf Basis folgender Rechtsgrundlagen gemäß Art. 6 DSGVO:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> – Verarbeitung zur Erfüllung des Vertrages (Nutzung der Plattform)</li>
              <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> – Einwilligung (z. B. für optionale KI-Analysen)</li>
              <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> – Berechtigte Interessen (Sicherheit, Missbrauchsprävention)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">5. Drittanbieter und Auftragsverarbeiter</h2>
            <p>Für den Betrieb der Plattform setzen wir folgende Drittanbieter ein, mit denen Auftragsverarbeitungsverträge gemäß Art. 28 DSGVO geschlossen wurden oder werden:</p>

            <div className="mt-3 space-y-4">
              <div>
                <h3 className="font-medium text-slate-800">Supabase (Datenspeicherung &amp; Authentifizierung)</h3>
                <p className="mt-1">Supabase Inc., San Francisco, USA. Alle Nutzerdaten, Kampagnendaten und Konfigurationen werden in der Supabase-Datenbank gespeichert. Supabase setzt auf PostgreSQL und bietet EU-Hosting-Optionen. Weitere Informationen: <span className="text-blue-600">supabase.com/privacy</span></p>
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Stripe (Zahlungsabwicklung)</h3>
                <p className="mt-1">Stripe, Inc., San Francisco, USA / Stripe Payments Europe, Limited, Dublin, Irland. Zahlungsdaten werden ausschließlich über Stripe verarbeitet. ONEmatic speichert keine vollständigen Kartendaten. Weitere Informationen: <span className="text-blue-600">stripe.com/privacy</span></p>
              </div>
              <div>
                <h3 className="font-medium text-slate-800">OpenAI (KI-Verarbeitung)</h3>
                <p className="mt-1">OpenAI, LLC, San Francisco, USA. Für KI-gestützte Funktionen (Prompt-Analyse, Creative-Generierung, Support-Chat) werden Eingabedaten an die OpenAI API übermittelt. Es werden keine personenbezogenen Daten ohne Notwendigkeit an OpenAI weitergegeben. Weitere Informationen: <span className="text-blue-600">openai.com/policies/privacy-policy</span></p>
              </div>
              <div>
                <h3 className="font-medium text-slate-800">n8n (Workflow-Automatisierung)</h3>
                <p className="mt-1">n8n GmbH, Berlin, Deutschland. Für die Automatisierung von Kampagnen-Workflows werden Kampagnendaten an n8n-Instanzen übermittelt. Die Verarbeitung erfolgt auf Basis eines Auftragsverarbeitungsvertrags.</p>
              </div>
              <div>
                <h3 className="font-medium text-slate-800">Vercel (Hosting)</h3>
                <p className="mt-1">Vercel Inc., San Francisco, USA. Die ONEmatic Plattform wird auf der Vercel-Infrastruktur gehostet. Vercel verarbeitet dabei technische Verbindungsdaten (IP-Adresse, Zeitstempel). Weitere Informationen: <span className="text-blue-600">vercel.com/legal/privacy-policy</span></p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">6. Cookies und Session-Daten</h2>
            <p>
              ONEmatic verwendet technisch notwendige Cookies für die Authentifizierung. Beim Login wird ein
              Supabase Auth Session Cookie gesetzt, das für die Aufrechterhaltung der Anmeldung erforderlich ist.
              Dieses Cookie ist sitzungsbasiert und wird nach dem Logout oder nach Ablauf der Session gelöscht.
            </p>
            <p className="mt-2">
              Wir verwenden keine Tracking-Cookies, keine Werbe-Cookies und kein Cross-Site-Tracking.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">7. Datenspeicherung und Löschfristen</h2>
            <p>
              Personenbezogene Daten werden nur so lange gespeichert, wie es für die Erfüllung der oben
              genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
            </p>
            <p className="mt-2">
              Nach Kündigung Ihres Accounts werden Ihre personenbezogenen Daten innerhalb von 30 Tagen
              gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen (z. B. steuerrechtliche
              Pflichten nach § 147 AO für bis zu 10 Jahre).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">8. Ihre Rechte als betroffene Person</h2>
            <p>Sie haben gemäß DSGVO folgende Rechte:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO): Sie können Auskunft über die zu Ihrer Person gespeicherten Daten verlangen.</li>
              <li><strong>Berichtigungsrecht</strong> (Art. 16 DSGVO): Sie können die Berichtigung unrichtiger Daten verlangen.</li>
              <li><strong>Recht auf Löschung</strong> (Art. 17 DSGVO): Sie können die Löschung Ihrer Daten verlangen ("Recht auf Vergessenwerden").</li>
              <li><strong>Recht auf Einschränkung</strong> (Art. 18 DSGVO): Sie können die Einschränkung der Verarbeitung verlangen.</li>
              <li><strong>Recht auf Datenübertragbarkeit</strong> (Art. 20 DSGVO): Sie können Ihre Daten in einem gängigen Format erhalten.</li>
              <li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO): Sie können der Verarbeitung Ihrer Daten widersprechen.</li>
              <li><strong>Beschwerderecht</strong>: Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</li>
            </ul>
            <p className="mt-3">
              Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{" "}
              <a href="mailto:om@onetitel.de" className="text-blue-600 hover:underline">om@onetitel.de</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">9. Datensicherheit</h2>
            <p>
              Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten gegen zufällige oder
              vorsätzliche Manipulation, Verlust, Zerstörung oder den Zugriff unberechtigter Personen zu
              schützen. Alle Datenübertragungen zwischen Ihrem Browser und unseren Servern erfolgen
              verschlüsselt (TLS/HTTPS).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">10. Kontakt Datenschutz</h2>
            <p>
              Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte wenden Sie sich bitte an:
            </p>
            <p className="mt-2">
              Oliver M. Müller<br />
              E-Mail: <a href="mailto:om@onetitel.de" className="text-blue-600 hover:underline">om@onetitel.de</a>
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
