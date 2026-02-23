"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function Sidebar() {
    const { user, isLoaded: isClerkLoaded } = useUser();
    const [startingConversation, setStartingConversation] = useState<string | null>(null);

    const users = useQuery(
        api.users.listAll,
        isClerkLoaded && user ? { excludeClerkId: user.id } : "skip"
    );
    const currentUser = useQuery(
        api.users.current,
        isClerkLoaded && user ? { clerkId: user.id } : "skip"
    );

    const getOrCreateConversation = useMutation(api.conversations.getOrCreateConversation);

    const handleStartConversation = async (participantId: any) => {
        if (!currentUser) return;
        try {
            setStartingConversation(participantId);
            const conversationId = await getOrCreateConversation({
                participantId,
                currentUserId: currentUser._id,
            });
            console.log("Joined conversation:", conversationId);
            // We'll handle navigation later if needed
        } catch (error) {
            console.error("Error starting conversation:", error);
        } finally {
            setStartingConversation(null);
        }
    };

    if (!isClerkLoaded || users === undefined) {
        return (
            <div className="flex h-full items-center justify-center border-r bg-white dark:bg-zinc-950">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
        );
    }

    return (
        <div className="flex h-full w-80 flex-col border-r bg-white dark:bg-zinc-950">
            <div className="border-b p-4 px-6">
                <h2 className="text-xl font-bold">Chats</h2>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {users.length === 0 ? (
                        <div className="p-4 text-center text-sm text-zinc-500">
                            No other users found
                        </div>
                    ) : (
                        users.map((u) => (
                            <button
                                key={u._id}
                                onClick={() => handleStartConversation(u._id)}
                                disabled={startingConversation === u._id}
                                className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50"
                            >
                                <div className="relative">
                                    <Avatar>
                                        <AvatarImage src={u.image} />
                                        <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {u.isOnline && (
                                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden font-medium">
                                    <div className="truncate">{u.name}</div>
                                    <div className="truncate text-xs text-zinc-500 font-normal">
                                        {u.isOnline ? "Online" : "Offline"}
                                    </div>
                                </div>
                                {startingConversation === u._id && (
                                    <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                                )}
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
