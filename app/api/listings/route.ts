import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/listings - Feed des NFTs
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const sellerId = searchParams.get('seller_id');
  const activeOnly = searchParams.get('active') !== 'false';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('nft_listings')
    .select(`
      *,
      seller:user_profiles!seller_id(id, display_name, owner_address)
    `, { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  if (sellerId) {
    query = query.eq('seller_id', sellerId);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    listings: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}
