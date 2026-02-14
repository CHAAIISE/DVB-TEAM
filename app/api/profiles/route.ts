import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

// GET /api/profiles - Liste tous les profils avec pagination
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order(sortBy, { ascending: order === 'asc' });

  // Recherche par nom, bio, adresse ou suins
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,owner_address.ilike.%${search}%,suins_name.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    profiles: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil((count || 0) / limit)
    }
  });
}
