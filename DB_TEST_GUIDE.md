# 🧪 Guide de Test de la Base de Données

## Prérequis

✅ Tu as créé un projet Supabase  
✅ Tu as exécuté `supabase/schema.sql` dans le SQL Editor  
✅ Tu as exécuté `supabase/functions.sql` dans le SQL Editor  
✅ Tu as rempli `.env.local` avec tes clés Supabase

## Test 1: Vérifier la DB directement dans Supabase

1. Va sur [ton dashboard Supabase](https://supabase.com/dashboard)
2. Sélectionne ton projet `dvb-team-platform`
3. Va dans **Table Editor**
4. Tu devrais voir ces tables:
   - ✅ `user_profiles`
   - ✅ `subscriptions`
   - ✅ `nft_listings`
   - ✅ `nft_purchases`
   - ✅ `favorites`
   - ✅ `indexer_state`

**Si les tables ne sont pas là** → Va dans SQL Editor et exécute
`supabase/schema.sql`

## Test 2: Script de test automatique

```bash
# Installe ts-node si pas déjà fait
pnpm add -D ts-node

# Lance le test
pnpm tsx scripts/test-db.ts
```

**Ce script va:**

- ✅ Tester la connexion Supabase
- ✅ Insérer un profil de test
- ✅ Query les profils
- ✅ Tester la recherche
- ✅ Insérer un NFT listing
- ✅ Tester les JOINs (profil + listings)
- ✅ Tester les subscriptions
- ✅ Tester les fonctions RPC (increment counters)
- ✅ Tester la pagination

**Output attendu:**

```
🔍 Testing Supabase connection...

1️⃣ Testing connection...
✅ Connection successful!

2️⃣ Inserting test profile...
✅ Profile inserted: [...]

3️⃣ Querying all profiles...
✅ Found 1 profile(s): [...]

...
```

## Test 3: Test des API Routes (Next.js)

### Étape 1: Lance le serveur Next.js

```bash
pnpm dev
```

### Étape 2: Dans un autre terminal, teste les routes

```bash
pnpm tsx scripts/test-api-routes.ts
```

**Ou manuellement avec curl:**

```bash
# Liste des profils
curl "http://localhost:3000/api/profiles?page=1&limit=10"

# Profil spécifique
curl "http://localhost:3000/api/profiles/0xtest123456789"

# Feed NFTs
curl "http://localhost:3000/api/listings?page=1&limit=20"

# NFTs d'un seller
curl "http://localhost:3000/api/listings?seller_id=0xtest123456789"

# Subscriptions d'un créateur
curl "http://localhost:3000/api/subscriptions?creator_id=0xtest123456789"

# Recherche profils
curl "http://localhost:3000/api/profiles?search=Artist"
```

## Test 4: Query SQL directement dans Supabase

Va dans **SQL Editor** de Supabase et teste ces queries:

### Query 1: Compter les profils

```sql
SELECT COUNT(*) FROM user_profiles;
```

### Query 2: Profils avec le plus de subscribers

```sql
SELECT display_name, subscriber_count
FROM user_profiles
ORDER BY subscriber_count DESC
LIMIT 10;
```

### Query 3: Listings actifs avec infos du seller

```sql
SELECT
  l.id,
  l.price,
  l.nft_type,
  p.display_name as seller_name
FROM nft_listings l
JOIN user_profiles p ON l.seller_id = p.id
WHERE l.is_active = true
ORDER BY l.created_at DESC;
```

### Query 4: Top créateurs par revenus

```sql
SELECT
  p.display_name,
  COUNT(s.id) as total_subscriptions,
  SUM(s.amount_paid) as total_revenue
FROM user_profiles p
LEFT JOIN subscriptions s ON p.id = s.creator_id
GROUP BY p.id, p.display_name
ORDER BY total_revenue DESC
LIMIT 10;
```

## Test 5: Insérer des données manuellement

**Via SQL Editor:**

```sql
-- Profil
INSERT INTO user_profiles (id, owner_address, display_name, bio, subscription_price)
VALUES (
  '0xartist1',
  '0xowner1',
  'Amazing Artist',
  'Digital art creator',
  2000000000
);

-- NFT Listing
INSERT INTO nft_listings (id, seller_id, nft_type, price)
VALUES (
  '0xlisting1',
  '0xartist1',
  'Sunset #001',
  5000000000
);

-- Favorite
INSERT INTO favorites (user_id, listing_id)
VALUES ('0xuser123', '0xlisting1');

-- Incrémente le compteur de favoris
SELECT increment_favorite_count('0xlisting1');
```

## Debugging

### Problème: "Cannot find module '@/app/lib/supabase'"

**Solution:** Les imports sont maintenant en relatif:

```typescript
import { supabase } from "../../lib/supabase";
```

### Problème: "RPC function not found"

**Solution:** Exécute `supabase/functions.sql` dans le SQL Editor

### Problème: "Foreign key violation"

**Solution:** Crée d'abord le profil avant d'insérer des listings/subscriptions

### Problème: Connection timeout

**Solution:** Vérifie que ton IP est autorisée dans Supabase → Settings →
Database → Connection pooling

## Vérifier que tout fonctionne

✅ Script `test-db.ts` passe tous les tests  
✅ Les API routes retournent des données  
✅ Les queries SQL fonctionnent dans Supabase  
✅ Les fonctions RPC (increment\_\*) marchent  
✅ Les JOINs entre tables fonctionnent

**Si tout est vert → Ta DB est prête pour l'indexer et le frontend!** 🎉
