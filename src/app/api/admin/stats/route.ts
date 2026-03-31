import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminEmails = getAdminEmails();
    if (adminEmails.length === 0) {
      return NextResponse.json({ error: 'Admin access is not configured' }, { status: 503 });
    }

    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analytics, error } = await adminClient
      .from('app_analytics')
      .select('date, metric, count')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const stats: Record<string, Record<string, number>> = {};
    const totals: Record<string, number> = {};

    analytics?.forEach((row) => {
      if (!stats[row.date]) {
        stats[row.date] = {};
      }

      stats[row.date][row.metric] = row.count;
      totals[row.metric] = (totals[row.metric] || 0) + row.count;
    });

    return NextResponse.json({
      summary: {
        timeframe: 'last_30_days',
        total_events: totals,
      },
      daily_breakdown: stats,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
