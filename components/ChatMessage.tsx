import { Id } from "../convex/_generated/dataModel";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { formatTimestamp } from "@/lib/utils";
import { useState } from "react";

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢"];

interface ChatMessageProps {
    msg: {
        _id: Id<"messages">;
        _creationTime: number;
        conversationId: Id<"conversations">;
        senderId: Id<"users">;
        content: string;
        createdAt: number;
        deleted: boolean;
        isEdited?: boolean;
        reactions?: { emoji: string; userId: Id<"users"> }[];
        senderName?: string;
    };
    isMine: boolean;
    isNewGroup: boolean;
    isGroupChat?: boolean;
    currentUserId?: string;
    onToggleReaction: (messageId: Id<"messages">, userId: Id<"users">, emoji: string) => void;
    onDeleteMessage: (messageId: Id<"messages">) => void;
    onEditMessage?: (messageId: Id<"messages">, content: string) => void;
}

export function ChatMessage({ msg, isMine, isNewGroup, isGroupChat, currentUserId, onToggleReaction, onDeleteMessage, onEditMessage }: ChatMessageProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(msg.content);
    const reactions = msg.reactions || [];
    const reactionCounts = reactions.reduce((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasReacted: false };
        acc[r.emoji].count += 1;
        if (r.userId === currentUserId) acc[r.emoji].hasReacted = true;
        return acc;
    }, {} as Record<string, { count: number, hasReacted: boolean }>);

    const handleSaveEdit = () => {
        if (editContent.trim() && editContent !== msg.content) {
            onEditMessage?.(msg._id, editContent.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditContent(msg.content);
        setIsEditing(false);
    };

    return (
        <div
            className={`flex group items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} ${isNewGroup ? "mt-4" : "mt-1"}`}
        >
            <div className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[70%]`}>
                {!isMine && isNewGroup && isGroupChat && msg.senderName && (
                    <div className="text-xs font-medium text-zinc-500 mb-1 ml-1">{msg.senderName}</div>
                )}
                <div
                    className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all ${isMine
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-tr-none"
                        : "bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-100 dark:border-white/5 rounded-tl-none"
                        } ${msg.deleted ? "opacity-50 italic" : ""}`}
                >
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="bg-transparent border-b border-white/50 dark:border-zinc-900/50 outline-none px-1 py-0.5 text-sm min-w-[200px]"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveEdit();
                                    if (e.key === "Escape") handleCancelEdit();
                                }}
                            />
                            <button onClick={handleSaveEdit} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <Check className="h-4 w-4" />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    )}
                    <div
                        className={`text-[10px] mt-1.5 font-medium opacity-40 flex items-center gap-1 ${isMine ? "justify-end" : "justify-start"}`}
                    >
                        {formatTimestamp(msg.createdAt)}
                        {msg.isEdited && !msg.deleted && <span className="italic">(edited)</span>}
                    </div>
                </div>

                {Object.keys(reactionCounts).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                        {Object.entries(reactionCounts).map(([emoji, data]) => (
                            <button
                                key={emoji}
                                onClick={() => onToggleReaction(msg._id, currentUserId as Id<"users">, emoji)}
                                className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${data.hasReacted ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-900/20" : "border-black/5 dark:border-white/10"
                                    }`}
                            >
                                <span>{emoji}</span>
                                <span className={data.hasReacted ? "text-blue-600 dark:text-blue-400 font-medium" : "text-zinc-500"}>{data.count}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {!msg.deleted && (
                <div className={`opacity-0 group-hover:opacity-100 transition-all flex items-center ${isMine ? "flex-row-reverse" : "flex-row"} mb-2`}>
                    <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/10 shadow-sm rounded-full px-1 py-0.5">
                        {EMOJI_OPTIONS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => onToggleReaction(msg._id, currentUserId as Id<"users">, emoji)}
                                className="hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full w-7 h-7 flex items-center justify-center transition-colors text-sm"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    {isMine && !isEditing && (
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 ml-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-400 hover:text-blue-500"
                                title="Edit message"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => onDeleteMessage(msg._id)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all text-zinc-400 hover:text-red-500"
                                title="Delete message"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
