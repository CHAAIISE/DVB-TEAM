# 🏷️ Roadmap SUINS — Recherche par adresse OU par nom SUINS

## Contexte

**SUINS** (Sui Name Service) permet d'associer un nom lisible (ex: `alice.sui`)
à une adresse wallet Sui.  
L'objectif est de permettre aux utilisateurs de chercher un profil **soit par
adresse wallet, soit par nom SUINS** via l'indexer et la SearchBar.

---

## 📋 Vue d'ensemble des étapes

| #   | Étape                                            | Fichiers touchés                      | Priorité |
| --- | ------------------------------------------------ | ------------------------------------- | -------- |
| 1   | Installer le SDK SUINS                           | `package.json`                        | 🔴       |
| 2   | Créer un utilitaire de résolution SUINS          | `app/lib/suins.ts` (nouveau)          | 🔴       |
| 3   | Ajouter la colonne `suins_name` en DB            | `supabase/schema.sql`                 | 🔴       |
| 4   | Créer une route API `/api/suins`                 | `app/api/suins/route.ts` (nouveau)    | 🔴       |
| 5   | Mettre à jour l'indexer pour récupérer les SUINS | `app/api/indexer/route.ts`            | 🟡       |
| 6   | Mettre à jour la route API profiles              | `app/api/profiles/route.ts`           | 🔴       |
| 7   | Mettre à jour la SearchBar                       | `app/components/search/SearchBar.tsx` | 🔴       |
| 8   | Afficher le SUINS sur les profils                | `app/(marketplace)/profile/`          | 🟡       |
| 9   | Mettre à jour les types                          | `app/types/user.ts`                   | 🟢       |

---

## Étape 1 — Installer le SDK SUINS

```bash
pnpm add @mysten/suins
```

Le package `@mysten/suins` fournit les fonctions de résolution nom → adresse et
adresse → nom.

---

## Étape 2 — Créer `app/lib/suins.ts`

Utilitaire centralisé pour la résolution SUINS.

```typescript
// app/lib/suins.ts
import { SuiClient } from "@mysten/sui/client";
import { SuinsClient } from "@mysten/suins";

const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || "testnet";

const suiClient = new SuiClient({
  url:
    SUI_NETWORK === "mainnet"
      ? "https://fullnode.mainnet.sui.io:443"
      : "https://fullnode.testnet.sui.io:443",
});

const suinsClient = new SuinsClient({
  client: suiClient,
  network: SUI_NETWORK === "mainnet" ? "mainnet" : "testnet",
});

/**
 * Résout un nom SUINS (ex: "alice.sui") → adresse wallet
 * Retourne null si le nom n'existe pas
 */
export async function resolveNameToAddress(
  name: string,
): Promise<string | null> {
  try {
    // Normaliser : ajouter .sui si absent
    const normalizedName = name.endsWith(".sui") ? name : `${name}.sui`;
    const nameRecord = await suinsClient.getNameRecord(normalizedName);
    return nameRecord?.targetAddress ?? null;
  } catch (error) {
    console.error(`SUINS resolution failed for ${name}:`, error);
    return null;
  }
}

/**
 * Résout une adresse wallet → nom SUINS (reverse lookup)
 * Retourne null si aucun nom SUINS n'est associé
 */
export async function resolveAddressToName(
  address: string,
): Promise<string | null> {
  try {
    const name = await suinsClient.getDefaultName(address);
    return name ?? null;
  } catch (error) {
    console.error(`SUINS reverse lookup failed for ${address}:`, error);
    return null;
  }
}

/**
 * Détecte si un input est un nom SUINS (contient ".sui" ou pas de "0x")
 */
export function isSuinsName(input: string): boolean {
  return (
    input.endsWith(".sui") ||
    (!input.startsWith("0x") && /^[a-zA-Z0-9-]+$/.test(input))
  );
}
```

---

## Étape 3 — Ajouter la colonne `suins_name` en DB

Exécuter ce SQL dans le **SQL Editor de Supabase** :

```sql
-- Ajouter la colonne suins_name aux profils
ALTER TABLE user_profiles ADD COLUMN suins_name TEXT;

-- Index pour recherche rapide par suins_name
CREATE INDEX idx_user_profiles_suins ON user_profiles(suins_name);

-- Mettre à jour l'index de recherche existant (optionnel, pour full-text search)
CREATE INDEX idx_user_profiles_search ON user_profiles
  USING gin(to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(suins_name, '') || ' ' || coalesce(owner_address, '')));
```

> ⚠️ Tu as déjà Supabase configuré, donc il suffit d'exécuter cet ALTER TABLE.

---

## Étape 4 — Créer la route API `/api/suins`

Endpoint dédié pour la résolution SUINS côté serveur (évite d'exposer les appels
RPC au client).

```typescript
// app/api/suins/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  resolveNameToAddress,
  resolveAddressToName,
  isSuinsName,
} from "../../lib/suins";

// GET /api/suins?query=alice.sui
// GET /api/suins?query=0xabc123...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "query parameter required" },
      { status: 400 },
    );
  }

  try {
    if (isSuinsName(query)) {
      // Résout nom → adresse
      const address = await resolveNameToAddress(query);
      return NextResponse.json({
        input: query,
        type: "name_to_address",
        address,
        name: query.endsWith(".sui") ? query : `${query}.sui`,
        found: !!address,
      });
    } else {
      // Résout adresse → nom
      const name = await resolveAddressToName(query);
      return NextResponse.json({
        input: query,
        type: "address_to_name",
        address: query,
        name,
        found: !!name,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "Resolution failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
```

---

## Étape 5 — Mettre à jour l'indexer

Quand un `ProfileCreated` ou `ProfileUpdated` est détecté, on va aussi chercher
le SUINS associé à l'adresse.

**Modifications dans `app/api/indexer/route.ts` :**

```typescript
// Ajouter l'import
import { resolveAddressToName } from '../../lib/suins';

// Dans le case 'ProfileCreated':
case 'ProfileCreated': {
  // Tente de résoudre le SUINS name
  const suinsName = await resolveAddressToName(data.owner);

  await supabase.from('user_profiles').upsert({
    id: data.profile_id,
    owner_address: data.owner,
    suins_name: suinsName,  // ← NOUVEAU
    created_at: new Date(Number(event.timestampMs)).toISOString()
  });
  break;
}

// Dans le case 'ProfileUpdated':
case 'ProfileUpdated': {
  // Refresh le SUINS au cas où il a changé
  const suinsName = await resolveAddressToName(data.owner);

  await supabase.from('user_profiles').update({
    display_name: data.display_name,
    bio: data.bio,
    suins_name: suinsName,  // ← NOUVEAU
    updated_at: new Date(Number(event.timestampMs)).toISOString()
  }).eq('id', data.profile_id);
  break;
}
```

---

## Étape 6 — Mettre à jour la route API profiles

La recherche doit maintenant aussi chercher par `suins_name` et par
`owner_address`.

**Modifications dans `app/api/profiles/route.ts` :**

```typescript
// Avant (ligne ~24):
if (search) {
  query = query.or(`display_name.ilike.%${search}%,bio.ilike.%${search}%`);
}

// Après:
if (search) {
  // Recherche par display_name, bio, suins_name, OU owner_address
  query = query.or(
    `display_name.ilike.%${search}%,bio.ilike.%${search}%,suins_name.ilike.%${search}%,owner_address.ilike.%${search}%`,
  );
}
```

**Optionnel — Ajouter un endpoint de résolution directe :**

```typescript
// On peut aussi ajouter un param ?resolve_suins=alice.sui
const resolveSuins = searchParams.get("resolve_suins");
if (resolveSuins) {
  // Import resolveNameToAddress
  const { resolveNameToAddress } = await import("../../lib/suins");
  const address = await resolveNameToAddress(resolveSuins);
  if (address) {
    query = query.eq("owner_address", address);
  } else {
    return NextResponse.json({
      profiles: [],
      pagination: { page: 1, limit, total: 0, totalPages: 0 },
    });
  }
}
```

---

## Étape 7 — Mettre à jour la SearchBar

La SearchBar doit détecter si l'input est un nom SUINS et le résoudre via l'API.

**Modifications dans `app/components/search/SearchBar.tsx` :**

```tsx
// Remplacer le useEffect de recherche par :
useEffect(() => {
  const searchUsers = async () => {
    if (!query.trim()) {
      setShowResults(false);
      setResults([]);
      setIsFullSearch(false);
      setDisplayCount(5);
      return;
    }

    const isSuins =
      query.endsWith(".sui") ||
      (!query.startsWith("0x") &&
        /^[a-zA-Z0-9-]+$/.test(query) &&
        query.length > 2);

    if (isSuins) {
      // Résolution SUINS via API
      try {
        const res = await fetch(
          `/api/suins?query=${encodeURIComponent(query)}`,
        );
        const data = await res.json();

        if (data.found && data.address) {
          // Recherche le profil avec cette adresse
          const profileRes = await fetch(
            `/api/profiles?search=${encodeURIComponent(data.address)}`,
          );
          const profileData = await profileRes.json();

          setResults(
            profileData.profiles?.map((p: any) => ({
              walletAddress: p.owner_address,
              username: p.display_name || p.suins_name || p.owner_address,
              avatar: p.avatar_url,
              suinsName: p.suins_name,
            })) || [],
          );
        } else {
          setResults([]);
        }
      } catch {
        // Fallback: recherche classique
        const profileRes = await fetch(
          `/api/profiles?search=${encodeURIComponent(query)}`,
        );
        const profileData = await profileRes.json();
        setResults(profileData.profiles || []);
      }
    } else {
      // Recherche classique (address ou display_name)
      try {
        const res = await fetch(
          `/api/profiles?search=${encodeURIComponent(query)}`,
        );
        const data = await res.json();
        setResults(
          data.profiles?.map((p: any) => ({
            walletAddress: p.owner_address,
            username: p.display_name || p.suins_name || p.owner_address,
            avatar: p.avatar_url,
            suinsName: p.suins_name,
          })) || [],
        );
      } catch {
        setResults([]);
      }
    }

    setShowResults(true);
    if (!isFullSearch) setDisplayCount(5);
  };

  // Debounce de 300ms pour éviter trop d'appels
  const timer = setTimeout(searchUsers, 300);
  return () => clearTimeout(timer);
}, [query, isFullSearch]);
```

**Affichage du SUINS dans les résultats :**

```tsx
{
  /* Dans le rendu de chaque résultat */
}
<div className="flex-1 min-w-0">
  <p className="font-medium text-sm truncate">{user.username}</p>
  {user.suinsName && (
    <p className="text-xs text-blue-500 truncate">🏷️ {user.suinsName}</p>
  )}
  <p className="text-xs text-gray-500 truncate font-mono">
    {user.walletAddress}
  </p>
</div>;
```

---

## Étape 8 — Afficher le SUINS sur les profils

Sur la page profil, afficher le nom SUINS à côté de l'adresse wallet.

**Dans les pages profil** (`app/(marketplace)/profile/[wallet]/page.tsx` et
`me/page.tsx`) :

```tsx
{
  /* Header profil */
}
<div>
  <h1 className="text-2xl font-bold">
    {profile.displayName || profile.username}
  </h1>
  {profile.suinsName && (
    <p className="text-blue-500 font-medium">🏷️ {profile.suinsName}</p>
  )}
  <p className="text-sm text-gray-500 font-mono">{profile.walletAddress}</p>
</div>;
```

---

## Étape 9 — Mettre à jour les types

```typescript
// app/types/user.ts — ajouter suinsName
export interface User {
  walletAddress: string;
  username: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  suinsName?: string; // ← NOUVEAU
  subscriptionPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🧪 Tests

### Test 1 — Résolution SUINS via API

```bash
# Résoudre un nom SUINS
curl "http://localhost:3000/api/suins?query=alice.sui"

# Résoudre une adresse → nom SUINS
curl "http://localhost:3000/api/suins?query=0xabc123..."
```

### Test 2 — Recherche profil par SUINS

```bash
# Chercher un profil par nom SUINS
curl "http://localhost:3000/api/profiles?search=alice.sui"

# Chercher par adresse (toujours fonctionnel)
curl "http://localhost:3000/api/profiles?search=0xabc123"
```

### Test 3 — SearchBar UI

1. Ouvre l'app (`pnpm dev`)
2. Dans la SearchBar, tape `alice.sui` → doit résoudre et afficher le profil
3. Tape une adresse `0x...` → doit trouver le profil directement
4. Tape un username → doit chercher par display_name

---

## 🏗️ Architecture finale

```
Utilisateur tape "alice.sui" dans SearchBar
       │
       ▼
SearchBar détecte ".sui" → appel /api/suins?query=alice.sui
       │
       ▼
/api/suins résout via @mysten/suins → retourne 0xabc123...
       │
       ▼
SearchBar appelle /api/profiles?search=0xabc123...
       │
       ▼
/api/profiles cherche dans Supabase (owner_address, suins_name, display_name)
       │
       ▼
Résultats affichés avec badge SUINS 🏷️
```

```
Indexer (cron toutes les minutes)
       │
       ▼
ProfileCreated event → resolveAddressToName(owner)
       │
       ▼
Stocke suins_name dans user_profiles (Supabase)
       │
       ▼
Recherche par SUINS disponible directement en DB
```

---

## ⚡ Ordre d'implémentation recommandé

1. **`pnpm add @mysten/suins`** — Installer le SDK
2. **SQL ALTER TABLE** — Ajouter la colonne `suins_name`
3. **`app/lib/suins.ts`** — Utilitaire de résolution
4. **`app/api/suins/route.ts`** — Route API dédiée
5. **`app/api/profiles/route.ts`** — Recherche étendue
6. **`app/api/indexer/route.ts`** — Indexation des SUINS
7. **`app/types/user.ts`** — Mise à jour types
8. **`app/components/search/SearchBar.tsx`** — UI de recherche
9. **Pages profil** — Affichage du SUINS

---

## 📝 Notes

- **SUINS est disponible sur testnet et mainnet** — Le SDK gère les deux
- **Le reverse lookup peut être lent** (~200-500ms) — D'où l'intérêt de le
  stocker en DB via l'indexer
- **Un utilisateur peut changer son SUINS** — L'indexer le rafraîchit à chaque
  `ProfileUpdated`
- **Gratuit** — Pas de coût supplémentaire pour les lookups SUINS
- Le dossier `move/` n'est **PAS touché**
