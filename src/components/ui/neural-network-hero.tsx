'use client';

import { useRef } from 'react';
import Image from "next/image";
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ShaderBackground } from "@/components/ui/shader-background";

// Register plugins
if (typeof window !== "undefined") {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
    try {
        gsap.registerPlugin(SplitText);
    } catch (e) {
        console.warn("GSAP SplitText not found, animations might be simplified.");
    }
}

// ===================== HERO =====================
interface HeroProps {
    title: string;
    description: string;
    badgeText?: string;
    badgeLabel?: string;
    ctaButtons?: Array<{ text: string; href: string; primary?: boolean }>;
    microDetails?: Array<string>;
    showBackground?: boolean;
}

export default function NeuralNetworkHero({
    title,
    description,
    badgeText = "Generative Surfaces",
    badgeLabel = "New",
    ctaButtons = [
        { text: "Get started", href: "#get-started", primary: true },
        { text: "View showcase", href: "#showcase" }
    ],
    microDetails = ["Low‑weight font", "Tight tracking", "Subtle motion"],
    showBackground = true
}: HeroProps) {
    const sectionRef = useRef<HTMLElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null); // New ref for text container
    const headerRef = useRef<HTMLHeadingElement | null>(null);
    const paraRef = useRef<HTMLParagraphElement | null>(null);
    const ctaRef = useRef<HTMLDivElement | null>(null);
    const badgeRef = useRef<HTMLDivElement | null>(null);
    const microRef = useRef<HTMLUListElement | null>(null);
    const microItem1Ref = useRef<HTMLLIElement | null>(null);
    const microItem2Ref = useRef<HTMLLIElement | null>(null);
    const microItem3Ref = useRef<HTMLLIElement | null>(null);

    useGSAP(
        () => {
            // Scroll Animation
            // Scroll Animation
            // Scroll Animation (Manual implementation to verify fix)
            const handleScroll = (e: Event) => {
                if (!contentRef.current) return;

                const target = e.target as HTMLElement;
                const scrollTop = target.scrollTop || window.scrollY;
                const maxScroll = 300; // Fade out over 300px

                // Calculate opacity and scale based on scroll
                const progress = Math.min(scrollTop / maxScroll, 1);
                const opacity = 1 - progress;
                const scale = 1 - (progress * 0.05); // slightly scale down to 0.95
                const y = -(progress * 50); // move up by 50px

                // Apply direct optimizations
                contentRef.current.style.opacity = opacity.toString();
                contentRef.current.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
                contentRef.current.style.pointerEvents = opacity <= 0.1 ? 'none' : 'auto';
            };

            // Attach listener
            const scroller = document.querySelector(".docs-scroller") || window;
            scroller.addEventListener("scroll", handleScroll);

            // Cleanup
            return () => {
                scroller.removeEventListener("scroll", handleScroll);
            };

            if (!headerRef.current) return;

            document.fonts.ready.then(() => {
                let split;
                try {
                    split = new SplitText(headerRef.current!, {
                        type: 'lines',
                        wordsClass: 'lines',
                    });
                } catch (e) {
                    console.warn("SplitText failed or not available", e);
                    return;
                }

                gsap.set(split.lines, {
                    filter: 'blur(16px)',
                    yPercent: 30,
                    autoAlpha: 0,
                    scale: 1.06,
                    transformOrigin: '50% 100%',
                });

                if (badgeRef.current) {
                    gsap.set(badgeRef.current, { autoAlpha: 0, y: -8 });
                }
                if (paraRef.current) {
                    gsap.set(paraRef.current, { autoAlpha: 0, y: 8 });
                }
                if (ctaRef.current) {
                    gsap.set(ctaRef.current, { autoAlpha: 0, y: 8 });
                }
                const microItems = [microItem1Ref.current, microItem2Ref.current, microItem3Ref.current].filter(Boolean);
                if (microItems.length > 0) {
                    gsap.set(microItems, { autoAlpha: 0, y: 6 });
                }

                const tl = gsap.timeline({
                    defaults: { ease: 'power3.out' },
                });

                if (badgeRef.current) {
                    tl.to(badgeRef.current, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.0);
                }

                tl.to(
                    split.lines,
                    {
                        filter: 'blur(0px)',
                        yPercent: 0,
                        autoAlpha: 1,
                        scale: 1,
                        duration: 0.9,
                        stagger: 0.15,
                    },
                    0.1,
                );

                if (paraRef.current) {
                    tl.to(paraRef.current, { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.55');
                }
                if (ctaRef.current) {
                    tl.to(ctaRef.current, { autoAlpha: 1, y: 0, duration: 0.5 }, '-=0.35');
                }
                if (microItems.length > 0) {
                    tl.to(microItems, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 }, '-=0.25');
                }
            });
        },
        { scope: sectionRef },
    );

    return (
        <section ref={sectionRef} className="relative h-screen w-full overflow-hidden">
            {showBackground && <ShaderBackground />}

            <div className="relative mx-auto flex max-w-7xl flex-col md:flex-row items-center justify-between gap-12 px-6 pb-24 pt-10 sm:pt-16 md:px-10 lg:px-16 pointer-events-none w-full">

                {/* Left Content */}
                <div ref={contentRef} className="flex flex-col items-start gap-6 w-full md:w-1/2">
                    <div ref={badgeRef} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-sm pointer-events-auto">
                        <span className="text-[10px] font-light uppercase tracking-[0.08em] text-white/70">{badgeLabel}</span>
                        <span className="h-1 w-1 rounded-full bg-white/40" />
                        <span className="text-xs font-light tracking-tight text-white/80">{badgeText}</span>
                    </div>

                    <h1 ref={headerRef} className="max-w-2xl text-left text-5xl font-extralight leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl pointer-events-auto">
                        {title}
                    </h1>

                    <p ref={paraRef} className="max-w-xl text-left text-base font-light leading-relaxed tracking-tight text-white/75 sm:text-lg pointer-events-auto">
                        {description}
                    </p>

                    <div ref={ctaRef} className="flex flex-wrap items-center gap-3 pt-2 pointer-events-auto">
                        {ctaButtons.map((button, index) => (
                            <a
                                key={index}
                                href={button.href}
                                className={`rounded-2xl border border-white/10 px-5 py-3 text-sm font-light tracking-tight transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 duration-300 ${button.primary
                                    ? "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                                    : "text-white/80 hover:bg-white/5"
                                    }`}
                            >
                                {button.text}
                            </a>
                        ))}
                    </div>

                    <ul ref={microRef} className="mt-8 flex flex-wrap gap-6 text-xs font-extralight tracking-tight text-white/60 pointer-events-auto">
                        {microDetails.map((detail, index) => {
                            const refMap = [microItem1Ref, microItem2Ref, microItem3Ref];
                            return (
                                <li key={index} ref={refMap[index]} className="flex items-center gap-2">
                                    <span className="h-1 w-1 rounded-full bg-white/40" /> {detail}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Right Content - Logo */}
                <div className="w-full md:w-1/2 flex justify-center md:justify-end pointer-events-auto">
                    <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px] opacity-90 hover:opacity-100 transition-opacity duration-500">
                        <Image
                            src="/postpipe-imaginecup.svg"
                            alt="PostPipe Imagine Cup"
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

            </div>
        </section>
    );
}
