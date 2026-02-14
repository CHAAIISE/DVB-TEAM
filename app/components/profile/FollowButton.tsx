"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  userId: string;
  subscriptionPrice?: number;
  isFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  userId,
  subscriptionPrice,
  isFollowing = false,
  onFollowChange,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement follow/unfollow with blockchain payment if subscriptionPrice
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call

      const newFollowingState = !following;
      setFollowing(newFollowingState);
      onFollowChange?.(newFollowingState);

      if (newFollowingState && subscriptionPrice) {
        console.log(`Processing payment of ${subscriptionPrice} SUI for subscription`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      size="lg"
      variant={following ? "secondary" : "default"}
      className="w-full flex flex-col items-center py-6 h-auto"
      onClick={handleClick}
      disabled={isLoading}
    >
      <span className="text-lg font-bold">
        {following ? "Following" : "Follow"}
      </span>
      {subscriptionPrice && (
        <span className="text-sm opacity-80">{subscriptionPrice} SUI</span>
      )}
    </Button>
  );
}
