#[test_only]
module DVB_TEAM::DVB_TEAM_tests;

use sui::test_scenario::{Self as ts, Scenario};
use sui::coin;
use sui::sui::SUI;
use std::string;
use DVB_TEAM::DVB_TEAM::{
    Self,
    UserProfile,
    Registry,
    Listing,
    SubscriptionReceipt,
};

// ═════════════════════════════════════════════════════════════════
//  CONSTANTS
// ═════════════════════════════════════════════════════════════════

const ARTIST: address = @0xA;
const FAN: address = @0xB;
const BUYER: address = @0xC;
const SUB_PRICE: u64 = 1_000_000_000;
const NFT_PRICE: u64 = 5_000_000_000;

// ═════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════

/// NFT de test minimal.
public struct TestNFT has key, store {
    id: sui::object::UID,
}

fun setup(scenario: &mut Scenario) {
    ts::next_tx(scenario, ARTIST);
    DVB_TEAM::init_for_testing(ts::ctx(scenario));
}

fun create_test_profile(scenario: &mut Scenario, addr: address) {
    ts::next_tx(scenario, addr);
    {
        let mut registry = ts::take_shared<Registry>(scenario);
        DVB_TEAM::create_profile(
            &mut registry,
            ts::ctx(scenario),
        );
        ts::return_shared(registry);
    };
}

/// Crée un profil et configure le prix d'abonnement.
fun create_test_profile_with_price(scenario: &mut Scenario, addr: address, price: u64) {
    create_test_profile(scenario, addr);
    ts::next_tx(scenario, addr);
    {
        let mut profile = ts::take_from_sender<UserProfile>(scenario);
        DVB_TEAM::set_subscription_price(&mut profile, price, ts::ctx(scenario));
        ts::return_to_sender(scenario, profile);
    };
}

fun mint_test_nft(ctx: &mut sui::tx_context::TxContext): TestNFT {
    TestNFT { id: sui::object::new(ctx) }
}

// ═════════════════════════════════════════════════════════════════
//  1. PROFILE TESTS
// ═════════════════════════════════════════════════════════════════

#[test]
fun test_create_profile() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    ts::next_tx(&mut scenario, ARTIST);
    {
        let profile = ts::take_from_sender<UserProfile>(&scenario);
        assert!(DVB_TEAM::get_subscription_price(&profile) == 0);
        assert!(DVB_TEAM::get_subscriber_count(&profile) == 0);
        assert!(DVB_TEAM::get_subscription_count(&profile) == 0);
        assert!(DVB_TEAM::get_owner(&profile) == ARTIST);
        assert!(DVB_TEAM::get_display_name(&profile) == string::utf8(b""));
        ts::return_to_sender(&scenario, profile);
    };

    ts::next_tx(&mut scenario, ARTIST);
    {
        let registry = ts::take_shared<Registry>(&scenario);
        assert!(DVB_TEAM::get_profile_count(&registry) == 1);
        ts::return_shared(registry);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = 0)]
fun test_duplicate_profile() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);
    create_test_profile(&mut scenario, ARTIST);
    ts::end(scenario);
}

#[test]
fun test_update_display_name() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        assert!(DVB_TEAM::get_display_name(&profile) == string::utf8(b""));
        DVB_TEAM::update_display_name(&mut profile, string::utf8(b"Alice"), ts::ctx(&mut scenario));
        assert!(DVB_TEAM::get_display_name(&profile) == string::utf8(b"Alice"));
        ts::return_to_sender(&scenario, profile);
    };

    ts::end(scenario);
}

#[test]
fun test_update_bio() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        DVB_TEAM::update_bio(&mut profile, string::utf8(b"I am an artist"), ts::ctx(&mut scenario));
        ts::return_to_sender(&scenario, profile);
    };

    ts::end(scenario);
}

#[test]
fun test_set_subscription_price() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    let new_price: u64 = 2_000_000_000;

    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        DVB_TEAM::set_subscription_price(&mut profile, new_price, ts::ctx(&mut scenario));
        assert!(DVB_TEAM::get_subscription_price(&profile) == new_price);
        ts::return_to_sender(&scenario, profile);
    };

    ts::end(scenario);
}

// ═════════════════════════════════════════════════════════════════
//  2. SUBSCRIPTION (Hot Potato) TESTS
// ═════════════════════════════════════════════════════════════════

#[test]
fun test_full_subscription_flow() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile_with_price(&mut scenario, ARTIST, SUB_PRICE);
    create_test_profile(&mut scenario, FAN);

    ts::next_tx(&mut scenario, FAN);
    {
        let mut artist_profile = ts::take_from_address<UserProfile>(&scenario, ARTIST);
        let mut fan_profile = ts::take_from_address<UserProfile>(&scenario, FAN);

        // Step 1 : Hot Potato
        let ticket = DVB_TEAM::request_subscription(&artist_profile, ts::ctx(&mut scenario));
        assert!(DVB_TEAM::get_ticket_amount(&ticket) == SUB_PRICE);
        assert!(DVB_TEAM::get_ticket_creator(&ticket) == ARTIST);

        // Step 2 : Paiement exact
        let payment = coin::mint_for_testing<SUI>(SUB_PRICE, ts::ctx(&mut scenario));
        DVB_TEAM::complete_subscription(
            ticket,
            &mut artist_profile,
            &mut fan_profile,
            payment,
            ts::ctx(&mut scenario),
        );

        assert!(DVB_TEAM::is_subscribed(&artist_profile, FAN));
        assert!(DVB_TEAM::get_subscriber_count(&artist_profile) == 1);
        assert!(DVB_TEAM::is_subscribed_to(&fan_profile, ARTIST));
        assert!(DVB_TEAM::get_subscription_count(&fan_profile) == 1);

        ts::return_to_address(ARTIST, artist_profile);
        ts::return_to_address(FAN, fan_profile);
    };

    // Vérifie que le FAN a reçu son reçu
    ts::next_tx(&mut scenario, FAN);
    {
        let receipt = ts::take_from_sender<SubscriptionReceipt>(&scenario);
        ts::return_to_sender(&scenario, receipt);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = 2)]
fun test_cannot_subscribe_to_self() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile_with_price(&mut scenario, ARTIST, SUB_PRICE);

    ts::next_tx(&mut scenario, ARTIST);
    {
        let profile = ts::take_from_sender<UserProfile>(&scenario);
        let _ticket = DVB_TEAM::request_subscription(&profile, ts::ctx(&mut scenario));
        abort 0 // unreachable
    }
}

#[test]
#[expected_failure(abort_code = 3)]
fun test_incorrect_subscription_payment() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile_with_price(&mut scenario, ARTIST, SUB_PRICE);
    create_test_profile(&mut scenario, FAN);

    ts::next_tx(&mut scenario, FAN);
    {
        let mut artist_profile = ts::take_from_address<UserProfile>(&scenario, ARTIST);
        let mut fan_profile = ts::take_from_address<UserProfile>(&scenario, FAN);
        let ticket = DVB_TEAM::request_subscription(&artist_profile, ts::ctx(&mut scenario));

        // Paiement incorrect
        let wrong_payment = coin::mint_for_testing<SUI>(SUB_PRICE / 2, ts::ctx(&mut scenario));
        DVB_TEAM::complete_subscription(
            ticket,
            &mut artist_profile,
            &mut fan_profile,
            wrong_payment,
            ts::ctx(&mut scenario),
        );

        ts::return_to_address(ARTIST, artist_profile);
        ts::return_to_address(FAN, fan_profile);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = 4)]
fun test_cannot_subscribe_twice() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile_with_price(&mut scenario, ARTIST, SUB_PRICE);
    create_test_profile(&mut scenario, FAN);

    // Premier abonnement
    ts::next_tx(&mut scenario, FAN);
    {
        let mut artist_profile = ts::take_from_address<UserProfile>(&scenario, ARTIST);
        let mut fan_profile = ts::take_from_address<UserProfile>(&scenario, FAN);
        let ticket = DVB_TEAM::request_subscription(&artist_profile, ts::ctx(&mut scenario));
        let payment = coin::mint_for_testing<SUI>(SUB_PRICE, ts::ctx(&mut scenario));
        DVB_TEAM::complete_subscription(ticket, &mut artist_profile, &mut fan_profile, payment, ts::ctx(&mut scenario));
        ts::return_to_address(ARTIST, artist_profile);
        ts::return_to_address(FAN, fan_profile);
    };

    // Deuxième tentative → doit échouer
    ts::next_tx(&mut scenario, FAN);
    {
        let artist_profile = ts::take_from_address<UserProfile>(&scenario, ARTIST);
        let _ticket = DVB_TEAM::request_subscription(&artist_profile, ts::ctx(&mut scenario));
        abort 0 // unreachable
    }
}

// ═════════════════════════════════════════════════════════════════
//  3. MARKETPLACE — LISTING TESTS
// ═════════════════════════════════════════════════════════════════

#[test]
fun test_list_nft() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        let nft = mint_test_nft(ts::ctx(&mut scenario));

        let _listing_id = DVB_TEAM::list_nft_for_sale(
            &mut profile,
            nft,
            NFT_PRICE,
            string::utf8(b"My Art"),
            string::utf8(b"A beautiful piece"),
            ts::ctx(&mut scenario),
        );

        assert!(DVB_TEAM::get_listing_count(&profile) == 1);
        ts::return_to_sender(&scenario, profile);
    };

    // Vérifie que le listing est bien accessible
    ts::next_tx(&mut scenario, BUYER);
    {
        let listing = ts::take_shared<Listing>(&scenario);
        assert!(DVB_TEAM::get_listing_price(&listing) == NFT_PRICE);
        assert!(DVB_TEAM::get_listing_seller(&listing) == ARTIST);
        assert!(DVB_TEAM::is_listing_active(&listing));
        ts::return_shared(listing);
    };

    ts::end(scenario);
}

// ═════════════════════════════════════════════════════════════════
//  4. PURCHASE (Hot Potato) TESTS
// ═════════════════════════════════════════════════════════════════

#[test]
fun test_full_purchase_flow() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    // Artiste liste un NFT
    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        let nft = mint_test_nft(ts::ctx(&mut scenario));
        DVB_TEAM::list_nft_for_sale(
            &mut profile, nft, NFT_PRICE,
            string::utf8(b"Art"), string::utf8(b"Desc"),
            ts::ctx(&mut scenario),
        );
        ts::return_to_sender(&scenario, profile);
    };

    // Acheteur achète le NFT (Hot Potato complete flow)
    ts::next_tx(&mut scenario, BUYER);
    {
        let mut listing = ts::take_shared<Listing>(&scenario);

        // Step 1 : initiate_purchase
        let ticket = DVB_TEAM::initiate_purchase(&listing, ts::ctx(&mut scenario));
        assert!(DVB_TEAM::get_purchase_price(&ticket) == NFT_PRICE);
        assert!(DVB_TEAM::get_purchase_seller(&ticket) == ARTIST);

        // Step 2 : buy_and_take
        let payment = coin::mint_for_testing<SUI>(NFT_PRICE, ts::ctx(&mut scenario));
        DVB_TEAM::buy_and_take<TestNFT>(ticket, &mut listing, payment, ts::ctx(&mut scenario));

        assert!(!DVB_TEAM::is_listing_active(&listing));
        ts::return_shared(listing);
    };

    // Vérifie que l'acheteur a bien reçu le NFT
    ts::next_tx(&mut scenario, BUYER);
    {
        let nft = ts::take_from_sender<TestNFT>(&scenario);
        ts::return_to_sender(&scenario, nft);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = 6)]
fun test_cannot_buy_own_listing() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        let nft = mint_test_nft(ts::ctx(&mut scenario));
        DVB_TEAM::list_nft_for_sale(
            &mut profile, nft, NFT_PRICE,
            string::utf8(b"Art"), string::utf8(b"Desc"),
            ts::ctx(&mut scenario),
        );
        ts::return_to_sender(&scenario, profile);
    };

    ts::next_tx(&mut scenario, ARTIST);
    {
        let listing = ts::take_shared<Listing>(&scenario);
        let _ticket = DVB_TEAM::initiate_purchase(&listing, ts::ctx(&mut scenario));
        abort 0 // unreachable
    }
}

#[test]
#[expected_failure(abort_code = 3)]
fun test_incorrect_purchase_payment() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        let nft = mint_test_nft(ts::ctx(&mut scenario));
        DVB_TEAM::list_nft_for_sale(
            &mut profile, nft, NFT_PRICE,
            string::utf8(b"Art"), string::utf8(b"Desc"),
            ts::ctx(&mut scenario),
        );
        ts::return_to_sender(&scenario, profile);
    };

    ts::next_tx(&mut scenario, BUYER);
    {
        let mut listing = ts::take_shared<Listing>(&scenario);
        let ticket = DVB_TEAM::initiate_purchase(&listing, ts::ctx(&mut scenario));

        // Paiement incorrect
        let wrong_payment = coin::mint_for_testing<SUI>(NFT_PRICE / 2, ts::ctx(&mut scenario));
        DVB_TEAM::buy_and_take<TestNFT>(ticket, &mut listing, wrong_payment, ts::ctx(&mut scenario));

        ts::return_shared(listing);
    };

    ts::end(scenario);
}

// ═════════════════════════════════════════════════════════════════
//  5. DELIST TEST
// ═════════════════════════════════════════════════════════════════

#[test]
fun test_delist_nft() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);

    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        let nft = mint_test_nft(ts::ctx(&mut scenario));
        DVB_TEAM::list_nft_for_sale(
            &mut profile, nft, NFT_PRICE,
            string::utf8(b"Art"), string::utf8(b"Desc"),
            ts::ctx(&mut scenario),
        );
        ts::return_to_sender(&scenario, profile);
    };

    // L'artiste retire son listing
    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut listing = ts::take_shared<Listing>(&scenario);
        DVB_TEAM::delist_and_take<TestNFT>(&mut listing, ts::ctx(&mut scenario));
        assert!(!DVB_TEAM::is_listing_active(&listing));
        ts::return_shared(listing);
    };

    // Vérifie que l'artiste a récupéré son NFT
    ts::next_tx(&mut scenario, ARTIST);
    {
        let nft = ts::take_from_sender<TestNFT>(&scenario);
        ts::return_to_sender(&scenario, nft);
    };

    ts::end(scenario);
}

// ═════════════════════════════════════════════════════════════════
//  6. FAVORITES TEST
// ═════════════════════════════════════════════════════════════════

#[test]
fun test_toggle_favorite() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    create_test_profile(&mut scenario, ARTIST);
    create_test_profile(&mut scenario, FAN);

    // Artiste crée un listing
    ts::next_tx(&mut scenario, ARTIST);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        let nft = mint_test_nft(ts::ctx(&mut scenario));
        DVB_TEAM::list_nft_for_sale(
            &mut profile, nft, NFT_PRICE,
            string::utf8(b"Art"), string::utf8(b"Desc"),
            ts::ctx(&mut scenario),
        );
        ts::return_to_sender(&scenario, profile);
    };

    // Fan met en favori
    ts::next_tx(&mut scenario, FAN);
    {
        let mut profile = ts::take_from_sender<UserProfile>(&scenario);
        let mut listing = ts::take_shared<Listing>(&scenario);
        let listing_id = sui::object::id(&listing);

        DVB_TEAM::toggle_favorite(&mut profile, &mut listing, ts::ctx(&mut scenario));
        assert!(DVB_TEAM::has_favorited(&profile, listing_id));
        assert!(DVB_TEAM::get_favorite_count(&listing) == 1);

        // Toggle off
        DVB_TEAM::toggle_favorite(&mut profile, &mut listing, ts::ctx(&mut scenario));
        assert!(!DVB_TEAM::has_favorited(&profile, listing_id));
        assert!(DVB_TEAM::get_favorite_count(&listing) == 0);

        ts::return_shared(listing);
        ts::return_to_sender(&scenario, profile);
    };

    ts::end(scenario);
}

// ═════════════════════════════════════════════════════════════════
//  7. SUBSCRIPTION NOT CONFIGURED TEST
// ═════════════════════════════════════════════════════════════════

#[test]
#[expected_failure(abort_code = 9)]
fun test_cannot_subscribe_without_price() {
    let mut scenario = ts::begin(ARTIST);
    setup(&mut scenario);
    // Profil créé sans prix (subscription_price = 0)
    create_test_profile(&mut scenario, ARTIST);

    ts::next_tx(&mut scenario, FAN);
    {
        let artist_profile = ts::take_from_address<UserProfile>(&scenario, ARTIST);
        let _ticket = DVB_TEAM::request_subscription(&artist_profile, ts::ctx(&mut scenario));
        abort 0 // unreachable
    }
}
