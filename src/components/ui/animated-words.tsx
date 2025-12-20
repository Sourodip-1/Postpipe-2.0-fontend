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
        // Apply animation only to "Pipe"
        if (index < 4) {
          // Fade-in for "Post"
          const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
          return (
            <motion.span
              key={index}
              className="inline-block"
              style={{ opacity }}
            >
              {letter}
            </motion.span>
          );
        }

        // Staggered rise-up for "Pipe"
        const start = 0.1 * (index - 3);
        const end = 0.5 + 0.1 * (index - 4);
        const y = useTransform(scrollYProgress, [start, end], [30, 0]);
        const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);
        
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
