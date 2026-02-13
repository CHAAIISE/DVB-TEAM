import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/subscriptions - Liste des abonnements
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const creatorId = searchParams.get('creator_id');
  const subscriberId = searchParams.get('subscriber_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('subscriptions')
    .select(`
      *,
      creator:user_profiles!creator_id(id, display_name, owner_address),
      subscriber:user_profiles!subscriber_id(id, display_name, owner_address)
    `, { count: 'exact' })
    .range(from, to)
    .order('timestamp', { ascending: false });

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  if (subscriberId) {
    query = query.eq('subscriber_id', subscriberId);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    subscriptions: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}
