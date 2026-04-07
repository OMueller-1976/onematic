import { NextResponse } from "next/server";

const FEEDS = [
  "https://www.adzine.de/feed/",
  "https://rss.t-online.de/werbung-marketing",
  "https://www.horizont.net/feed/",
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/rss+xml, application/xml, text/xml, */*",
};

async function fetchFeed(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal, headers: HEADERS });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function parseXml(xml: string): { title: string; link: string; pubDate: string }[] {
  const items: { title: string; link: string; pubDate: string }[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
    const block = match[1];

    const title =
      (/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i.exec(block) ??
       /<title>([^<]+)<\/title>/i.exec(block))?.[1]?.trim() ?? "";

    const link =
      (/<link>(https?:\/\/[^<\s]+)<\/link>/i.exec(block) ??
       /<link\s+href="([^"]+)"/i.exec(block))?.[1]?.trim() ?? "";

    const pubDate =
      (/<pubDate>([^<]+)<\/pubDate>/i.exec(block))?.[1]?.trim() ?? "";

    if (title) items.push({ title, link, pubDate });
  }

  return items;
}

export async function GET() {
  for (const url of FEEDS) {
    const xml = await fetchFeed(url);
    if (!xml) continue;

    const items = parseXml(xml);
    if (items.length > 0) {
      return NextResponse.json(items);
    }
  }

  return NextResponse.json([]);
}
