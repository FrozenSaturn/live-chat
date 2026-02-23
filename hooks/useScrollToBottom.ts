import { useState, useRef, useEffect, UIEvent } from "react";

export function useScrollToBottom<T>(dependency: T[]) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const previousLength = useRef(dependency?.length || 0);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const bottomThreshold = 100;
        const isBottom = target.scrollHeight - target.scrollTop - target.clientHeight < bottomThreshold;

        setIsAtBottom(isBottom);
        if (isBottom && showScrollButton) {
            setShowScrollButton(false);
        }
    };

    useEffect(() => {
        const currentLength = dependency?.length || 0;

        if (currentLength > previousLength.current) {
            // New items added
            if (isAtBottom && scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: "smooth" });
            } else if (!isAtBottom && !showScrollButton) {
                setTimeout(() => setShowScrollButton(true), 0);
            }
        } else if (isAtBottom && scrollRef.current) {
            // Just normal bottom scroll behavior
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }

        previousLength.current = currentLength;
    }, [dependency, isAtBottom, showScrollButton]);

    const scrollToBottom = () => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowScrollButton(false);
        setIsAtBottom(true);
    };

    return {
        scrollRef,
        showScrollButton,
        isAtBottom,
        handleScroll,
        scrollToBottom
    };
}
