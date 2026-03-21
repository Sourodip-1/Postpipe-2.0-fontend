"use client";

import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
    startOnLoad: true,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "Inter, sans-serif",
});

interface MermaidProps {
    chart: string;
}

export const Mermaid = ({ chart }: MermaidProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current) {
            mermaid.contentLoaded();
            // Re-render when chart changes
            mermaid.render(`mermaid-${Math.random().toString(36).substr(2, 9)}`, chart).then(({ svg }) => {
                if (ref.current) {
                    ref.current.innerHTML = svg;
                }
            });
        }
    }, [chart]);

    return (
        <div 
            ref={ref} 
            className="mermaid flex justify-center my-8 bg-white/5 p-6 rounded-xl border border-white/10"
        />
    );
};
