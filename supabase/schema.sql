-- DVB Team Platform Schema
-- Exécute ce SQL dans ton dashboard Supabase

-- Table des profils utilisateurs
CREATE TABLE user_profiles (
    id TEXT PRIMARY KEY,
    owner_address TEXT NOT NULL UNIQUE,
    display_name TEXT,
    bio TEXT,
    subscription_price BIGINT,
    subscriber_count INTEGER DEFAULT 0,
    subscription_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des abonnements
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    subscriber_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    amount_paid BIGINT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    tx_digest TEXT UNIQUE NOT NULL,
    FOREIGN KEY (subscriber_id) REFERENCES user_profiles(id),
    FOREIGN KEY (creator_id) REFERENCES user_profiles(id)
);

-- Table des listings NFT
CREATE TABLE nft_listings (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL,
    nft_type TEXT NOT NULL,
    price BIGINT NOT NULL,
    favorite_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (seller_id) REFERENCES user_profiles(id)
);

-- Table des achats NFT
CREATE TABLE nft_purchases (
    id SERIAL PRIMARY KEY,
    listing_id TEXT NOT NULL,
    buyer_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    price BIGINT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    tx_digest TEXT UNIQUE NOT NULL,
    FOREIGN KEY (buyer_id) REFERENCES user_profiles(id),
    FOREIGN KEY (seller_id) REFERENCES user_profiles(id)
);

-- Table des favoris
CREATE TABLE favorites (
    user_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY (user_id) REFERENCES user_profiles(id),
    FOREIGN KEY (listing_id) REFERENCES nft_listings(id) ON DELETE CASCADE
);

-- Index pour performance
CREATE INDEX idx_subscriptions_creator ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX idx_listings_seller ON nft_listings(seller_id);
CREATE INDEX idx_listings_active ON nft_listings(is_active);
CREATE INDEX idx_listings_created ON nft_listings(created_at DESC);
CREATE INDEX idx_purchases_buyer ON nft_purchases(buyer_id);
CREATE INDEX idx_favorites_listing ON favorites(listing_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
