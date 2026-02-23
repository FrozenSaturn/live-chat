"use client";

import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const tasks = useQuery(api.tasks.get);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="flex w-full items-center justify-between p-4 px-8 bg-white dark:bg-black border-b border-zinc-100 dark:border-white/10">
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

      <main className="flex flex-1 items-center justify-center p-8">
        <div className="flex w-full max-w-3xl flex-col items-center justify-between py-24 px-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5 sm:items-start shadow-sm">
          <div className="w-full flex flex-col gap-4 mb-8">
            <h2 className="text-xl font-semibold mb-2">Convex Tasks:</h2>
            {tasks === undefined ? (
              <p>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p>No tasks found.</p>
            ) : (
              <ul className="list-disc pl-5">
                {tasks.map((task, i) => (
                  <li key={i} className="mb-1">
                    {task.text} {task.isCompleted ? "✅" : "⏳"}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
            <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
              Welcome to your new app.
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              You are now signed in. Explore the documentation or start building your application by editing <code className="font-mono font-bold text-black dark:text-white">app/page.tsx</code>.
            </p>
          </div>

          <div className="flex flex-col gap-4 mt-12 text-base font-medium sm:flex-row">
            <a
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={16}
                height={16}
              />
              Deploy Now
            </a>
            <a
              className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
            >
              Documentation
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
