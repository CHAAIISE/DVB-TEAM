import { NextRequest, NextResponse } from 'next/server';
import { resolveNameToAddress, resolveAddressToName, isSuinsName } from '../../lib/suins';

// GET /api/suins?query=alice.sui   → résout nom → adresse
// GET /api/suins?query=0xabc123... → résout adresse → nom
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'query parameter required' }, { status: 400 });
  }

  try {
    if (isSuinsName(query)) {
      const address = await resolveNameToAddress(query);
      return NextResponse.json({
        input: query,
        type: 'name_to_address',
        address,
        name: query.endsWith('.sui') ? query : `${query}.sui`,
        found: !!address
      });
    } else {
      const name = await resolveAddressToName(query);
      return NextResponse.json({
        input: query,
        type: 'address_to_name',
        address: query,
        name,
        found: !!name
      });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Resolution failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
