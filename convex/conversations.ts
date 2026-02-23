import { mutation, query } from "./_generated/server";
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

export const list = query({
    args: {
        currentUserId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const currentUserId = args.currentUserId;
        if (!currentUserId) return [];

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_user", (q) => q.eq("userId", currentUserId))
            .collect();

        const conversations = await Promise.all(
            memberships.map(async (membership) => {
                const conversation = await ctx.db.get(membership.conversationId);
                if (!conversation) return null;

                let otherUser = null;

                if (!conversation.isGroup) {
                    const otherMember = await ctx.db
                        .query("conversationMembers")
                        .withIndex("by_conversation", (q) => q.eq("conversationId", membership.conversationId))
                        .filter((q) => q.neq(q.field("userId"), currentUserId))
                        .first();

                    if (otherMember) {
                        otherUser = await ctx.db.get(otherMember.userId);
                    }
                }

                const unreadMessages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) => q.eq("conversationId", membership.conversationId))
                    .filter((q) => q.gt(q.field("createdAt"), membership.lastSeenMessageAt || 0))
                    .collect();

                return {
                    _id: conversation._id,
                    isGroup: conversation.isGroup,
                    lastMessage: conversation.lastMessage,
                    lastMessageAt: conversation.lastMessageAt || 0,
                    otherUser,
                    unreadCount: unreadMessages.length,
                };
            })
        );

        return conversations
            .filter((c) => c !== null)
            .sort((a, b) => b!.lastMessageAt - a!.lastMessageAt);
    },
});

export const get = query({
    args: {
        conversationId: v.id("conversations"),
        currentUserId: v.optional(v.id("users")),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return null;

        let otherUser = null;
        let isTyping = false;

        if (args.currentUserId && !conversation.isGroup) {
            const otherMember = await ctx.db
                .query("conversationMembers")
                .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
                .filter((q) => q.neq(q.field("userId"), args.currentUserId))
                .first();

            if (otherMember) {
                otherUser = await ctx.db.get(otherMember.userId);
                isTyping = (otherMember.typingUntil || 0) > Date.now();
            }
        }

        return {
            ...conversation,
            otherUser,
            isTyping,
        };
    },
});

export const updateTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation_user", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", args.userId)
            )
            .unique();

        if (membership) {
            await ctx.db.patch(membership._id, {
                typingUntil: args.isTyping ? Date.now() + 2000 : 0,
            });
        }
    },
});

export const markAsRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const membership = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversation_user", (q) =>
                q.eq("conversationId", args.conversationId).eq("userId", args.userId)
            )
            .unique();

        if (membership) {
            await ctx.db.patch(membership._id, {
                lastSeenMessageAt: Date.now(),
            });
        }
    },
});
