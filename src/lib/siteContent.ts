// src/lib/siteContent.ts

export const companyEmail = "hello@directplay.in";

/* ---------------- Careers (unchanged) ---------------- */
export const careersContent = {
    hiringOpen: false, // ← flip to false when paused
    notifyFormAction: "",
    intro:
        "We’re building the most effective way to learn Java for real interviews and real jobs. If that excites you, come help us ship.",
    roles: [
        {
            id: "frontend-engineer",
            title: "Frontend Engineer (React/Next.js)",
            location: "Remote (India)",
            type: "Full‑time",
            summary:
                "Own learner-facing experiences across course player, notes, and assessments.",
            responsibilities: [
                "Build polished, accessible UI with React/Next.js and Tailwind",
                "Collaborate with design to ship delightful product touches",
                "Instrument analytics and run quick experiments",
            ],
            requirements: [
                "2+ years with React (Next.js preferred)",
                "A strong eye for design and micro‑interactions",
                "Comfort with TypeScript and modern tooling",
            ],
            apply: { type: "email", to: companyEmail, subject: "Application: Frontend Engineer" },
        },
        {
            id: "java-instructor",
            title: "Java Instructor / Content Author",
            location: "Hybrid / Remote",
            type: "Contract or Part‑time",
            summary:
                "Create hands‑on lessons, annotated code, and interview‑ready projects.",
            responsibilities: [
                "Design lesson plans and practical coding projects",
                "Record clear, concise explanations with examples",
                "Write quizzes and recap notes",
            ],
            requirements: [
                "Strong Java + Spring ecosystem experience",
                "Ability to explain complex ideas simply",
                "Prior teaching/mentorship is a plus",
            ],
            apply: { type: "email", to: companyEmail, subject: "Application: Java Instructor" },
        },
    ],
};

/* ---------------- Legal (UPDATED: added refundPolicy) ---------------- */
export const legalContent = {
    terms: {
        updatedOn: "2025-08-01",
        sections: [
            {
                heading: "1. Agreement",
                body: [
                    "By accessing DirectPlay, you agree to these Terms. If you do not agree, please discontinue use.",
                ],
            },
            {
                heading: "2. License & Access",
                body: [
                    "Upon purchase, you receive a personal, non‑transferable license to access the course materials.",
                    "You may not share, resell, or publicly post the content.",
                ],
            },
            {
                heading: "3. Payments & Refunds",
                body: [
                    "Prices are listed in INR unless noted otherwise.",
                    "We offer a 7‑day refund guarantee for eligible purchases. Abuse of refunds may lead to account restrictions.",
                ],
            },
            {
                heading: "4. Acceptable Use",
                list: [
                    "No unauthorized copying, distribution, or derivative works.",
                    "No attempts to bypass DRM or platform security.",
                    "No harassment, hate speech, or abusive behavior in communities.",
                ],
            },
            {
                heading: "5. Changes",
                body: [
                    "We may update these Terms to reflect product, legal, or regulatory changes. We’ll post the updated date at the top of this page.",
                ],
            },
            {
                heading: "6. Contact",
                body: [
                    `Questions? Contact us at ${companyEmail}.`,
                ],
            },
        ],
    },

    privacy: {
        updatedOn: "2025-08-01",
        sections: [
            {
                heading: "1. Information We Collect",
                body: [
                    "Account info (name, email), usage analytics (events, pages), and payment metadata (handled by our payment processor).",
                ],
            },
            {
                heading: "2. How We Use Data",
                list: [
                    "To provide and improve learning features",
                    "To personalize content and recommendations",
                    "To communicate about updates and support",
                ],
            },
            {
                heading: "3. Cookies & Analytics",
                body: [
                    "We use analytics and cookies to understand usage and improve the experience.",
                ],
            },
            {
                heading: "4. Data Sharing",
                body: [
                    "We do not sell your personal data. Limited sharing with service providers occurs solely to operate the product (e.g., analytics, payments).",
                ],
            },
            {
                heading: "5. Your Choices",
                body: [
                    "You can request access, correction, or deletion of your data by contacting us.",
                ],
            },
            {
                heading: "6. Contact",
                body: [
                    `Privacy questions? Reach us at ${companyEmail}.`,
                ],
            },
        ],
    },

    refundPolicy: {
        updatedOn: "2025-08-01",
        sections: [
            {
                heading: "1. 7‑Day Guarantee",
                body: [
                    "We offer a 7‑day refund guarantee on one‑time purchases. If the course isn’t a good fit, contact us within 7 days of purchase.",
                ],
            },
            {
                heading: "2. Eligibility",
                list: [
                    "Request must be initiated within 7 calendar days from purchase.",
                    "Excessive content consumption or download attempts may void eligibility.",
                    "Abuse of the policy can lead to account restrictions.",
                ],
            },
            {
                heading: "3. How to Request",
                body: [
                    `Email ${companyEmail} with your order details and the reason for the refund. We usually respond within 2‑3 business days.`,
                ],
            },
            {
                heading: "4. Method of Refund",
                body: [
                    "Approved refunds are issued back to the original payment method. Processing times may vary by provider.",
                ],
            },
            {
                heading: "5. Updates",
                body: [
                    "We may adjust this policy to prevent fraud or to comply with regulations. The “Last updated” date will reflect changes.",
                ],
            },
        ],
    },
};

/* ---------------- About (NEW) ---------------- */
export const aboutContent = {
    hero: {
        title: "We’re obsessed with practical Java learning.",
        subtitle:
            "DirectPlay blends video, line‑by‑line notes, quizzes, and real projects so you learn faster and retain more.",
    },
    highlights: [
        { title: "Job‑ready focus", body: "Everything ties back to interviews and real product work." },
        { title: "Clarity first", body: "Short lessons, annotated code, and recaps—no fluff." },
        { title: "Community & support", body: "Mentor hours and learner forums keep you unblocked." },
    ],
    values: [
        { title: "Learner empathy", body: "We optimize for understanding and momentum." },
        { title: "Craft & polish", body: "We sweat the details so the experience feels effortless." },
        { title: "Bias for shipping", body: "Small, frequent improvements beat big, slow ones." },
    ],
    timeline: [
        { when: "2024", what: "Prototype with annotated code next to video." },
        { when: "2025", what: "Cohort pilots, interview prep packs, and projects." },
        { when: "Next", what: "Adaptive practice, deeper Spring & system design tracks." },
    ],
    team: [
        { name: "DirectPlay Team", role: "Engineering & Content", blurb: "We’re a small team that loves teaching and building." },
    ],
};

/* ---------------- Pricing (NEW) ---------------- */
export const pricingContent = {
    hero: {
        title: "Simple pricing, lifetime learning.",
        subtitle:
            "Start small or go all‑in. Every plan includes DRM‑protected video, notes, and updates.",
    },
    currency: "INR",
    tiers: [
        {
            id: "starter",
            name: "Starter",
            price: 699,
            period: "one‑time",
            badge: null,
            features: [
                "Java Fundamentals course",
                "Line‑by‑line notes",
                "Quizzes & recap sheets",
                "Lifetime access",
            ],
            cta: { label: "Get Starter", href: "/auth?view=signup" },
        },
        {
            id: "pro",
            name: "Pro",
            price: 999,
            period: "one‑time",
            badge: "Most popular",
            features: [
                "Everything in Starter",
                "Advanced Java Concepts",
                "Projects & mentor hours",
                "Interview prep pack",
            ],
            cta: { label: "Upgrade to Pro", href: "/auth?view=signup" },
        },
        {
            id: "lifetime",
            name: "Lifetime",
            price: 1499,
            period: "one‑time",
            badge: "Best value",
            features: [
                "All current & future courses",
                "All projects and updates",
                "Priority support",
                "Exclusive workshops",
            ],
            cta: { label: "Go Lifetime", href: "/auth?view=signup" },
        },
    ],
    faqs: [
        { q: "Is there a refund policy?", a: "Yes—7‑day refund guarantee on one‑time purchases." },
        { q: "Do I get lifetime access?", a: "Yes, all plans are one‑time payments with lifetime access." },
        { q: "Are videos downloadable?", a: "Playback is streaming‑only with DRM for enrolled users." },
    ],
};