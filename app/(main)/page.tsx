"use client";

import Image from "next/image";
import { UserButton } from "@clerk/nextjs";

export default function Home() {
    return (
        <>
            <header className="flex w-full items-center justify-between p-4 px-8 bg-white dark:bg-black border-b border-zinc-100 dark:border-white/10 shrink-0">
                <Image
                    className="dark:invert"
                    src="/next.svg"
                    alt="Next.js logo"
                    width={80}
                    height={16}
                    priority
                />
                <UserButton appearance={{ elements: { userButtonAvatarBox: "h-8 w-8" } }} />
            </header>

            <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="flex w-full max-w-3xl flex-col items-center justify-center py-24 px-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 text-center shadow-sm">
                    <div className="flex flex-col items-center gap-6">
                        <h1 className="text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
                            Select a chat to start messaging
                        </h1>
                        <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
                            All your conversations are synced across devices. Search for a contact or select an existing chat from the left sidebar.
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
