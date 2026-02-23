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
            // Initial sync to set online
            syncUser({
                clerkId: user.id,
                name: user.fullName || user.firstName || "Unknown",
                email: user.primaryEmailAddress?.emailAddress || "",
                image: user.imageUrl,
            });

            const setOnline = () => updateStatus({ clerkId: user.id, isOnline: true });
            const setOffline = () => updateStatus({ clerkId: user.id, isOnline: false });

            // Handle visibility and focus
            const handleVisibilityChange = () => {
                if (document.visibilityState === "visible") {
                    setOnline();
                } else {
                    setOffline();
                }
            };

            window.addEventListener("focus", setOnline);
            window.addEventListener("blur", setOffline);
            document.addEventListener("visibilitychange", handleVisibilityChange);
            window.addEventListener("beforeunload", setOffline);

            return () => {
                window.removeEventListener("focus", setOnline);
                window.removeEventListener("blur", setOffline);
                document.removeEventListener("visibilitychange", handleVisibilityChange);
                window.removeEventListener("beforeunload", setOffline);
                setOffline();
            };
        }
    }, [user, isLoaded, syncUser, updateStatus]);

    return null;
}
