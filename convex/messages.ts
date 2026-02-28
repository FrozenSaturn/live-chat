import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const timestamp = Date.now();

        // 1. Insert the message
        const messageId = await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: args.senderId,
            content: args.content,
            createdAt: timestamp,
            deleted: false,
            reactions: [],
        });

        // 2. Update the conversation with last message info
        await ctx.db.patch(args.conversationId, {
            lastMessage: args.content,
            lastMessageAt: timestamp,
        });

        return messageId;
    },
});

export const list = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        return await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                return {
                    ...msg,
                    senderName: sender?.name,
                };
            })
        );
    },
});
export const remove = mutation({
    args: {
        messageId: v.id("messages"),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error("Message not found");
        }

        const deletedContent = "This message was deleted";
        await ctx.db.patch(args.messageId, {
            content: deletedContent,
            deleted: true,
        });

        // Update conversation if this was the last message
        const conversation = await ctx.db.get(message.conversationId);
        if (conversation && conversation.lastMessage === message.content) {
            await ctx.db.patch(message.conversationId, {
                lastMessage: deletedContent,
            });
        }
    },
});

export const toggleReaction = mutation({
    args: {
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        const message = await ctx.db.get(args.messageId);
        if (!message) {
            throw new Error("Message not found");
        }

        const reactions = message.reactions || [];
        const existingReactionIndex = reactions.findIndex(
            (r) => r.emoji === args.emoji && r.userId === args.userId
        );

        if (existingReactionIndex !== -1) {
            reactions.splice(existingReactionIndex, 1);
        } else {
            reactions.push({
                emoji: args.emoji,
                userId: args.userId,
            });
        }

        await ctx.db.patch(args.messageId, {
            reactions,
        });
    },
});

