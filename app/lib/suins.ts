import { SuiClient } from '@mysten/sui/client';

const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';

const suiClient = new SuiClient({
  url: SUI_NETWORK === 'mainnet'
    ? 'https://fullnode.mainnet.sui.io:443'
    : 'https://fullnode.testnet.sui.io:443'
});

/**
 * Résout un nom SUINS (ex: "alice.sui") → adresse wallet
 * Utilise le JSON-RPC natif du SuiClient (suix_resolveNameServiceAddress)
 * Retourne null si le nom n'existe pas
 */
export async function resolveNameToAddress(name: string): Promise<string | null> {
  try {
    const normalizedName = name.endsWith('.sui') ? name : `${name}.sui`;
    const address = await suiClient.resolveNameServiceAddress({ name: normalizedName });
    return address ?? null;
  } catch (error) {
    console.error(`SUINS resolution failed for ${name}:`, error);
    return null;
  }
}

/**
 * Résout une adresse wallet → nom(s) SUINS (reverse lookup)
 * Utilise le JSON-RPC natif du SuiClient (suix_resolveNameServiceNames)
 * Retourne le premier nom ou null si aucun nom SUINS associé
 */
export async function resolveAddressToName(address: string): Promise<string | null> {
  try {
    const result = await suiClient.resolveNameServiceNames({ address, format: 'dot' });
    return result.data?.[0] ?? null;
  } catch (error) {
    console.error(`SUINS reverse lookup failed for ${address}:`, error);
    return null;
  }
}

/**
 * Détecte si un input est potentiellement un nom SUINS plutôt qu'une adresse
 * - Se termine par .sui → SUINS
 * - Ne commence pas par 0x et ne contient que des caractères alphanumériques/tirets → SUINS
 */
export function isSuinsName(input: string): boolean {
  if (!input || input.length < 2) return false;
  if (input.endsWith('.sui')) return true;
  if (input.startsWith('0x')) return false;
  return /^[a-zA-Z0-9-]+$/.test(input);
}
