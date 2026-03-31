import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  
  // Routes where signed-in users should be redirected away (to dashboard)
  const authRoutes = ["/signin", "/signup", "/forgot-password", "/reset-password"];
  // Routes accessible by everyone (signed in or not)
  const publicInfoRoutes = ["/privacy-policy"];
  
  const isAuthRoute = authRoutes.includes(pathname);
  const isPublicInfoRoute = publicInfoRoutes.includes(pathname);
  const isPublicRoute = isAuthRoute || isPublicInfoRoute;

  // If signed in, check onboarding status via fast cookie check
  // This avoids a DB query on every single navigation, fixing the 5s delay.
  const onboardingCookie = request.cookies.get("bf_onboarding_done");
  const onboardingCompleted = !!onboardingCookie;

  // Root redirect logic
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    if (!user) {
      url.pathname = "/signin";
    } else {
      url.pathname = onboardingCompleted ? "/dashboard" : "/onboarding";
    }
    return NextResponse.redirect(url);
  }

  // Redirect signed-in users away from auth pages
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = onboardingCompleted ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(url);
  }

  // Protect all non-public routes (excluding /)
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // Force onboarding if not completed
  if (user && !onboardingCompleted && !isPublicRoute && pathname !== "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // Prevent accessing onboarding if already completed
  if (user && onboardingCompleted && pathname === "/onboarding") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};
