import { useEffect } from "react";
import { Id, Doc } from "../convex/_generated/dataModel";

interface UseTypingProps {
    message: string;
    currentUser?: Doc<"users"> | null;
    conversationId: string;
    updateTyping: (args: { conversationId: Id<"conversations">; userId: Id<"users">; isTyping: boolean; }) => Promise<null>;
}

export function useTyping({ message, currentUser, conversationId, updateTyping }: UseTypingProps) {
    useEffect(() => {
        if (!message.trim() || !currentUser || !conversationId) return;

        const updateTypingStatus = async (isTyping: boolean) => {
            try {
                await updateTyping({
                    conversationId: conversationId as Id<"conversations">,
                    userId: currentUser._id,
                    isTyping,
                });
            } catch (error) {
                console.error("Error updating typing status:", error);
            }
        };

        updateTypingStatus(true);

        const timeoutId = setTimeout(() => {
            updateTypingStatus(false);
        }, 2000);

        return () => clearTimeout(timeoutId);
    }, [message, currentUser, conversationId, updateTyping]);
}
