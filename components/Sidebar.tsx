"use client";

import { useUser, UserButton, useClerk } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { Search, LogOut } from "lucide-react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { cn, formatTimestamp } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";

export function Sidebar({ className }: { className?: string }) {
    const { user, isLoaded: isClerkLoaded } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

    const currentUser = useQuery(
        api.users.current,
        isClerkLoaded && user ? { clerkId: user.id } : "skip"
    );

    const conversations = useQuery(
        api.conversations.list,
        currentUser ? { currentUserId: currentUser._id } : "skip"
    );

    const allUsers = useQuery(
        api.users.listAll,
        currentUser ? { excludeClerkId: currentUser.clerkId } : "skip"
    );

    const createConversation = useMutation(api.conversations.getOrCreateConversation);

    const filteredConversations = conversations?.filter((c) => {
        if (!c.otherUser) return false;
        return c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const otherUsers = allUsers?.filter((u) => {
        const inConversation = conversations?.some(c => c.otherUser?._id === u._id);
        if (inConversation) return false;
        return u.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleSelectConversation = (conversationId: string) => {
        router.push(`/chat/${conversationId}`);
    };

    const handleStartChat = async (participantId: Id<"users">) => {
        if (!currentUser) return;
        const conversationId = await createConversation({
            currentUserId: currentUser._id,
            participantId,
        });
        router.push(`/chat/${conversationId}`);
    };

    if (!isClerkLoaded || conversations === undefined) {
        return (
            <div className={cn("flex h-full flex-col border-r bg-white dark:bg-zinc-950", className)}>
                <div className="p-4 px-6 space-y-4">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="p-2 space-y-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-3 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex h-full flex-col border-r bg-white dark:bg-zinc-950", className)}>
            <div className="p-4 px-6 space-y-4">
                <h2 className="text-xl font-bold">Chats</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                        placeholder="Search chats..."
                        className="pl-9 bg-zinc-100 dark:bg-zinc-900 border-none outline-none focus-visible:ring-0 shadow-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filteredConversations && filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-sm text-zinc-500">
                            {searchQuery ? "No chats found" : "No ongoing chats"}
                        </div>
                    ) : (
                        filteredConversations?.map((c) => {
                            const u = c.otherUser;
                            if (!u) return null;

                            return (
                                <button
                                    key={c._id}
                                    onClick={() => handleSelectConversation(c._id)}
                                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={u.image} />
                                            <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {u.isOnline && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950" />
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <div className="truncate text-base font-semibold mr-2">{u.name}</div>
                                            {c.lastMessageAt > 0 && (
                                                <div className={`text-[11px] font-medium shrink-0 ${c.unreadCount > 0 ? "text-green-500" : "text-zinc-500"}`}>
                                                    {formatTimestamp(c.lastMessageAt)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className={`truncate text-[14px] leading-tight flex-1 min-w-0 ${c.unreadCount > 0 ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-500"}`}>
                                                {c.lastMessage
                                                    ? c.lastMessage.length > 35
                                                        ? `${c.lastMessage.substring(0, 30)}...`
                                                        : c.lastMessage
                                                    : "Started a conversation"}
                                            </div>
                                            {c.unreadCount > 0 && (
                                                <div className="min-w-[18px] h-[18px] rounded-full bg-green-500 flex items-center justify-center shrink-0">
                                                    <span className="text-[10px] text-white font-bold leading-none mt-[1px]">
                                                        {c.unreadCount}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}

                    {otherUsers && otherUsers.length > 0 && (
                        <div className="mt-4">
                            <div className="px-3 pb-2 pt-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                                Start a chat
                            </div>
                            {otherUsers.map((u) => (
                                <button
                                    key={u._id}
                                    onClick={() => handleStartChat(u._id)}
                                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={u.image} />
                                            <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        {u.isOnline && (
                                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950" />
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="truncate text-sm font-medium">{u.name}</div>
                                        <div className="truncate text-xs text-zinc-500">Click to start chatting</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-4 border-t flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                    <UserButton appearance={{ elements: { userButtonAvatarBox: "h-8 w-8" } }} />
                    <div className="text-sm font-medium truncate max-w-[120px]">
                        {user?.fullName || user?.firstName || "Settings"}
                    </div>
                </div>
                <button
                    onClick={() => signOut(() => router.push("/"))}
                    className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors text-zinc-500 hover:text-red-500"
                    title="Logout"
                >
                    <LogOut className="h-5 w-5" />
                </button>

            </div>
        </div>
    );
}
