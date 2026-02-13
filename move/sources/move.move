/// ═══════════════════════════════════════════════════════════════════════════
/// DVB_TEAM — Plateforme Patreon décentralisée pour artistes NFT sur Sui
/// ═══════════════════════════════════════════════════════════════════════════
///
/// Architecture :
///   UserProfile  — objet possédé, métadonnées + prix abo + Table abonnés + Table abonnements
///   Listing      — NFT en vente (shared object, stocke le NFT via dynamic_object_field)
///
///   Chaque UserProfile stocke :
///     - `subscribers`   : Table des gens qui **paient** pour s'abonner à ce user
///     - `subscriptions` : Table des créateurs auxquels ce user **est abonné**
///
/// Sécurité transactionnelle (Hot Potato Pattern) :
///
///   SubscriptionTicket (aucun ability)
///     → Créé par `request_subscription`, détruit par `complete_subscription`.
///     → Sans key/store/drop, il est impossible de stocker, transférer ou
///       ignorer ce ticket. La seule issue est de le consumer dans le même
///       Programmable Transaction Block (PTB) en fournissant le Coin<SUI>
///       du montant exact. Cela garantit l'atomicité du paiement.
///
///   PurchaseTicket (aucun ability)
///     → Créé par `initiate_purchase`, détruit par `complete_purchase`.
///     → Verrouille le prix et l'ID du listing au moment de la création.
///       `complete_purchase` vérifie que le paiement correspond exactement,
///       extrait le NFT du listing via dynamic_object_field, transfère les
///       fonds au vendeur et retourne le NFT à l'acheteur — le tout
///       atomiquement dans un seul PTB.
///
/// ═══════════════════════════════════════════════════════════════════════════
#[allow(lint(public_entry))]
module DVB_TEAM::DVB_TEAM;

use sui::coin::Coin;
use sui::sui::SUI;
use sui::table::{Self, Table};
use sui::event;
use sui::dynamic_object_field as dof;
use std::string::{Self, String};

// ══════════════════════════════════════════════════════════════════════════════
//  ERROR CODES
// ══════════════════════════════════════════════════════════════════════════════

const EProfileAlreadyExists: u64 = 0;
const EInvalidPrice: u64 = 1;
const ECannotSubscribeToSelf: u64 = 2;
const EIncorrectPayment: u64 = 3;
const EAlreadySubscribed: u64 = 4;
const ENotOwner: u64 = 5;
const ECannotBuyOwnListing: u64 = 6;
const EListingNotActive: u64 = 7;
const ETicketListingMismatch: u64 = 8;
const ESubscriptionNotConfigured: u64 = 9;

// ══════════════════════════════════════════════════════════════════════════════
//  CORE DATA STRUCTURES
// ══════════════════════════════════════════════════════════════════════════════

/// Profil utilisateur — objet possédé par l'utilisateur.
///   - `subscribers`   : Table<adresse_abonné → SubscriptionRecord> (qui me suit)
///   - `subscriptions` : Table<adresse_créateur → bool> (à qui je suis abonné)
///   - `favorites`     : Table<ID_listing → bool>
public struct UserProfile has key, store {
    id: UID,
    owner: address,
    display_name: String,
    bio: String,
    subscription_price: u64,
    subscribers: Table<address, SubscriptionRecord>,
    subscriber_count: u64,
    subscriptions: Table<address, bool>,
    subscription_count: u64,
    favorites: Table<ID, bool>,
    listing_count: u64,
}

/// Enregistrement d'abonnement stocké dans la Table du créateur.
public struct SubscriptionRecord has store, drop {
    subscriber: address,
    price_paid: u64,
    created_at: u64,
}

/// Reçu d'abonnement — objet possédé par l'abonné (preuve on-chain).
public struct SubscriptionReceipt has key, store {
    id: UID,
    creator: address,
    subscriber: address,
    price_paid: u64,
    created_at: u64,
}

/// Registre global (shared object) — empêche la double création de profil.
public struct Registry has key {
    id: UID,
    profiles: Table<address, ID>,
    profile_count: u64,
}

// ══════════════════════════════════════════════════════════════════════════════
//  MARKETPLACE STRUCTURES
// ══════════════════════════════════════════════════════════════════════════════

/// NFT mis en vente — shared object pour être accessible à tous.
/// Le NFT lui-même est stocké via `dynamic_object_field` (clé = `true`).
public struct Listing has key, store {
    id: UID,
    seller: address,
    price: u64,
    title: String,
    description: String,
    nft_id: ID,
    is_active: bool,
    favorite_count: u64,
}

// ══════════════════════════════════════════════════════════════════════════════
//  HOT POTATO TICKETS (aucun ability → consommation obligatoire dans le PTB)
// ══════════════════════════════════════════════════════════════════════════════

/// Ticket d'abonnement — Hot Potato.
public struct SubscriptionTicket {
    creator: address,
    creator_profile_id: ID,
    amount_due: u64,
    subscriber: address,
}

/// Ticket d'achat NFT — Hot Potato.
public struct PurchaseTicket {
    listing_id: ID,
    seller: address,
    price: u64,
    buyer: address,
}

// ══════════════════════════════════════════════════════════════════════════════
//  EVENTS
// ══════════════════════════════════════════════════════════════════════════════

public struct ProfileCreated has copy, drop {
    profile_id: ID,
    owner: address,
    subscription_price: u64,
}

public struct SubscriptionCompleted has copy, drop {
    creator: address,
    subscriber: address,
    price_paid: u64,
}

public struct PriceUpdated has copy, drop {
    profile_id: ID,
    old_price: u64,
    new_price: u64,
}

public struct NftListed has copy, drop {
    listing_id: ID,
    seller: address,
    price: u64,
    nft_id: ID,
}

public struct NftPurchased has copy, drop {
    listing_id: ID,
    buyer: address,
    seller: address,
    price: u64,
}

public struct ListingFavorited has copy, drop {
    listing_id: ID,
    user: address,
}

public struct ListingUnfavorited has copy, drop {
    listing_id: ID,
    user: address,
}

// ══════════════════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════════════════

fun init(ctx: &mut TxContext) {
    let registry = Registry {
        id: object::new(ctx),
        profiles: table::new(ctx),
        profile_count: 0,
    };
    transfer::share_object(registry);
}

// ══════════════════════════════════════════════════════════════════════════════
//  1. PROFIL & AUTH — Création de profil, mise à jour, prix d'abonnement
// ══════════════════════════════════════════════════════════════════════════════

/// Crée un profil utilisateur automatiquement. Un seul profil par adresse.
/// display_name et bio sont vides par défaut, subscription_price = 0.
/// L'utilisateur peut ensuite les modifier via update_display_name, update_bio,
/// et set_subscription_price.
public entry fun create_profile(
    registry: &mut Registry,
    ctx: &mut TxContext,
) {
    let sender = ctx.sender();
    assert!(!registry.profiles.contains(sender), EProfileAlreadyExists);

    let profile = new_profile(sender, ctx);
    let profile_id = object::id(&profile);

    registry.profiles.add(sender, profile_id);
    registry.profile_count = registry.profile_count + 1;

    event::emit(ProfileCreated { profile_id, owner: sender, subscription_price: 0 });

    transfer::transfer(profile, sender);
}

/// Met à jour le display_name.
public entry fun update_display_name(
    profile: &mut UserProfile,
    new_name: String,
    ctx: &TxContext,
) {
    assert!(profile.owner == ctx.sender(), ENotOwner);
    profile.display_name = new_name;
}

/// Met à jour la bio.
public entry fun update_bio(
    profile: &mut UserProfile,
    new_bio: String,
    ctx: &TxContext,
) {
    assert!(profile.owner == ctx.sender(), ENotOwner);
    profile.bio = new_bio;
}

/// Met à jour le prix d'abonnement.
public entry fun set_subscription_price(
    profile: &mut UserProfile,
    new_price: u64,
    ctx: &TxContext,
) {
    assert!(profile.owner == ctx.sender(), ENotOwner);
    assert!(new_price > 0, EInvalidPrice);

    let old_price = profile.subscription_price;
    profile.subscription_price = new_price;

    event::emit(PriceUpdated {
        profile_id: object::id(profile),
        old_price,
        new_price,
    });
}

// ══════════════════════════════════════════════════════════════════════════════
//  2. ABONNEMENTS PAYANTS — Hot Potato Pattern
// ══════════════════════════════════════════════════════════════════════════════

/// Step 1 — Crée un SubscriptionTicket (Hot Potato).
/// L'appelant DOIT appeler `complete_subscription` dans le même PTB.
public fun request_subscription(
    creator_profile: &UserProfile,
    ctx: &TxContext,
): SubscriptionTicket {
    let subscriber = ctx.sender();
    assert!(creator_profile.subscription_price > 0, ESubscriptionNotConfigured);
    assert!(subscriber != creator_profile.owner, ECannotSubscribeToSelf);
    assert!(!creator_profile.subscribers.contains(subscriber), EAlreadySubscribed);

    SubscriptionTicket {
        creator: creator_profile.owner,
        creator_profile_id: object::id(creator_profile),
        amount_due: creator_profile.subscription_price,
        subscriber,
    }
}

/// Step 2 — Consomme le ticket et finalise l'abonnement.
/// Met à jour le profil du créateur (subscribers) ET le profil de l'abonné (subscriptions).
public fun complete_subscription(
    ticket: SubscriptionTicket,
    creator_profile: &mut UserProfile,
    subscriber_profile: &mut UserProfile,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let SubscriptionTicket {
        creator,
        creator_profile_id,
        amount_due,
        subscriber,
    } = ticket;

    // Vérifications strictes
    assert!(object::id(creator_profile) == creator_profile_id, ENotOwner);
    assert!(creator_profile.owner == creator, ENotOwner);
    assert!(subscriber_profile.owner == subscriber, ENotOwner);
    assert!(payment.value() == amount_due, EIncorrectPayment);
    assert!(!creator_profile.subscribers.contains(subscriber), EAlreadySubscribed);

    // Enregistre l'abonnement côté créateur
    let record = SubscriptionRecord {
        subscriber,
        price_paid: amount_due,
        created_at: ctx.epoch(),
    };
    creator_profile.subscribers.add(subscriber, record);
    creator_profile.subscriber_count = creator_profile.subscriber_count + 1;

    // Enregistre l'abonnement côté abonné
    subscriber_profile.subscriptions.add(creator, true);
    subscriber_profile.subscription_count = subscriber_profile.subscription_count + 1;

    // Transfère le paiement au créateur
    transfer::public_transfer(payment, creator);

    // Émet le reçu à l'abonné
    let receipt = SubscriptionReceipt {
        id: object::new(ctx),
        creator,
        subscriber,
        price_paid: amount_due,
        created_at: ctx.epoch(),
    };
    transfer::transfer(receipt, subscriber);

    event::emit(SubscriptionCompleted { creator, subscriber, price_paid: amount_due });
}

// ══════════════════════════════════════════════════════════════════════════════
//  3. MARKETPLACE — Listing, favoris, delist
// ══════════════════════════════════════════════════════════════════════════════

/// Met en vente un NFT. Le NFT est transféré dans le Listing (shared object)
/// via `dynamic_object_field`. T doit avoir `key + store`.
public fun list_nft_for_sale<T: key + store>(
    seller_profile: &mut UserProfile,
    nft: T,
    price: u64,
    title: String,
    description: String,
    ctx: &mut TxContext,
): ID {
    assert!(seller_profile.owner == ctx.sender(), ENotOwner);
    assert!(price > 0, EInvalidPrice);

    let nft_id = object::id(&nft);

    let mut listing = Listing {
        id: object::new(ctx),
        seller: ctx.sender(),
        price,
        title,
        description,
        nft_id,
        is_active: true,
        favorite_count: 0,
    };

    let listing_id = object::id(&listing);

    // Stocke le NFT dans le listing via dynamic_object_field
    dof::add(&mut listing.id, true, nft);

    seller_profile.listing_count = seller_profile.listing_count + 1;

    event::emit(NftListed { listing_id, seller: ctx.sender(), price, nft_id });

    transfer::share_object(listing);

    listing_id
}

/// Ajoute / retire un listing des favoris (toggle).
public entry fun toggle_favorite(
    profile: &mut UserProfile,
    listing: &mut Listing,
    ctx: &TxContext,
) {
    let sender = ctx.sender();
    assert!(profile.owner == sender, ENotOwner);

    let listing_id = object::id(listing);

    if (profile.favorites.contains(listing_id)) {
        profile.favorites.remove(listing_id);
        listing.favorite_count = listing.favorite_count - 1;
        event::emit(ListingUnfavorited { listing_id, user: sender });
    } else {
        profile.favorites.add(listing_id, true);
        listing.favorite_count = listing.favorite_count + 1;
        event::emit(ListingFavorited { listing_id, user: sender });
    };
}

// ══════════════════════════════════════════════════════════════════════════════
//  4. ACHAT NFT — Hot Potato Pattern
// ══════════════════════════════════════════════════════════════════════════════

/// Step 1 — Crée un PurchaseTicket (Hot Potato).
/// Verrouille prix et listing. Doit être consommé via `complete_purchase`.
public fun initiate_purchase(
    listing: &Listing,
    ctx: &TxContext,
): PurchaseTicket {
    let buyer = ctx.sender();
    assert!(buyer != listing.seller, ECannotBuyOwnListing);
    assert!(listing.is_active, EListingNotActive);

    PurchaseTicket {
        listing_id: object::id(listing),
        seller: listing.seller,
        price: listing.price,
        buyer,
    }
}

/// Step 2 — Consomme le PurchaseTicket, vérifie le paiement, retourne le NFT.
/// Le NFT est extrait du listing et retourné à l'appelant pour transfert dans le PTB.
public fun complete_purchase<T: key + store>(
    ticket: PurchaseTicket,
    listing: &mut Listing,
    payment: Coin<SUI>,
): T {
    let PurchaseTicket {
        listing_id,
        seller,
        price,
        buyer,
    } = ticket;

    assert!(object::id(listing) == listing_id, ETicketListingMismatch);
    assert!(listing.is_active, EListingNotActive);
    assert!(payment.value() == price, EIncorrectPayment);

    // Désactive le listing
    listing.is_active = false;

    // Extrait le NFT du listing
    let nft: T = dof::remove(&mut listing.id, true);

    // Transfère le paiement au vendeur
    transfer::public_transfer(payment, seller);

    event::emit(NftPurchased { listing_id, buyer, seller, price });

    nft
}

/// Achète et transfère automatiquement le NFT à l'acheteur.
public fun buy_and_take<T: key + store>(
    ticket: PurchaseTicket,
    listing: &mut Listing,
    payment: Coin<SUI>,
    ctx: &mut TxContext,
) {
    let buyer = ctx.sender();
    let nft = complete_purchase<T>(ticket, listing, payment);
    transfer::public_transfer(nft, buyer);
}

/// Le vendeur retire son listing et récupère son NFT.
public entry fun delist_and_take<T: key + store>(
    listing: &mut Listing,
    ctx: &mut TxContext,
) {
    assert!(listing.seller == ctx.sender(), ENotOwner);
    assert!(listing.is_active, EListingNotActive);

    listing.is_active = false;
    let nft: T = dof::remove(&mut listing.id, true);
    transfer::public_transfer(nft, ctx.sender());
}

// ══════════════════════════════════════════════════════════════════════════════
//  ACCESSEURS (View Functions)
// ══════════════════════════════════════════════════════════════════════════════

public fun get_subscription_price(profile: &UserProfile): u64 { profile.subscription_price }
public fun get_subscriber_count(profile: &UserProfile): u64 { profile.subscriber_count }
public fun is_subscribed(profile: &UserProfile, addr: address): bool { profile.subscribers.contains(addr) }
public fun get_subscription_count(profile: &UserProfile): u64 { profile.subscription_count }
public fun is_subscribed_to(profile: &UserProfile, creator: address): bool { profile.subscriptions.contains(creator) }
public fun get_profile_count(registry: &Registry): u64 { registry.profile_count }
public fun get_owner(profile: &UserProfile): address { profile.owner }
public fun get_display_name(profile: &UserProfile): String { profile.display_name }
public fun get_listing_price(listing: &Listing): u64 { listing.price }
public fun get_listing_seller(listing: &Listing): address { listing.seller }
public fun is_listing_active(listing: &Listing): bool { listing.is_active }
public fun get_favorite_count(listing: &Listing): u64 { listing.favorite_count }
public fun has_favorited(profile: &UserProfile, listing_id: ID): bool { profile.favorites.contains(listing_id) }
public fun get_listing_count(profile: &UserProfile): u64 { profile.listing_count }

// Accesseurs Hot Potato
public fun get_ticket_amount(ticket: &SubscriptionTicket): u64 { ticket.amount_due }
public fun get_ticket_creator(ticket: &SubscriptionTicket): address { ticket.creator }
public fun get_purchase_price(ticket: &PurchaseTicket): u64 { ticket.price }
public fun get_purchase_seller(ticket: &PurchaseTicket): address { ticket.seller }

// ══════════════════════════════════════════════════════════════════════════════
//  INTERNAL
// ══════════════════════════════════════════════════════════════════════════════

fun new_profile(
    owner: address,
    ctx: &mut TxContext,
): UserProfile {
    UserProfile {
        id: object::new(ctx),
        owner,
        display_name: string::utf8(b""),
        bio: string::utf8(b""),
        subscription_price: 0,
        subscribers: table::new(ctx),
        subscriber_count: 0,
        subscriptions: table::new(ctx),
        subscription_count: 0,
        favorites: table::new(ctx),
        listing_count: 0,
    }
}

// ══════════════════════════════════════════════════════════════════════════════
//  TEST HELPERS
// ══════════════════════════════════════════════════════════════════════════════

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}
