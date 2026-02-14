import { NextRequest, NextResponse } from 'next/server';
import { SuiClient } from '@mysten/sui/client';
import { supabase } from '../../lib/supabase';

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!;
const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
const INDEXER_SECRET = process.env.INDEXER_SECRET;

// Client Sui
const suiClient = new SuiClient({
  url: SUI_NETWORK === 'mainnet' 
    ? 'https://fullnode.mainnet.sui.io:443'
    : 'https://fullnode.testnet.sui.io:443'
});

export async function POST(req: NextRequest) {
  // Protection: vérifie le secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${INDEXER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Récupère le dernier événement indexé
    const { data: lastEvent } = await supabase
      .from('indexer_state')
      .select('last_checkpoint')
      .single();

    const lastCheckpoint = lastEvent?.last_checkpoint || 0;

    // Query les nouveaux événements depuis Sui
    const events = await suiClient.queryEvents({
      query: { 
        MoveEventModule: {
          package: PACKAGE_ID,
          module: 'dvb_team'
        }
      },
      limit: 100,
      order: 'ascending'
    });

    let processedCount = 0;

    for (const event of events.data) {
      const eventType = event.type.split('::').pop();
      const data = event.parsedJson as any;

      try {
        switch (eventType) {
          case 'ProfileCreated':
            await supabase.from('user_profiles').upsert({
              id: data.profile_id,
              owner_address: data.owner,
              created_at: new Date(Number(event.timestampMs)).toISOString()
            });
            break;

          case 'ProfileUpdated':
            await supabase.from('user_profiles').update({
              display_name: data.display_name,
              bio: data.bio,
              updated_at: new Date(Number(event.timestampMs)).toISOString()
            }).eq('id', data.profile_id);
            break;

          case 'PriceUpdated':
            await supabase.from('user_profiles').update({
              subscription_price: data.new_price,
              updated_at: new Date(Number(event.timestampMs)).toISOString()
            }).eq('id', data.profile_id);
            break;

          case 'SubscriptionCompleted':
            // Insère l'abonnement
            await supabase.from('subscriptions').insert({
              subscriber_id: data.subscriber_id,
              creator_id: data.creator_id,
              amount_paid: data.amount,
              tx_digest: event.id.txDigest,
              timestamp: new Date(Number(event.timestampMs)).toISOString()
            });

            // Met à jour les compteurs
            await supabase.rpc('increment_subscriber_count', { 
              profile_id: data.creator_id 
            });
            await supabase.rpc('increment_subscription_count', { 
              profile_id: data.subscriber_id 
            });
            break;

          case 'NftListed':
            await supabase.from('nft_listings').insert({
              id: data.listing_id,
              seller_id: data.seller_id,
              nft_type: data.nft_type,
              price: data.price,
              created_at: new Date(Number(event.timestampMs)).toISOString()
            });
            break;

          case 'NftPurchased':
            // Marque le listing comme inactif
            await supabase.from('nft_listings').update({
              is_active: false
            }).eq('id', data.listing_id);

            // Enregistre l'achat
            await supabase.from('nft_purchases').insert({
              listing_id: data.listing_id,
              buyer_id: data.buyer_id,
              seller_id: data.seller_id,
              price: data.price,
              tx_digest: event.id.txDigest,
              timestamp: new Date(Number(event.timestampMs)).toISOString()
            });
            break;

          case 'ListingFavorited':
            await supabase.from('favorites').upsert({
              user_id: data.user_id,
              listing_id: data.listing_id,
              created_at: new Date(Number(event.timestampMs)).toISOString()
            });

            await supabase.rpc('increment_favorite_count', {
              listing_id: data.listing_id
            });
            break;

          case 'ListingUnfavorited':
            await supabase.from('favorites').delete()
              .eq('user_id', data.user_id)
              .eq('listing_id', data.listing_id);

            await supabase.rpc('decrement_favorite_count', {
              listing_id: data.listing_id
            });
            break;
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing event ${eventType}:`, error);
      }
    }

    // Sauvegarde le dernier checkpoint
    if (events.data.length > 0) {
      const lastEventCheckpoint = events.nextCursor || lastCheckpoint;
      await supabase.from('indexer_state').upsert({
        id: 1,
        last_checkpoint: lastEventCheckpoint
      });
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      total: events.data.length 
    });

  } catch (error) {
    console.error('Indexer error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET pour vérifier le statut
export async function GET() {
  const { data, error } = await supabase
    .from('indexer_state')
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ status: 'not initialized' });
  }

  return NextResponse.json({ 
    status: 'running',
    last_checkpoint: data.last_checkpoint 
  });
}
