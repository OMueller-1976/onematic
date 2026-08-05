@AGENTS.md

# ONEmatic – Projekt-Kontext für Claude Code

## Deployment
- Vercel Team-ID: `team_YvZ1Og0afdZYhKr9e1RPINzs`
- Vercel Projekt-ID: `prj_elnFAfX8yJ6oqPUYhPru23Oxq2xN`
- Produktions-Domain: `app.onematic.de`
- Deploy: `vercel --prod` (setzt `.vercel/project.json` voraus — falls fehlend, manuell anlegen mit orgId + projectId oben)
- Vercel CLI-Version: mind. 58.x empfohlen (v51 hat Bug bei `vercel env add … preview`)

## Backend
- Supabase Projekt-ID: `ghdostmnvfvpzpugyjuk`
- Supabase URL: `https://ghdostmnvfvpzpugyjuk.supabase.co`
- Wichtige Tabellen: `campaigns`, `creatives`, `rules`, `prompt_sessions`, `recommendations`, `agentic_logs`, `reporting`, `team_invites`, `contact_requests`, `billing`, `profiles`, `user_roles`
- **Trigger auf auth.users:**
  - `on_auth_user_created` → `handle_new_user` → legt automatisch `profiles`-Zeile an
  - `on_auth_user_billing` → `handle_new_billing` → legt automatisch `billing`-Zeile an
  - **WICHTIG:** Beim Anlegen neuer User NICHT manuell in `profiles`/`billing` inserten — nur per UPDATE auf die automatisch erzeugte Zeile, sonst Unique-Constraint-Fehler.
- Schema-Änderungen über `supabase/migrations/` versionieren, nicht nur live per SQL-Editor ausführen.

## Supabase-Client-Muster
- Browser-Client: `app/lib/supabase.ts` → `createBrowserClient` aus `@supabase/ssr`
- Server-Client (Route Handler / Middleware): `createServerClient` aus `@supabase/ssr` mit Cookie-Adapter — Vorbild ist `proxy.ts` und `app/api/demo-login/route.ts`
- Service-Role-Client (Admin-Operationen): `createClient` aus `@supabase/supabase-js` mit `SUPABASE_SERVICE_ROLE_KEY` — Vorbild ist `app/api/contact/route.ts`

## Auth / Routing
- Middleware-Datei: `proxy.ts` (Next.js 16 — nicht `middleware.ts`)
- Öffentliche Routen: `/`, `/login`, `/register`, `/demo`, `/kontakt`, `/impressum`, `/datenschutz`, `/ueber-onematic`
- Eingeloggte User auf `/login` oder `/register` → Redirect zu `/dashboard`
- Nicht eingeloggte User auf allen anderen Routen → Redirect zu `/login`

## Konventionen
- Imports: `./lib/...` oder relative Pfade — **kein** `@/` Alias (nicht in tsconfig konfiguriert)
- Next.js App Router, Tailwind CSS 4 (kein `tailwind.config.ts` — Config inline in `globals.css`)
- `"use client"` nur wo wirklich Interaktivität nötig (useState, useEffect, Event-Handler)
- Formular-Submissions: über `/api/…` Route Handler (nicht direkt supabase im Client für schreibende Ops auf sensiblen Tabellen)

## Bekannte Env-Var-Falle
- In `.env.local` steht `STIPE_WEBHOOK_SECRET` (Tippfehler — fehlendes R). Der Code in `app/api/stripe/webhook/route.ts` liest aber `STRIPE_WEBHOOK_SECRET`. Beim nächsten Vercel-Env-Sync korrigieren.

## Bekannte offene Baustellen
- `app/page.tsx` ist eine 850-Zeilen-Datei — noch nicht in `app/components/` aufgesplittet
- Hydration-Warnings in `app/components/AIInsights.tsx`
- Stripe-Subscription-Modus (recurring) noch nicht implementiert
- n8n Agentic-Cycle-Workflow (alle 6h) noch nicht konfiguriert
