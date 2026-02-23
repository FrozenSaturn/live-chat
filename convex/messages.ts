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
        return await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .collect();
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

