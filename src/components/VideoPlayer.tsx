//src/components/VideoPlayer.tsx
"use client";

import { useRef, useEffect } from "react";

type Props = {
    src: string;
    poster?: string;
    onProgressSeconds?: (seconds: number) => void;
};

export default function VideoPlayer({ src, poster, onProgressSeconds }: Props) {
    const ref = useRef<HTMLVideoElement | null>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el || !onProgressSeconds) return;
        const onTime = () => onProgressSeconds(Math.floor(el.currentTime || 0));
        el.addEventListener("timeupdate", onTime);
        return () => el.removeEventListener("timeupdate", onTime);
    }, [onProgressSeconds]);

    return (
        <video
            ref={ref}
            src={src}
            poster={poster}
            className="w-full aspect-video rounded-xl bg-black"
            controls
            playsInline
        />
    );
}