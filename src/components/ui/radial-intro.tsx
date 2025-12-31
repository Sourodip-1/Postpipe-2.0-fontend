"use client";
import * as React from 'react';
import {
    LayoutGroup,
    motion,
    useAnimate,
    delay,
    type Transition,
    type AnimationSequence,
} from 'motion/react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ComponentProps {
    orbitItems: OrbitItem[];
    stageSize?: number;
    imageSize?: number;
    className?: string;
}

export type OrbitItem = {
    id: number;
    name: string;
    src: string;
    href?: string;
    size?: number;
};

const transition: Transition = {
    delay: 0,
    stiffness: 300,
    damping: 35,
    type: 'spring',
    restSpeed: 0.01,
    restDelta: 0.01,
};

const spinConfig = {
    duration: 30,
    ease: 'linear' as const,
    repeat: Infinity,
};

const qsa = (root: Element, sel: string) =>
    Array.from(root.querySelectorAll(sel));

const angleOf = (el: Element) => Number((el as HTMLElement).dataset.angle || 0);

const armOfImg = (img: Element) =>
    (img as HTMLElement).closest('[data-arm]') as HTMLElement | null;

export const RadialIntro = ({
    orbitItems,
    stageSize = 320,
    imageSize = 60,
    className,
}: ComponentProps) => {
    const step = 360 / orbitItems.length;
    const [scope, animate] = useAnimate();

    React.useEffect(() => {
        const root = scope.current;
        if (!root) return;

        // get arm and image elements
        const arms = qsa(root, '[data-arm]');
        const imgs = qsa(root, '[data-arm-image]');
        const stops: Array<() => void> = [];

        // image lift-in
        delay(() => animate(imgs, { top: 0 }, transition), 250);

        // build sequence for orbit placement
        const orbitPlacementSequence: AnimationSequence = [
            ...arms.map((el): [Element, Record<string, any>, any] => [
                el,
                { rotate: angleOf(el) },
                { ...transition, at: 0 },
            ]),
            ...imgs.map((img): [Element, Record<string, any>, any] => [
                img,
                { rotate: -angleOf(armOfImg(img)!), opacity: 1 },
                { ...transition, at: 0 },
            ]),
        ];

        // play placement sequence
        delay(() => animate(orbitPlacementSequence), 700);

        // start continuous spin for arms and images
        delay(() => {
            // arms spin clockwise
            arms.forEach((el) => {
                const angle = angleOf(el);
                const ctrl = animate(el, { rotate: [angle, angle + 360] }, spinConfig);
                stops.push(() => ctrl.cancel());
            });

            // images counter-spin to stay upright
            imgs.forEach((img) => {
                const arm = armOfImg(img);
                const angle = arm ? angleOf(arm) : 0;
                const ctrl = animate(
                    img,
                    { rotate: [-angle, -angle - 360] },
                    spinConfig,
                );
                stops.push(() => ctrl.cancel());
            });
        }, 1300);

        return () => stops.forEach((stop) => stop());
    }, []);

    return (
        <LayoutGroup>
            <motion.div
                ref={scope}
                className={cn("relative overflow-visible mx-auto", className)}
                style={{ width: stageSize, height: stageSize }}
                initial={false}
            >
                {orbitItems.map((item, i) => (
                    <motion.div
                        key={item.id}
                        data-arm
                        className="will-change-transform absolute inset-0 pointer-events-none"
                        style={{ zIndex: orbitItems.length - i }}
                        data-angle={i * step}
                        layoutId={`arm-${item.id}`}
                    >
                        {item.href ? (
                            <Link href={item.href} target="_blank" rel="noopener noreferrer" className="pointer-events-auto">
                                <motion.img
                                    data-arm-image
                                    className="rounded-full object-cover absolute left-1/2 top-1/2 aspect-square translate -translate-x-1/2 border-2 border-primary/20 hover:border-primary transition-colors cursor-pointer"
                                    style={{
                                        width: item.size || imageSize,
                                        height: item.size || imageSize,
                                        opacity: i === 0 ? 1 : 0,
                                    }}
                                    src={item.src}
                                    alt={item.name}
                                    draggable={false}
                                    layoutId={`arm-img-${item.id}`}
                                    title={item.name}
                                />
                            </Link>
                        ) : (
                            <motion.img
                                data-arm-image
                                className="rounded-full object-cover absolute left-1/2 top-1/2 aspect-square translate -translate-x-1/2 border-2 border-primary/20 pointer-events-auto"
                                style={{
                                    width: item.size || imageSize,
                                    height: item.size || imageSize,
                                    opacity: i === 0 ? 1 : 0,
                                }}
                                src={item.src}
                                alt={item.name}
                                draggable={false}
                                layoutId={`arm-img-${item.id}`}
                                title={item.name}
                            />
                        )}

                    </motion.div>
                ))}
            </motion.div>
        </LayoutGroup>
    );
};
