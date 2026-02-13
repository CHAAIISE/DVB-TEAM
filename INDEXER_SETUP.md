# 🚀 Setup Indexer - Guide Complet

## 1️⃣ Créer un compte Supabase (2 minutes)

1. Va sur [supabase.com](https://supabase.com)
2. Clique sur "Start your project"
3. Crée un nouveau projet:
   - Nom: `dvb-team-platform`
   - Database Password: (choisis un mot de passe fort)
   - Region: Choisis la plus proche de toi
4. Attends 2 minutes que la DB soit créée

## 2️⃣ Configure la base de données (3 minutes)

1. Dans ton dashboard Supabase, va dans **SQL Editor**
2. Crée un nouveau query
3. Copie-colle le contenu de `supabase/schema.sql`
4. Clique sur **RUN**
5. Ensuite, copie-colle le contenu de `supabase/functions.sql`
6. Clique sur **RUN** à nouveau

## 3️⃣ Récupère tes clés API (1 minute)

1. Dans Supabase, va dans **Settings** → **API**
2. Copie:
   - `Project URL`
   - `anon public` key

## 4️⃣ Configure les variables d'environnement

1. Copie `.env.local.example` vers `.env.local`:

```bash
cp .env.local.example .env.local
```

2. Remplis les variables:

```env
# Supabase (from step 3)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sui (from your deployment)
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0xabc123...  # Après avoir déployé ton smart contract
NEXT_PUBLIC_REGISTRY_ID=0xdef456... # L'ID du Registry après deploy

# Indexer
INDEXER_SECRET=choisis-un-mot-de-passe-random-ici
```

## 5️⃣ Installe les dépendances

```bash
pnpm add @supabase/supabase-js @mysten/sui.js
```

## 6️⃣ Deploy sur Vercel

### Option A: Via Dashboard Vercel (le plus simple)

1. Va sur [vercel.com](https://vercel.com)
2. Importe ton repo GitHub
3. Dans les settings, ajoute tes **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUI_NETWORK`
   - `NEXT_PUBLIC_PACKAGE_ID`
   - `NEXT_PUBLIC_REGISTRY_ID`
   - `INDEXER_SECRET`
4. Deploy!

### Option B: Via CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

## 7️⃣ Active le Cron Job (indexer automatique)

1. Dans Vercel, va dans **Settings** → **Crons**
2. Vérifie que le cron est actif (déjà configuré dans `vercel.json`)
3. Il va tourner **toutes les minutes** pour indexer les nouveaux events

## 8️⃣ Test manuel de l'indexer

```bash
curl -X POST https://ton-app.vercel.app/api/indexer \
  -H "Authorization: Bearer TON_INDEXER_SECRET"
```

Tu devrais voir:

```json
{
  "success": true,
  "processed": 5,
  "total": 5
}
```

## ✅ C'est fait!

Maintenant, tu peux query tes données:

### Exemples de requêtes

**Feed des NFTs:**

```
GET https://ton-app.vercel.app/api/listings?page=1&limit=20
```

**Profils:**

```
GET https://ton-app.vercel.app/api/profiles?search=Artist&page=1
```

**Abonnements d'un créateur:**

```
GET https://ton-app.vercel.app/api/subscriptions?creator_id=0xabc123
```

## 🔧 Debugging

**Voir les logs de l'indexer:**

- Vercel Dashboard → Functions → `/api/indexer` → Logs

**Voir les données dans Supabase:**

- Dashboard Supabase → Table Editor

**Vérifier l'état de l'indexer:**

```
GET https://ton-app.vercel.app/api/indexer
```

## 💡 Notes importantes

- **Gratuit jusqu'à 500MB** de data Supabase
- **Vercel gratuit** pour Hobby projects
- Le cron tourne **toutes les minutes**
- Si tu changes le smart contract, tu dois **re-indexer** depuis le début
- Pour re-indexer: vide la table `indexer_state` dans Supabase
