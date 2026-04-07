import { NextRequest, NextResponse } from "next/server";

const STIL_MAPPING: Record<string, string> = {
  Modern:          "flat design, clean sans-serif fonts, generous whitespace, minimal UI elements",
  Klassisch:       "traditional layout, structured grid, professional serif fonts, balanced composition",
  Minimalistisch:  "extreme whitespace, single focal point, one accent color, no decoration",
  Bold:            "high contrast, strong bold typography, clear prominent CTA button, punchy layout",
};

export async function POST(req: NextRequest) {
  const { beschreibung, zweck, stil, farben, logoBase64 } = await req.json();

  if (!beschreibung) {
    return NextResponse.json({ error: "Beschreibung fehlt" }, { status: 400 });
  }

  const stilDesc = STIL_MAPPING[stil as string] ?? STIL_MAPPING["Modern"];

  const prompt = [
    "Create a professional digital display advertisement.",
    "Style requirements:",
    "- Clean, minimal, corporate design",
    "- NO decorative elements, NO gradients, NO busy patterns",
    `- Solid background color: ${farben?.primary ?? "#1e40af"}`,
    "- Simple layout: logo area top, headline center, CTA button bottom",
    "- Professional typography only",
    "- NO cartoon elements, NO illustrations, NO clip art",
    "- Must look like a real production-ready display ad from Google Display Network or premium publisher websites",
    `- Brand colors: ${farben?.primary ?? "#1e40af"} (primary) and ${farben?.accent ?? "#ffffff"} (accent)`,
    `- Style: ${stilDesc}`,
    `- Advertising purpose: ${zweck ?? "Awareness"}`,
    `- Ad subject: ${beschreibung}`,
    logoBase64
      ? [
          "- A brand logo has been provided. The advertisement MUST prominently feature this logo.",
          "- Place the logo in the top-left or top-center of the advertisement.",
          "- Use the logo's colors, style, and visual identity as the PRIMARY design reference.",
          "- The overall color palette of the ad must match the logo's color scheme.",
          "- Brand consistency is critical — every design choice should reinforce the logo's visual identity.",
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  // 1. Generate with DALL-E 3 (text-only prompt — DALL-E 3 does not accept image input)
  const finalPrompt = logoBase64
    ? `${prompt}\n\nCRITICAL: This ad must look like it was created by the same brand as the provided logo. Dominant logo colors must appear throughout the design. The logo itself should appear prominently in the top area of the ad.`
    : prompt;

  const dalleBody: Record<string, unknown> = {
    model: "dall-e-3",
    prompt: finalPrompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  };

  const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(dalleBody),
  });

  if (!dalleRes.ok) {
    const err = await dalleRes.text();
    console.error("[dall-e] error:", err);
    return NextResponse.json({ error: `DALL-E Fehler: ${dalleRes.status}`, detail: err }, { status: 502 });
  }

  const data = await dalleRes.json();
  const imageUrl: string = data.data?.[0]?.url;

  if (!imageUrl) {
    return NextResponse.json({ error: "Kein Bild zurückgegeben" }, { status: 502 });
  }

  // 2. Fetch server-side → Base64 to avoid CORS on canvas.drawImage()
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) {
    return NextResponse.json({ error: `Bild-Abruf fehlgeschlagen: ${imgRes.status}` }, { status: 502 });
  }
  const imgBuffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(imgBuffer).toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  return NextResponse.json({ image_url: dataUrl });
}
