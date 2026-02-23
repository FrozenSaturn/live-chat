"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "../../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../components/ui/avatar";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";

function formatMessageTime(timestamp: number) {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const isSameYear = date.getFullYear() === now.getFullYear();
    if (isSameYear) {
        return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" });
}

export default function ChatPage() {
    const { conversationId } = useParams();
    const { user, isLoaded: isClerkLoaded } = useUser();
    const [message, setMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);

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
    const updateTyping = useMutation(api.conversations.updateTyping);
    const markAsRead = useMutation(api.conversations.markAsRead);

    // Mark as read logic
    useEffect(() => {
        if (conversationId && currentUser?._id && messages && messages.length > 0) {
            markAsRead({
                conversationId: conversationId as Id<"conversations">,
                userId: currentUser._id,
            });
        }
    }, [conversationId, currentUser?._id, messages, markAsRead]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim() || !currentUser || !conversationId) return;

        try {
            const content = message.trim();
            setMessage("");
            // Clear typing status immediately on send
            updateTyping({
                conversationId: conversationId as Id<"conversations">,
                userId: currentUser._id,
                isTyping: false,
            });
            await sendMessage({
                conversationId: conversationId as Id<"conversations">,
                senderId: currentUser._id,
                content,
            });
            // Force scroll to bottom after sending
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    // Typing logic
    useEffect(() => {
        if (!message.trim() || !currentUser || !conversationId) return;

        const updateTypingStatus = async (isTyping: boolean) => {
            await updateTyping({
                conversationId: conversationId as Id<"conversations">,
                userId: currentUser._id,
                isTyping,
            });
        };

        updateTypingStatus(true);

        const timeoutId = setTimeout(() => {
            updateTypingStatus(false);
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [message, currentUser, conversationId, updateTyping]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const bottomThreshold = 100;
        const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < bottomThreshold;

        setIsAtBottom(isBottom);
        if (isBottom) {
            setShowScrollButton(false);
        }
    };

    useEffect(() => {
        if (isAtBottom && scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        } else if (!isAtBottom && messages && messages.length > 0) {
            // If new message arrives and we're not at bottom, show button
            setShowScrollButton(true);
        }
    }, [messages, isAtBottom]);

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
        setIsAtBottom(true);
    };

    if (!isClerkLoaded || currentUser === undefined || messages === undefined || conversation === undefined) {
        return (
            <div className="flex flex-1 items-center justify-center bg-white dark:bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    const otherUser = conversation?.otherUser;
    const isTyping = conversation?.isTyping;

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
                            <AvatarImage src={otherUser?.image} />
                            <AvatarFallback>{otherUser?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {otherUser?.isOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold leading-tight">{otherUser?.name}</div>
                        <div className="text-xs text-zinc-500 min-h-[1rem]">
                            {isTyping ? (
                                <span className="text-zinc-500 animate-pulse italic">typing...</span>
                            ) : otherUser?.isOnline ? (
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
                                    <div
                                        key={msg._id}
                                        className={`flex ${isMine ? "justify-end" : "justify-start"} ${isNewGroup ? "mt-4" : "mt-1"}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${isMine
                                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none"
                                                : "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-white/5 rounded-tl-none"
                                                }`}
                                        >
                                            <div className="leading-relaxed">{msg.content}</div>
                                            <div
                                                className={`text-[10px] mt-1.5 font-medium opacity-40 ${isMine ? "text-right" : "text-left"
                                                    }`}
                                            >
                                                {formatMessageTime(msg.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
