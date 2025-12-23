"use client";

import { useState, ReactNode, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureComparisonProps {
    leftContent: ReactNode | ((inset: number) => ReactNode);
    rightContent: ReactNode | ((inset: number) => ReactNode);
    leftBadge?: string;
    rightBadge?: string;
    className?: string;
}

export function FeatureComparison({
    leftContent,
    rightContent,
    leftBadge = "Static",
    rightBadge = "Dynamic",
    className,
}: FeatureComparisonProps) {
    const [inset, setInset] = useState<number>(50);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(10, Math.min(90, (x / rect.width) * 100)); // Allow wider range 10-90%
        setInset(percentage);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        handleMove(e.clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        handleMove(e.touches[0].clientX);
    };

    const stopDragging = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', stopDragging);
            window.addEventListener('touchend', stopDragging);
        } else {
            window.removeEventListener('mouseup', stopDragging);
            window.removeEventListener('touchend', stopDragging);
        }
        return () => {
            window.removeEventListener('mouseup', stopDragging);
            window.removeEventListener('touchend', stopDragging);
        };
    }, [isDragging]);

    return (
        <div className={cn("w-full h-full", className)}>
            <div
                ref={containerRef}
                className="relative w-full h-full min-h-[400px] flex overflow-hidden rounded-2xl border bg-background select-none"
                onMouseMove={onMouseMove}
                onTouchMove={onTouchMove}
            >
                {/* LEFT CONTENT */}
                <div
                    className="h-full relative overflow-hidden group/left"
                    style={{ width: `${inset}%` }}
                >
                    <div className="absolute top-4 left-4 z-20">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur whitespace-nowrap">{leftBadge}</Badge>
                    </div>
                    <div className="w-full h-full min-w-[300px]">
                        {typeof leftContent === 'function' ? leftContent(inset) : leftContent}
                    </div>
                </div>

                {/* HANDLE */}
                <div
                    className="absolute top-0 bottom-0 z-30 w-1 bg-border cursor-ew-resize hover:bg-primary transition-colors flex items-center justify-center -ml-[2px]"
                    style={{ left: `${inset}%` }}
                    onMouseDown={() => setIsDragging(true)}
                    onTouchStart={() => setIsDragging(true)}
                >
                    <div className="h-8 w-4 min-w-4 rounded-full bg-background border shadow-sm flex items-center justify-center hover:scale-110 transition-transform">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                    </div>
                </div>

                {/* RIGHT CONTENT */}
                <div
                    className="h-full flex-1 relative overflow-hidden group/right"
                >
                    <div className="absolute top-4 right-4 z-20">
                        <Badge variant="outline" className="bg-background/80 backdrop-blur whitespace-nowrap">{rightBadge}</Badge>
                    </div>
                    <div className="w-full h-full min-w-[300px]">
                        {typeof rightContent === 'function' ? rightContent(100 - inset) : rightContent}
                    </div>
                </div>
            </div>
        </div>
    );
}
