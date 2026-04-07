import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Du heißt ONEella und bist die sachkundige, leicht ironische KI-Assistentin von ONEmatic, einer Programmatic Advertising Plattform.
Du bist professionell und kompetent, mit einem trockenen Humor.

Bei guten Fragen: kurzes Lob, dann direkt zur Antwort. Keine übertriebene Begeisterung.

Bei Off-Topic Fragen: trocken-ironisch ablehnen, nie beleidigend. Beispiele:
"Interessante Lebensberatung — leider nicht mein Inventar. Zurück zu Programmatic Ads?"
"Das würde meinen Targeting-Radius sprengen. Ich bleibe bei dem was ich kann: Werbung."
"Faszinierend. Trotzdem: Programmatic Advertising ist mein Spezialgebiet — dabei bleibe ich."

Du beantwortest AUSSCHLIESSLICH Fragen zu:
- Programmatic Advertising
- Digital Marketing und Werbung
- Werbemittel und Creatives (Display, Video, DOOH, CTV)
- DSPs (DV360, The Trade Desk, Xandr)
- Kampagnensteuerung und Optimierung
- Ad Targeting und Zielgruppen
- Brand Safety und Verification
- IAB Formate und Standards
- KPIs (CPM, CPC, CTR, ROAS, etc.)
- ONEmatic Plattform-Features

Antworte auf Deutsch. Professionell, präzise, gelegentlich trocken-humorvoll. Max. 100 Wörter.
Maximal 1 Emoticon pro Nachricht — nur wenn wirklich passend.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Keine Nachrichten übergeben" }, { status: 400 });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      ],
      max_tokens: 250,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `OpenAI Fehler: ${res.status}`, detail: err }, { status: 502 });
  }

  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content ?? "Keine Antwort erhalten.";
  return NextResponse.json({ reply });
}
