// ── Shared campaign parsing utilities ────────────────────────────
// Used by both /api/expand-prompt and /api/analyze-prompt routes.

// Timezone-sicheres Datums-Format: vermeidet UTC-Offset-Fehler bei toISOString()
function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type DateResult = {
  campaignStart: string;
  campaignEnd: string;
  laufzeitTage: number;
};

export const MONTHS: Record<string, number> = {
  januar: 1, january: 1,
  februar: 2, february: 2,
  märz: 3, march: 3,
  april: 4,
  mai: 5, may: 5,
  juni: 6, june: 6,
  juli: 7, july: 7,
  august: 8,
  september: 9,
  oktober: 10, october: 10,
  november: 11,
  dezember: 12, december: 12,
};

// ── Budget aus Freitext extrahieren ───────────────────────────────
// Sucht explizit nach €/Euro/EUR oder "Budget:" — nimmt die GRÖSSTE Zahl.
// Verhindert false positives wie Altersangaben ("25-45 Jahren").
export function parseBudgetFromText(text: string): { budgetTotal: number; budgetErkannt: boolean } {
  if (!text) return { budgetTotal: 0, budgetErkannt: false };

  const candidates: number[] = [];

  // Pattern 1: Zahl direkt vor oder nach €/Euro/EUR
  const euroPattern = /(\d[\d.,]*)\s*(?:€|Euro|EUR)/gi;
  let m: RegExpExecArray | null;
  while ((m = euroPattern.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
    if (!isNaN(n) && n > 0) candidates.push(n);
  }

  // Pattern 2: "Budget" keyword gefolgt von Zahl
  const budgetKeyPattern = /[Bb]udget[:\s]+(\d[\d.,]*)/g;
  while ((m = budgetKeyPattern.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
    if (!isNaN(n) && n > 0) candidates.push(n);
  }

  // Pattern 3: Zahl + "k" (Tausend-Kurzform), z.B. "5k", "10k"
  const kPattern = /(\d[\d.,]*)\s*k\b/gi;
  while ((m = kPattern.exec(text)) !== null) {
    const n = parseFloat(m[1].replace(",", ".")) * 1000;
    if (!isNaN(n) && n > 0) candidates.push(n);
  }

  if (candidates.length === 0) return { budgetTotal: 0, budgetErkannt: false };

  // Grössten Wert nehmen (schützt vor Altersangaben wie "25-45")
  const budgetTotal = Math.max(...candidates);
  return { budgetTotal, budgetErkannt: true };
}

// ── Datum/Laufzeit aus Freitext ───────────────────────────────────
export function parseDateFromPrompt(text: string, today: Date): DateResult | null {
  const t = text.toLowerCase();
  const year = today.getFullYear();

  function monthRange(monat: number, targetYear: number): DateResult {
    const firstDay = new Date(targetYear, monat - 1, 1);
    const lastDay = new Date(targetYear, monat, 0);
    const laufzeitTage = Math.max(1, Math.round((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1);
    return {
      campaignStart: dateStr(firstDay),
      campaignEnd: dateStr(lastDay),
      laufzeitTage,
    };
  }

  // "1. Halbjahr" / "2. Halbjahr" / "1H" / "2H" (optional + Jahr)
  const halbjahrMatch = t.match(/(?:([12])[.\s]*halbjahr|([12])h)(?:\s*(20\d{2}))?/i);
  if (halbjahrMatch) {
    const half = parseInt(halbjahrMatch[1] ?? halbjahrMatch[2]);
    const hYear = halbjahrMatch[3] ? parseInt(halbjahrMatch[3]) : year;
    const startMonth = half === 1 ? 1 : 7;
    const endMonth   = half === 1 ? 6 : 12;
    const firstDay = new Date(hYear, startMonth - 1, 1);
    const lastDay  = new Date(hYear, endMonth, 0);
    const laufzeitTage = Math.max(1, Math.round((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1);
    return { campaignStart: dateStr(firstDay), campaignEnd: dateStr(lastDay), laufzeitTage };
  }

  // "Q1"–"Q4" (optional + Jahr)
  const quartalMatch = t.match(/q([1-4])(?:\s*(20\d{2}))?/);
  if (quartalMatch) {
    const q = parseInt(quartalMatch[1]);
    const qYear = quartalMatch[2] ? parseInt(quartalMatch[2]) : year;
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    const firstDay = new Date(qYear, startMonth - 1, 1);
    const lastDay = new Date(qYear, endMonth, 0);
    const laufzeitTage = Math.max(1, Math.round((lastDay.getTime() - firstDay.getTime()) / 86400000) + 1);
    return { campaignStart: dateStr(firstDay), campaignEnd: dateStr(lastDay), laufzeitTage };
  }

  // "[Monat] [Jahr]" oder "im [Monat] [Jahr]" → ganzer Monat
  const monatJahrMatch = t.match(/(?:im\s+)?([a-zäöü]+)\s+(20\d{2})/);
  if (monatJahrMatch) {
    const monat = MONTHS[monatJahrMatch[1]];
    if (monat) {
      return monthRange(monat, parseInt(monatJahrMatch[2]));
    }
  }

  // "im [Monat]" ohne Jahr → nächstes Vorkommen
  const imMonatMatch = t.match(/\bim\s+([a-zäöü]+)\b/);
  if (imMonatMatch) {
    const monat = MONTHS[imMonatMatch[1]];
    if (monat) {
      const targetYear = monat < today.getMonth() + 1 ? year + 1 : year;
      return monthRange(monat, targetYear);
    }
  }

  // "Ende [Monat]" / "bis Ende [Monat]" → start: heute, end: letzter Tag
  const endeMatch = t.match(/(?:bis\s+)?ende\s+([a-zäöü]+)(?:\s+(20\d{2}))?/);
  if (endeMatch) {
    const monat = MONTHS[endeMatch[1]];
    if (monat) {
      const targetYear = endeMatch[2] ? parseInt(endeMatch[2]) : (monat < today.getMonth() + 1 ? year + 1 : year);
      const lastDay = new Date(targetYear, monat, 0);
      const diff = Math.max(1, Math.round((lastDay.getTime() - today.getTime()) / 86400000));
      return {
        campaignStart: dateStr(today),
        campaignEnd: dateStr(lastDay),
        laufzeitTage: diff,
      };
    }
  }

  // "X Monate"
  const monate = t.match(/(\d+)\s*monate?/);
  if (monate) {
    const n = parseInt(monate[1]);
    const end = new Date(today);
    end.setMonth(end.getMonth() + n);
    return {
      campaignStart: dateStr(today),
      campaignEnd: dateStr(end),
      laufzeitTage: n * 30,
    };
  }

  // "X Wochen"
  const wochen = t.match(/(\d+)\s*wochen?/);
  if (wochen) {
    const n = parseInt(wochen[1]);
    const end = new Date(today);
    end.setDate(end.getDate() + n * 7);
    return {
      campaignStart: dateStr(today),
      campaignEnd: dateStr(end),
      laufzeitTage: n * 7,
    };
  }

  // "X Tage"
  const tage = t.match(/(\d+)\s*tagen?/);
  if (tage) {
    const n = parseInt(tage[1]);
    const end = new Date(today);
    end.setDate(end.getDate() + n);
    return {
      campaignStart: dateStr(today),
      campaignEnd: dateStr(end),
      laufzeitTage: n,
    };
  }

  return null;
}

// ── Monatsname für Kampagnen-Labeltext ───────────────────────────
export function monthLabel(dateStr: string): string {
  const MONTH_NAMES = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  const d = new Date(dateStr + "T12:00:00"); // noon to avoid timezone shift
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}
