-- Fonctions SQL pour Supabase
-- Exécute ces fonctions après avoir créé les tables

-- Table pour stocker l'état de l'indexer
CREATE TABLE IF NOT EXISTS indexer_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_checkpoint TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Incrémenter le nombre de subscribers
CREATE OR REPLACE FUNCTION increment_subscriber_count(profile_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET subscriber_count = subscriber_count + 1
    WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Incrémenter le nombre de subscriptions
CREATE OR REPLACE FUNCTION increment_subscription_count(profile_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET subscription_count = subscription_count + 1
    WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql;

-- Incrémenter le nombre de favoris
CREATE OR REPLACE FUNCTION increment_favorite_count(listing_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE nft_listings 
    SET favorite_count = favorite_count + 1
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;

-- Décrémenter le nombre de favoris
CREATE OR REPLACE FUNCTION decrement_favorite_count(listing_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE nft_listings 
    SET favorite_count = GREATEST(favorite_count - 1, 0)
    WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql;
