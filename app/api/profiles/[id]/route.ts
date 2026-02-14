import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';

// GET /api/profiles/[id] - Récupère un profil spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json(profile);
}
