// src/lib/courses.ts
export type Course = {
    id: string;
    title: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    priceINR: number;
    duration: string;
    points: string[];
    description: string;
    previewPoster?: string; // replace with real poster later
    syllabus: { title: string; items: string[] }[];
    ogImage?: string;
};

export const courses: Course[] = [
    {
        id: "java-fundamentals",
        title: "Java Fundamentals",
        level: "Beginner",
        priceINR: 699,
        duration: "24 hrs",
        points: ["Syntax & OOP", "Collections & Generics", "Exception Handling"],
        description:
            "Start from zero and build solid Java foundations with hands-on exercises and interview-oriented notes.",
        syllabus: [
            { title: "Getting Started", items: ["JDK/JRE/JVM", "Hello World", "Data Types"] },
            { title: "OOP", items: ["Classes & Objects", "Inheritance", "Polymorphism"] },
            { title: "Core APIs", items: ["Collections", "Generics", "Exceptions"] },
        ],
        ogImage: "/og/java-fundamentals.png",

    },
    {
        id: "advanced-java",
        title: "Advanced Java Concepts",
        level: "Intermediate",
        priceINR: 999,
        duration: "32 hrs",
        points: ["JVM Deep Dive", "Streams & Concurrency", "JDBC & JPA"],
        description:
            "Go beyond basics: performance, memory model, streams, concurrency, and pro-level debugging.",
        syllabus: [
            { title: "JVM Deep Dive", items: ["Classloading", "JIT", "Memory model"] },
            { title: "Streams & Concurrency", items: ["Parallel streams", "CompletableFuture"] },
            { title: "Data", items: ["JDBC", "JPA basics", "Transactions"] },
        ],
        // ogImage: "/og/advanced-java.png"  // (add later when you have one)
    },
    {
        id: "java-for-web",
        title: "Java for Web Development",
        level: "Intermediate",
        priceINR: 1099,
        duration: "28 hrs",
        points: ["Spring Boot API", "REST & Security", "Deployments"],
        description:
            "Build REST APIs with Spring Boot, secure them, and ship to production the right way.",
        syllabus: [
            { title: "Spring Basics", items: ["Boot project", "Controllers", "DI & Config"] },
            { title: "Persistence", items: ["JPA Entities", "Repositories", "Validation"] },
            { title: "Security & Deploy", items: ["JWT", "CORS", "Docker & Cloud deploy"] },
        ],
        // ogImage: "/og/java-for-web.png"
    },
];

export const getCourses = () => courses;
export const getCourseById = (id: string) => courses.find(c => c.id === id);