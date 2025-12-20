"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useSmoothScroll() {
  useEffect(() => {
    const body = document.body;
    const wrapper = document.querySelector("#smooth-wrapper");

    if (!wrapper) return;

    let height: number;
    const setHeight = () => {
      height = wrapper.clientHeight;
      body.style.height = `${height}px`;
    };

    ScrollTrigger.addEventListener("refreshInit", setHeight);

    gsap.set(wrapper, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
    });

    const scrollTween = gsap.to(wrapper, {
      y: () => -(wrapper.clientHeight - window.innerHeight),
      ease: 'none',
      scrollTrigger: {
        trigger: body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });

    const resizeObserver = new ResizeObserver(() => {
      ScrollTrigger.refresh();
    });
    resizeObserver.observe(wrapper);

    // Cleanup function
    return () => {
      ScrollTrigger.removeEventListener("refreshInit", setHeight);
      resizeObserver.disconnect();
      scrollTween.kill();
      gsap.killTweensOf(wrapper);
      body.style.height = ''; 
    };
  }, []);
}
