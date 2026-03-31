import { NextResponse } from 'next/server';
import { isAnalyticsMetric } from '@/lib/constants/analytics';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

interface AnalyticsTrackPayload {
  metric?: unknown;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => null)) as AnalyticsTrackPayload | null;
    const metric = typeof payload?.metric === 'string' ? payload.metric : '';

    if (!metric || !isAnalyticsMetric(metric)) {
      return NextResponse.json({ error: 'Invalid analytics metric' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new NextResponse(null, { status: 204 });
    }

    const adminClient = createAdminClient();
    const { error } = await adminClient.rpc('increment_metric', {
      metric_name: metric,
    });

    if (error) {
      return NextResponse.json({ error: 'Unable to track analytics event' }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
