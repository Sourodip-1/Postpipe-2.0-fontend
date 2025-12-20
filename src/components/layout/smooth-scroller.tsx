"use client";

import { useSmoothScroll } from "@/hooks/use-smooth-scroll";

export function SmoothScroller({ children }: { children: React.ReactNode }) {
  useSmoothScroll();
  
  return (
    <div id="smooth-wrapper">
      <div id="smooth-content">
        {children}
      </div>
    </div>
  );
}
