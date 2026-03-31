import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = request.headers.get('x-admin-api-key');

    // Security check: Only allow access with the ADMIN_API_KEY
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin API Key' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration missing: SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    // Use Service Role to read the app_analytics table (which is otherwise locked by RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch aggregate stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analytics, error } = await adminClient
      .from('app_analytics')
      .select('date, metric, count')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (error) {
       console.error('Stats fetch error:', error);
       return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reduce analytics into a more readable format
    const stats: Record<string, any> = {};
    const totals: Record<string, number> = {};

    analytics?.forEach(row => {
        if (!stats[row.date]) stats[row.date] = {};
        stats[row.date][row.metric] = row.count;
        totals[row.metric] = (totals[row.metric] || 0) + row.count;
    });

    return NextResponse.json({
        summary: {
            timeframe: 'last_30_days',
            total_events: totals
        },
        daily_breakdown: stats
    });
    
  } catch (err: any) {
    console.error('Admin stats route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
