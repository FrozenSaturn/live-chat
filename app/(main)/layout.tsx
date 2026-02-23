"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "../../components/Sidebar";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    // Check if we are in a chat route
    const isChatPage = pathname.includes("/chat/");

    return (
        <div className="flex h-screen bg-zinc-50 font-sans dark:bg-black overflow-hidden relative">
            {/* Sidebar: Show on desktop always, on mobile only if not on a chat page */}
            <div className={`${isChatPage ? "hidden md:flex" : "flex w-full md:w-80"} h-full shrink-0`}>
                <Sidebar className="w-full" />
            </div>

            {/* Main Content Area: Show on desktop always, on mobile only if on a chat page */}
            <div className={`${isChatPage ? "flex" : "hidden md:flex"} flex-1 flex-col overflow-hidden`}>
                {children}
            </div>
        </div>
    );
}
