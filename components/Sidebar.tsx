"use client";

import { useUser, UserButton, useClerk } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { useState } from "react";
import { Search, LogOut, Users } from "lucide-react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { cn, formatTimestamp } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";

export function Sidebar({ className }: { className?: string }) {
    const { user, isLoaded: isClerkLoaded } = useUser();
    const { signOut } = useClerk();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);

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
    const createGroup = useMutation(api.conversations.createGroup);

    const filteredConversations = conversations?.filter((c) => {
        if (c.isGroup) {
            return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
        }
        if (!c.otherUser) return false;
        return c.otherUser.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const otherUsers = allUsers?.filter((u) => {
        const inConversation = conversations?.some(c => !c.isGroup && c.otherUser?._id === u._id);
        if (inConversation) return false;
        return u.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const handleCreateGroup = async () => {
        if (!currentUser || !groupName.trim() || selectedUsers.length === 0) return;
        const conversationId = await createGroup({
            name: groupName.trim(),
            memberIds: selectedUsers,
            currentUserId: currentUser._id,
        });
        setGroupName("");
        setSelectedUsers([]);
        setIsGroupDialogOpen(false);
        router.push(`/chat/${conversationId}`);
    };

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
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">Chats</h2>
                    <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                                <Users className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950">
                            <DialogHeader>
                                <DialogTitle>Create Group Chat</DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <Input
                                    placeholder="Group Name"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    className="bg-zinc-100 dark:bg-zinc-900 border-none"
                                />
                                <ScrollArea className="h-48 border rounded-md dark:border-zinc-100 pl-2">
                                    <div className="p-2 space-y-2">
                                        {allUsers?.filter(u => u._id !== currentUser?._id).map((u) => (
                                            <div key={u._id} className="flex items-center gap-3 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg">
                                                <Checkbox
                                                    id={u._id}
                                                    checked={selectedUsers.includes(u._id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedUsers(prev => [...prev, u._id]);
                                                        } else {
                                                            setSelectedUsers(prev => prev.filter(id => id !== u._id));
                                                        }
                                                    }}
                                                />
                                                <label htmlFor={u._id} className="flex-1 flex items-center gap-3 cursor-pointer">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={u.image} />
                                                        <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{u.name}</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                            <DialogFooter>
                                <Button disabled={!groupName.trim() || selectedUsers.length === 0} onClick={handleCreateGroup}>
                                    Create Group
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
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
                            const isGroup = c.isGroup;
                            const u = c.otherUser;
                            if (!isGroup && !u) return null;

                            const displayName = isGroup ? c.name : u?.name;
                            const displayImage = isGroup ? undefined : u?.image;
                            const fallbackText = isGroup ? (c.name || "Group").charAt(0) : u?.name.charAt(0);
                            const isOnline = !isGroup && u?.isOnline;

                            return (
                                <button
                                    key={c._id}
                                    onClick={() => handleSelectConversation(c._id)}
                                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={displayImage} />
                                            <AvatarFallback>{fallbackText}</AvatarFallback>
                                        </Avatar>
                                        {isOnline && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950" />
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <div className="truncate text-base font-semibold mr-2">{displayName}</div>
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
                                            {isGroup && (
                                                <div className="text-[10px] text-zinc-500 font-medium shrink-0 ml-1">
                                                    {c.memberCount} members
                                                </div>
                                            )}
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
