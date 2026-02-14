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
    // Récupère le dernier cursor indexé
    const { data: lastState } = await supabase
      .from('indexer_state')
      .select('last_checkpoint')
      .single();

    const lastCursor = lastState?.last_checkpoint || null;

    // Query les nouveaux événements depuis Sui
    // Module name is case-sensitive: DVB_TEAM (uppercase)
    const events = await suiClient.queryEvents({
      query: { 
        MoveEventModule: {
          package: PACKAGE_ID,
          module: 'DVB_TEAM'
        }
      },
      limit: 100,
      order: 'ascending',
      ...(lastCursor ? { cursor: JSON.parse(lastCursor) } : {}),
    });

    let processedCount = 0;

    for (const event of events.data) {
      const eventType = event.type.split('::').pop();
      const data = event.parsedJson as Record<string, unknown>;

      try {
        switch (eventType) {
          case 'ProfileCreated': {
            // Event fields: profile_id (ID), owner (address), subscription_price (u64)
            const profileId = data.profile_id as string;
            const owner = data.owner as string;
            await supabase.from('user_profiles').upsert({
              id: profileId,
              owner_address: owner,
              subscription_price: Number(data.subscription_price || 0),
              created_at: new Date(Number(event.timestampMs)).toISOString()
            });
            break;
          }

          case 'PriceUpdated': {
            // Event fields: profile_id (ID), old_price (u64), new_price (u64)
            await supabase.from('user_profiles').update({
              subscription_price: Number(data.new_price),
              updated_at: new Date(Number(event.timestampMs)).toISOString()
            }).eq('id', data.profile_id as string);
            break;
          }

          case 'SubscriptionCompleted': {
            // Event fields: creator (address), subscriber (address), price_paid (u64)
            // We need profile IDs for the FK, so look them up by address
            const creatorAddr = data.creator as string;
            const subscriberAddr = data.subscriber as string;

            const { data: creatorProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('owner_address', creatorAddr)
              .single();

            const { data: subscriberProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('owner_address', subscriberAddr)
              .single();

            if (creatorProfile && subscriberProfile) {
              await supabase.from('subscriptions').insert({
                subscriber_id: subscriberProfile.id,
                creator_id: creatorProfile.id,
                amount_paid: Number(data.price_paid),
                tx_digest: event.id.txDigest,
                timestamp: new Date(Number(event.timestampMs)).toISOString()
              });

              // Update subscriber/subscription counts
              await supabase.rpc('increment_subscriber_count', { 
                profile_id: creatorProfile.id 
              });
              await supabase.rpc('increment_subscription_count', { 
                profile_id: subscriberProfile.id 
              });
            }
            break;
          }

          case 'NftListed': {
            // Event fields: listing_id (ID), seller (address), price (u64), nft_id (ID)
            const sellerAddr = data.seller as string;
            const { data: sellerProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('owner_address', sellerAddr)
              .single();

            if (sellerProfile) {
              await supabase.from('nft_listings').insert({
                id: data.listing_id as string,
                seller_id: sellerProfile.id,
                nft_type: 'NFT',  // Generic — contract doesn't emit nft_type
                price: Number(data.price),
                created_at: new Date(Number(event.timestampMs)).toISOString()
              });
            }
            break;
          }

          case 'NftPurchased': {
            // Event fields: listing_id (ID), buyer (address), seller (address), price (u64)
            const buyerAddr = data.buyer as string;
            const sellerAddr = data.seller as string;

            const { data: buyerProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('owner_address', buyerAddr)
              .single();

            const { data: sellerProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('owner_address', sellerAddr)
              .single();

            // Mark listing as inactive
            await supabase.from('nft_listings').update({
              is_active: false
            }).eq('id', data.listing_id as string);

            // Record purchase if both profiles exist
            if (buyerProfile && sellerProfile) {
              await supabase.from('nft_purchases').insert({
                listing_id: data.listing_id as string,
                buyer_id: buyerProfile.id,
                seller_id: sellerProfile.id,
                price: Number(data.price),
                tx_digest: event.id.txDigest,
                timestamp: new Date(Number(event.timestampMs)).toISOString()
              });
            }
            break;
          }

          case 'ListingFavorited': {
            // Event fields: listing_id (ID), user (address)
            const userAddr = data.user as string;
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('owner_address', userAddr)
              .single();

            if (userProfile) {
              await supabase.from('favorites').upsert({
                user_id: userProfile.id,
                listing_id: data.listing_id as string,
                created_at: new Date(Number(event.timestampMs)).toISOString()
              });
              await supabase.rpc('increment_favorite_count', {
                listing_id: data.listing_id as string,
              });
            }
            break;
          }

          case 'ListingUnfavorited': {
            // Event fields: listing_id (ID), user (address)
            const userAddr = data.user as string;
            const { data: userProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .eq('owner_address', userAddr)
              .single();

            if (userProfile) {
              await supabase.from('favorites').delete()
                .eq('user_id', userProfile.id)
                .eq('listing_id', data.listing_id as string);
              await supabase.rpc('decrement_favorite_count', {
                listing_id: data.listing_id as string,
              });
            }
            break;
          }
        }

        processedCount++;
      } catch (error) {
        console.error(`Error processing event ${eventType}:`, error);
      }
    }

    // Save cursor for next run
    if (events.data.length > 0 && events.nextCursor) {
      await supabase.from('indexer_state').upsert({
        id: 1,
        last_checkpoint: JSON.stringify(events.nextCursor),
        updated_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      total: events.data.length,
      hasMore: events.hasNextPage,
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
