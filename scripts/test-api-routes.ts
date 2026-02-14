// Test des API routes en local
// Lance le serveur Next.js puis exécute ce script

const BASE_URL = 'http://localhost:3000';

async function testAPIRoutes() {
  console.log('🧪 Testing API Routes locally...\n');

  // Test 1: GET /api/profiles
  console.log('1️⃣ GET /api/profiles');
  try {
    const res = await fetch(`${BASE_URL}/api/profiles?page=1&limit=10`);
    const data = await res.json();
    console.log('✅ Status:', res.status);
    console.log('   Profiles:', data.profiles?.length || 0);
    console.log('   Pagination:', data.pagination);
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.message, '\n');
  }

  // Test 2: GET /api/profiles/:id
  console.log('2️⃣ GET /api/profiles/:id');
  try {
    const res = await fetch(`${BASE_URL}/api/profiles/0xtest123456789`);
    const data = await res.json();
    console.log('✅ Status:', res.status);
    console.log('   Profile:', data);
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.message, '\n');
  }

  // Test 3: GET /api/listings
  console.log('3️⃣ GET /api/listings');
  try {
    const res = await fetch(`${BASE_URL}/api/listings?page=1&limit=10&active=true`);
    const data = await res.json();
    console.log('✅ Status:', res.status);
    console.log('   Listings:', data.listings?.length || 0);
    console.log('   Pagination:', data.pagination);
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.message, '\n');
  }

  // Test 4: GET /api/listings?seller_id=...
  console.log('4️⃣ GET /api/listings (filtered by seller)');
  try {
    const res = await fetch(`${BASE_URL}/api/listings?seller_id=0xtest123456789`);
    const data = await res.json();
    console.log('✅ Status:', res.status);
    console.log('   Seller listings:', data.listings?.length || 0);
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.message, '\n');
  }

  // Test 5: GET /api/subscriptions
  console.log('5️⃣ GET /api/subscriptions');
  try {
    const res = await fetch(`${BASE_URL}/api/subscriptions?creator_id=0xtest123456789`);
    const data = await res.json();
    console.log('✅ Status:', res.status);
    console.log('   Subscriptions:', data.subscriptions?.length || 0);
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.message, '\n');
  }

  // Test 6: GET /api/profiles (search)
  console.log('6️⃣ GET /api/profiles (search)');
  try {
    const res = await fetch(`${BASE_URL}/api/profiles?search=Test`);
    const data = await res.json();
    console.log('✅ Status:', res.status);
    console.log('   Search results:', data.profiles?.length || 0);
    console.log('');
  } catch (error: any) {
    console.log('❌ Failed:', error.message, '\n');
  }

  console.log('='.repeat(50));
  console.log('✅ API Routes tests completed!');
  console.log('='.repeat(50));
}

// Run tests
testAPIRoutes().catch(console.error);
