"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";

export function UserSync() {
    const { user, isLoaded } = useUser();
    const syncUser = useMutation(api.users.syncUser);
    const updateStatus = useMutation(api.users.updateStatus);

    useEffect(() => {
        if (isLoaded && user) {
            // Sync on mount or when user changes
            syncUser({
                clerkId: user.id,
                name: user.fullName || user.firstName || "Unknown",
                email: user.primaryEmailAddress?.emailAddress || "",
                image: user.imageUrl,
            });

            // Cleanup logic when page unloads
            const handleBeforeUnload = () => {
                updateStatus({ clerkId: user.id, isOnline: false });
            };

            window.addEventListener("beforeunload", handleBeforeUnload);

            // Cleanup logic when component unmounts
            return () => {
                window.removeEventListener("beforeunload", handleBeforeUnload);
                updateStatus({ clerkId: user.id, isOnline: false });
            };
        }
    }, [user, isLoaded, syncUser, updateStatus]);

    return null;
}
