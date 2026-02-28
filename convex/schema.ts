import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        image: v.optional(v.string()),
        isOnline: v.boolean(),
    })
        .index("by_clerkId", ["clerkId"])
        .index("by_email", ["email"]),

    conversations: defineTable({
        isGroup: v.boolean(),
        name: v.optional(v.string()),
        lastMessage: v.optional(v.string()),
        lastMessageAt: v.optional(v.number()),
    }),

    conversationMembers: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        lastSeenMessageAt: v.optional(v.number()),
        typingUntil: v.optional(v.number()),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_user", ["userId"])
        .index("by_conversation_user", ["conversationId", "userId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        content: v.string(),
        createdAt: v.number(),
        deleted: v.boolean(),
        reactions: v.optional(v.array(v.object({
            emoji: v.string(),
            userId: v.id("users"),
        }))),
    }).index("by_conversation", ["conversationId"]),
});
