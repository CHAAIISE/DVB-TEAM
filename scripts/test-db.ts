import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  console.log('🔍 Testing Supabase connection...\n');

  // Test 1: Connection
  console.log('1️⃣ Testing connection...');
  try {
    const { data, error } = await supabase.from('user_profiles').select('count');
    if (error) throw error;
    console.log('✅ Connection successful!\n');
  } catch (error: any) {
    console.log('❌ Connection failed:', error.message);
    console.log('💡 Make sure you ran the SQL schema in Supabase dashboard\n');
    return;
  }

  // Test 2: Insert test profile
  console.log('2️⃣ Inserting test profile...');
  const testProfile = {
    id: '0xtest123456789',
    owner_address: '0xowner123456789',
    display_name: 'Test Artist',
    bio: 'This is a test artist profile',
    subscription_price: 1000000000, // 1 SUI
  };

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(testProfile)
      .select();
    
    if (error) throw error;
    console.log('✅ Profile inserted:', data);
    console.log('');
  } catch (error: any) {
    console.log('❌ Insert failed:', error.message, '\n');
  }

  // Test 3: Query profiles
  console.log('3️⃣ Querying all profiles...');
  try {
    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' });
    
    if (error) throw error;
    console.log(`✅ Found ${count} profile(s):`);
    console.log(data);
    console.log('');
  } catch (error: any) {
    console.log('❌ Query failed:', error.message, '\n');
  }

  // Test 4: Search profiles
  console.log('4️⃣ Testing search (display_name contains "Test")...');
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .ilike('display_name', '%Test%');
    
    if (error) throw error;
    console.log(`✅ Found ${data.length} matching profile(s):`);
    console.log(data);
    console.log('');
  } catch (error: any) {
    console.log('❌ Search failed:', error.message, '\n');
  }

  // Test 5: Insert test NFT listing
  console.log('5️⃣ Inserting test NFT listing...');
  const testListing = {
    id: '0xlisting123',
    seller_id: '0xtest123456789',
    nft_type: 'Art NFT',
    price: 500000000, // 0.5 SUI
  };

  try {
    const { data, error } = await supabase
      .from('nft_listings')
      .upsert(testListing)
      .select();
    
    if (error) throw error;
    console.log('✅ Listing inserted:', data);
    console.log('');
  } catch (error: any) {
    console.log('❌ Listing insert failed:', error.message, '\n');
  }

  // Test 6: Query listings with seller info (JOIN)
  console.log('6️⃣ Querying listings with seller info (JOIN)...');
  try {
    const { data, error } = await supabase
      .from('nft_listings')
      .select(`
        *,
        seller:user_profiles!seller_id(id, display_name, owner_address)
      `)
      .eq('is_active', true);
    
    if (error) throw error;
    console.log(`✅ Found ${data.length} active listing(s):`);
    console.log(JSON.stringify(data, null, 2));
    console.log('');
  } catch (error: any) {
    console.log('❌ JOIN query failed:', error.message, '\n');
  }

  // Test 7: Insert subscription
  console.log('7️⃣ Inserting test subscription...');
  const testSubscription = {
    subscriber_id: '0xsubscriber456',
    creator_id: '0xtest123456789',
    amount_paid: 1000000000,
    tx_digest: '0xtxhash123',
  };

  // First create subscriber profile
  try {
    await supabase.from('user_profiles').upsert({
      id: '0xsubscriber456',
      owner_address: '0xsubscriber456owner',
      display_name: 'Test Subscriber'
    });

    const { data, error } = await supabase
      .from('subscriptions')
      .insert(testSubscription)
      .select();
    
    if (error) throw error;
    console.log('✅ Subscription inserted:', data);
    console.log('');
  } catch (error: any) {
    console.log('❌ Subscription insert failed:', error.message, '\n');
  }

  // Test 8: Test RPC functions (increment counters)
  console.log('8️⃣ Testing RPC function (increment_subscriber_count)...');
  try {
    const { data, error } = await supabase
      .rpc('increment_subscriber_count', { profile_id: '0xtest123456789' });
    
    if (error) throw error;
    console.log('✅ RPC function executed successfully');
    
    // Verify the count updated
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscriber_count')
      .eq('id', '0xtest123456789')
      .single();
    
    console.log(`   Subscriber count: ${profile?.subscriber_count}`);
    console.log('');
  } catch (error: any) {
    console.log('❌ RPC function failed:', error.message);
    console.log('💡 Make sure you ran functions.sql in Supabase dashboard\n');
  }

  // Test 9: Pagination test
  console.log('9️⃣ Testing pagination (limit 2, page 1)...');
  try {
    const page = 1;
    const limit = 2;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact' })
      .range(from, to)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    console.log(`✅ Pagination works! Showing ${data.length} of ${count} total`);
    console.log(data);
    console.log('');
  } catch (error: any) {
    console.log('❌ Pagination failed:', error.message, '\n');
  }

  // Test 10: Clean up test data (optional)
  console.log('🧹 Cleanup test data? (keeping for now)\n');
  
  console.log('='.repeat(50));
  console.log('✅ Database tests completed!');
  console.log('='.repeat(50));
}

// Run tests
testDatabase().catch(console.error);
