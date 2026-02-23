import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreateConversation = mutation({
    args: {
        participantId: v.id("users"),
        currentUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // 1. Find all conversations for the current user
        const currentUserMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_user", (q) => q.eq("userId", args.currentUserId))
            .collect();

        // 2. Filter for existing one-on-one conversations with the participant
        for (const membership of currentUserMemberships) {
            const otherMember = await ctx.db
                .query("conversationMembers")
                .withIndex("by_conversation_user", (q) =>
                    q.eq("conversationId", membership.conversationId).eq("userId", args.participantId)
                )
                .first();

            if (otherMember) {
                // Check if it's actually a 1:1 (non-group) conversation
                const conversation = await ctx.db.get(membership.conversationId);
                if (conversation && !conversation.isGroup) {
                    return conversation._id;
                }
            }
        }

        // 3. If no existing conversation, create a new one
        const conversationId = await ctx.db.insert("conversations", {
            isGroup: false,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: args.currentUserId,
        });

        await ctx.db.insert("conversationMembers", {
            conversationId,
            userId: args.participantId,
        });

        return conversationId;
    },
});
