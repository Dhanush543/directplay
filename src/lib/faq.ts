// src/lib/faq.ts

export type FaqItem = {
    q: string;
    a: string;
    id: string; // 🔹 added for anchor linking
};

export const faqs: FaqItem[] = [
    {
        id: "downloadable",
        q: "Will videos be downloadable?",
        a: "No. Playback is secured and streaming-only for enrolled users.",
    },
    {
        id: "lifetime",
        q: "Do I get lifetime access?",
        a: "Yes—lifetime access with all future updates to purchased courses.",
    },
    {
        id: "refund",
        q: "Is there a refund policy?",
        a: "Yes, we offer a 7-day refund guarantee on all courses.",
    },
    {
        id: "projects",
        q: "Do courses include projects?",
        a: "Absolutely. Each path includes hands-on projects and checkpoint quizzes.",
    },
    {
        id: "support",
        q: "Do I get doubt support?",
        a: "Yes—weekly mentor hours and community discussion are included.",
    },
];