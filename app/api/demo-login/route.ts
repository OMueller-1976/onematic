import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const email = process.env.DEMO_ACCOUNT_EMAIL;
  const password = process.env.DEMO_ACCOUNT_PASSWORD;

  if (!email || !password) {
    console.error("[demo-login] DEMO_ACCOUNT_EMAIL or DEMO_ACCOUNT_PASSWORD not set");
    return NextResponse.redirect(new URL("/login?error=demo_not_configured", req.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard", req.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("[demo-login] signInWithPassword failed:", error.message);
    return NextResponse.redirect(new URL("/login?error=demo_failed", req.url));
  }

  return response;
}
