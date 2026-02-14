"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSubscribe, useSubscribedCreators } from "@/hooks/useContract";
import { useUser } from "@/contexts/UserContext";

interface FollowButtonProps {
  /** The on-chain profile object ID of the creator to subscribe to */
  creatorProfileId: string;
  /** The wallet address of the creator */
  creatorAddress?: string;
  /** Subscription price in MIST (0 = free) */
  subscriptionPrice?: number;
  onFollowChange?: (isFollowing: boolean) => void;
}

function mistToSui(mist: number): string {
  const sui = mist / 1_000_000_000;
  return sui % 1 === 0 ? sui.toString() : sui.toFixed(2);
}

export function FollowButton({
  creatorProfileId,
  creatorAddress,
  subscriptionPrice = 0,
  onFollowChange,
}: FollowButtonProps) {
  const { profileId, hasProfile, walletAddress } = useUser();
  const { subscribe, loading } = useSubscribe();
  const { creators: subscribedCreators } = useSubscribedCreators();
  const [subscribed, setSubscribed] = useState(false);

  // Check if already subscribed by looking at SubscriptionReceipt objects
  useEffect(() => {
    if (creatorAddress && subscribedCreators.includes(creatorAddress)) {
      setSubscribed(true);
    }
  }, [creatorAddress, subscribedCreators]);

  const handleClick = async () => {
    if (!profileId || !hasProfile) {
      alert("You need to create a profile first");
      return;
    }

    if (subscribed) {
      // Already subscribed — can't unsubscribe on-chain (no unsub function)
      return;
    }

    try {
      await subscribe(creatorProfileId, profileId, subscriptionPrice);
      setSubscribed(true);
      onFollowChange?.(true);
    } catch (error) {
      console.error("Subscription failed:", error);
      alert("Subscription failed. Check console for details.");
    }
  };

  return (
    <Button
      size="lg"
      variant={subscribed ? "secondary" : "default"}
      className="w-full flex flex-col items-center py-6 h-auto"
      onClick={handleClick}
      disabled={loading || subscribed}
    >
      <span className="text-lg font-bold">
        {loading ? "Processing..." : subscribed ? "Subscribed" : "Subscribe"}
      </span>
      {subscriptionPrice > 0 && (
        <span className="text-sm opacity-80">{mistToSui(subscriptionPrice)} SUI</span>
      )}
      {subscriptionPrice === 0 && !subscribed && (
        <span className="text-sm opacity-80">Free</span>
      )}
    </Button>
  );
}
