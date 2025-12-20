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
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      aria-label={text}
    >
      {letters.map((letter, index) => {
        const y = useTransform(
            scrollYProgress,
            [0, 1],
            letter === 'P' ? [0, -20] : [0, 0]
        );
        const opacity = useTransform(scrollYProgress, [0, 0.5, 0.7], [0, 0, 1]);

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
    </motion.div>
  );
}
