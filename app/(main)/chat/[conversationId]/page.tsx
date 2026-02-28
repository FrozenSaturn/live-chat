"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { useState, useEffect } from "react";
import { Send, Loader2, ArrowLeft, Trash2, AlertCircle, RefreshCw } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useScrollToBottom } from "../../../../hooks/useScrollToBottom";
import { useTyping } from "../../../../hooks/useTyping";
import { Skeleton } from "../../../../components/ui/skeleton";
import { ChatMessage } from "../../../../components/ChatMessage";

interface PendingMessage {
    id: string;
    content: string;
    status: 'sending' | 'error';
    createdAt: number;
}

export default function ChatPage() {
    const { conversationId } = useParams();
    const { user, isLoaded: isClerkLoaded } = useUser();
    const [message, setMessage] = useState("");
    const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);

    const currentUser = useQuery(
        api.users.current,
        isClerkLoaded && user ? { clerkId: user.id } : "skip"
    );

    const conversation = useQuery(
        api.conversations.get,
        conversationId ? { conversationId: conversationId as Id<"conversations">, currentUserId: currentUser?._id } : "skip"
    );

    const messages = useQuery(
        api.messages.list,
        conversationId ? { conversationId: conversationId as Id<"conversations"> } : "skip"
    );

    const sendMessage = useMutation(api.messages.send);
    const deleteMessage = useMutation(api.messages.remove);
    const toggleReaction = useMutation(api.messages.toggleReaction);
    const updateTyping = useMutation(api.conversations.updateTyping);
    const markAsRead = useMutation(api.conversations.markAsRead);

    const { scrollRef, showScrollButton, handleScroll, scrollToBottom } = useScrollToBottom(messages || []);

    // Mark as read logic
    useEffect(() => {
        if (conversationId && currentUser?._id && messages && messages.length > 0) {
            markAsRead({
                conversationId: conversationId as Id<"conversations">,
                userId: currentUser._id,
            });
        }
    }, [conversationId, currentUser?._id, messages, markAsRead]);

    useTyping({
        message,
        currentUser,
        conversationId: conversationId as string,
        updateTyping,
    });

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || !currentUser || !conversationId) return;

        try {
            const content = message.trim();
            setMessage("");

            const tempId = Math.random().toString(36).substring(7);
            const newPending: PendingMessage = {
                id: tempId,
                content,
                status: 'sending',
                createdAt: Date.now(),
            };

            setPendingMessages(prev => [...prev, newPending]);

            // Clear typing status immediately on send
            updateTyping({
                conversationId: conversationId as Id<"conversations">,
                userId: currentUser._id,
                isTyping: false,
            });

            try {
                await sendMessage({
                    conversationId: conversationId as Id<"conversations">,
                    senderId: currentUser._id,
                    content,
                });
                setPendingMessages(prev => prev.filter(m => m.id !== tempId));
                // Force scroll to bottom after sending
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            } catch (error) {
                console.error("Error sending message:", error);
                setPendingMessages(prev => prev.map(m =>
                    m.id === tempId ? { ...m, status: 'error' } : m
                ));
            }
        } catch (error) {
            console.error("Error in handleSend:", error);
        }
    };

    const handleRetry = async (pendingMsg: PendingMessage) => {
        if (!currentUser || !conversationId) return;

        setPendingMessages(prev => prev.map(m =>
            m.id === pendingMsg.id ? { ...m, status: 'sending' } : m
        ));

        try {
            await sendMessage({
                conversationId: conversationId as Id<"conversations">,
                senderId: currentUser._id,
                content: pendingMsg.content,
            });
            setPendingMessages(prev => prev.filter(m => m.id !== pendingMsg.id));
        } catch (error) {
            console.error("Error retrying message:", error);
            setPendingMessages(prev => prev.map(m =>
                m.id === pendingMsg.id ? { ...m, status: 'error' } : m
            ));
        }
    };

    if (!isClerkLoaded || currentUser === undefined || messages === undefined || conversation === undefined) {
        return (
            <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
                <header className="flex h-[68px] items-center border-b px-8 bg-white dark:bg-zinc-950 shrink-0">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                </header>
                <div className="flex-1 p-8 space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                            <Skeleton className={`h-12 w-[250px] rounded-2xl ${i % 2 === 0 ? "rounded-tr-none" : "rounded-tl-none"}`} />
                        </div>
                    ))}
                </div>
                <div className="p-4 border-t px-8">
                    <div className="flex gap-2 max-w-5xl mx-auto">
                        <Skeleton className="h-11 flex-1 rounded-md" />
                        <Skeleton className="h-11 w-11 rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (conversation === null) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-950">
                <AlertCircle className="h-12 w-12 text-zinc-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Conversation not found</h2>
                <p className="text-zinc-500 mb-6">This conversation might have been deleted or you don&apos;t have access to it.</p>
                <Link href="/">
                    <Button>Back to home</Button>
                </Link>
            </div>
        );
    }

    const isGroup = conversation?.isGroup;
    const otherUser = conversation?.otherUser;
    const isTyping = conversation?.isTyping;
    const displayName = isGroup ? conversation.name : otherUser?.name;
    const displayImage = isGroup ? undefined : otherUser?.image;
    const fallbackText = isGroup ? (conversation.name || "Group").charAt(0) : otherUser?.name?.charAt(0);
    const isOnline = !isGroup && otherUser?.isOnline;

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
            {/* Chat Header */}
            <header className="flex h-[68px] items-center justify-between border-b px-4 md:px-8 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/" className="md:hidden p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div className="relative">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={displayImage} />
                            <AvatarFallback>{fallbackText}</AvatarFallback>
                        </Avatar>
                        {isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold leading-tight">{displayName}</div>
                        <div className="text-xs text-zinc-500 min-h-[1rem]">
                            {isGroup ? (
                                <span>{conversation.memberCount} members</span>
                            ) : isTyping ? (
                                <span className="text-zinc-500 animate-pulse italic">typing...</span>
                            ) : isOnline ? (
                                <span className="text-green-500 font-medium text-[10px] uppercase tracking-wider">Online</span>
                            ) : (
                                <span className="text-[10px] uppercase tracking-wider">Offline</span>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 relative overflow-hidden">
                <ScrollArea
                    className="h-full bg-zinc-50/50 dark:bg-zinc-900/10"
                    onScrollCapture={handleScroll}
                >
                    <div className="p-4 px-8 flex flex-col justify-end min-h-full">
                        <div className="space-y-6 py-4">
                            {messages.map((msg, index) => {
                                const isMine = msg.senderId === currentUser?._id;
                                const prevMessage = index > 0 ? messages[index - 1] : null;
                                const isNewGroup = !prevMessage || prevMessage.senderId !== msg.senderId;

                                return (
                                    <ChatMessage
                                        key={msg._id}
                                        msg={msg}
                                        isMine={isMine}
                                        isNewGroup={isNewGroup}
                                        isGroupChat={isGroup}
                                        currentUserId={currentUser?._id}
                                        onToggleReaction={(messageId, userId, emoji) => toggleReaction({ messageId, userId, emoji })}
                                        onDeleteMessage={(messageId) => deleteMessage({ messageId })}
                                    />
                                );
                            })}

                            {pendingMessages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className="flex group items-end gap-2 flex-row-reverse mt-1"
                                >
                                    <div className="flex flex-col items-end max-w-[70%]">
                                        <div
                                            className={cn(
                                                "rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none",
                                                msg.status === 'sending' && "opacity-70",
                                                msg.status === 'error' && "border-2 border-red-500 bg-red-50 text-red-900 dark:bg-red-950/20 dark:text-red-400"
                                            )}
                                        >
                                            <div className="leading-relaxed">{msg.content}</div>
                                            <div className="text-[10px] mt-1.5 font-medium opacity-40 text-right">
                                                {msg.status === 'sending' ? "Sending..." : "Failed to send"}
                                            </div>
                                        </div>
                                    </div>

                                    {msg.status === 'error' && (
                                        <div className="flex items-center gap-1 mb-2">
                                            <button
                                                onClick={() => handleRetry(msg)}
                                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-red-500"
                                                title="Retry"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setPendingMessages(prev => prev.filter(pm => pm.id !== msg.id))}
                                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-400"
                                                title="Discard"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}

                                    {msg.status === 'sending' && (
                                        <div className="mb-2 px-2">
                                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {showScrollButton && (
                    <button
                        onClick={scrollToBottom}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full shadow-lg text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 hover:scale-105 active:scale-95 z-20"
                    >
                        New messages <Send className="h-3 w-3 rotate-90" />
                    </button>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white dark:bg-zinc-950 dark:border-white/10 px-8">
                <form onSubmit={handleSend} className="flex gap-2 max-w-5xl mx-auto">
                    <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-zinc-100 dark:bg-zinc-900 border-none focus-visible:ring-0 shadow-none h-11"
                    />
                    <Button type="submit" size="icon" className="h-11 w-11 shrink-0 rounded-full transition-all hover:scale-105" disabled={!message.trim()}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
