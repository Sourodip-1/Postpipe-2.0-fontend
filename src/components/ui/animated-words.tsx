"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedWordsProps {
  text: string;
  className?: string;
}

export function AnimatedWords({ text, className }: AnimatedWordsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const letters = text.split("");

  return (
    <div ref={ref} className={cn("inline-block", className)} aria-label={text}>
      {letters.map((letter, index) => {
        let y;
        let opacity;

        if (index < 4) {
          // Fade-in for "Post"
          opacity = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
          y = 0; // No vertical movement
        } else {
          // Staggered animation for each letter in "Pipe"
          const start = 0.1 + (index - 4) * 0.08; 
          const end = 0.5 + (index - 4) * 0.1;
          
          let yStart, yEnd;
          
          switch(index) {
            case 4: // P
              yStart = 80; yEnd = -10;
              break;
            case 5: // i
              yStart = 60; yEnd = 10;
              break;
            case 6: // p
              yStart = 60; yEnd = -20;
              break;
            case 7: // e
              yStart = 70; yEnd = -80;
              break;
            default:
              yStart = 0; yEnd = 0;
          }

          y = useTransform(scrollYProgress, [start, end], [yStart, yEnd]);
          opacity = useTransform(scrollYProgress, [start, end], [0.9, 1]);
        }
        
        return (
          <motion.span
            key={index}
            className="inline-block"
            style={{ y, opacity }}
          >
            {letter}
          </motion.span>
        );
      })}
    </div>
  );
}
