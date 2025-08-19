//src/components/LessonOpenButton.tsx
"use client";

export default function LessonOpenButton({ index }: { index: number }) {
    return (
        <button
            type="button"
            className="text-sm text-indigo-600 hover:text-indigo-700"
            onClick={() => {
                if (typeof window !== "undefined") {
                    window.location.hash = `lesson-${index}`;
                }
            }}
        >
            Open
        </button>
    );
}