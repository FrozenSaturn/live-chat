import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const syncUser = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                name: args.name,
                email: args.email,
                image: args.image,
                isOnline: true,
            });
            return existingUser._id;
        }

        return await ctx.db.insert("users", {
            clerkId: args.clerkId,
            name: args.name,
            email: args.email,
            image: args.image,
            isOnline: true,
        });
    },
});

export const updateStatus = mutation({
    args: {
        clerkId: v.string(),
        isOnline: v.boolean(),
    },
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                isOnline: args.isOnline,
            });
        }
    },
});

export const listAll = query({
    args: {
        excludeClerkId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .filter((q) => q.neq(q.field("clerkId"), args.excludeClerkId))
            .collect();
    },
});

export const current = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .first();
    },
});
