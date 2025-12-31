import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Code,
  Combine,
  Rocket,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { HeroParticles } from '@/components/layout/hero-particles';
import { cn } from '@/lib/utils';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { RadialIntro } from '@/components/ui/radial-intro';

const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-image');

const features = [
  {
    icon: <Palette className="size-8 text-primary" />,
    title: 'Visual Form Builder',
    description: 'Create and customize static forms with ease. No coding required until you want to.',
  },
  {
    icon: <Combine className="size-8 text-primary" />,
    title: 'Workflow Templates',
    description: 'Jumpstart your projects with a marketplace of dynamic, ready-to-use workflow templates.',
  },
  {
    icon: <Rocket className="size-8 text-primary" />,
    title: 'Agentic AI',
    description: 'Use pre-formatted AI prompts to generate frontends and accelerate your development.',
  },
  {
    icon: <Code className="size-8 text-primary" />,
    title: 'Embed Anywhere',
    description: 'Generate simple HTML/JS snippets to embed your forms on any website or platform.',
  },
  {
    icon: <ShieldCheck className="size-8 text-primary" />,
    title: 'Centralized Auth',
    description: 'Secure authentication across all your PostPipe services for a seamless user experience.',
  },
];

export const metadata: Metadata = {
  title: 'Home',
};

export default function Home() {
  return (
    <>
      <section
        id="hero"
        className="relative"
      >
        <HeroParticles />
      </section>

      <section id="features" className="bg-background-muted py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-headline text-4xl font-bold">
              Everything You Need to Build Faster
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-lg text-muted-foreground">
              PostPipe Pro provides the tools to streamline your development
              process from end to end.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-4 lg:grid-cols-12 xl:max-h-[34rem] xl:grid-rows-2">
            <GridItem
              area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
              icon={<Palette className="h-4 w-4 text-black dark:text-neutral-400" />}
              title="Visual Form Builder"
              description="Create and customize static forms with ease. No coding required until you want to."
            />
            <GridItem
              area="md:[grid-area:1/7/2/13] xl:[grid-area:1/5/3/8]"
              icon={<Combine className="h-4 w-4 text-black dark:text-neutral-400" />}
              title="Workflow Templates"
              description="Jumpstart your projects with a marketplace of dynamic, ready-to-use workflow templates."
            />
            <GridItem
              area="md:[grid-area:2/1/3/7] xl:[grid-area:1/8/2/13]"
              icon={<Rocket className="h-4 w-4 text-black dark:text-neutral-400" />}
              title="Agentic AI"
              description="Use pre-formatted AI prompts to generate frontends and accelerate your development."
            />
            <GridItem
              area="md:[grid-area:2/7/3/13] xl:[grid-area:2/1/3/5]"
              icon={<Code className="h-4 w-4 text-black dark:text-neutral-400" />}
              title="Embed Anywhere"
              description="Generate simple HTML/JS snippets to embed your forms on any website or platform."
            />
            <GridItem
              area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
              icon={<ShieldCheck className="h-4 w-4 text-black dark:text-neutral-400" />}
              title="Centralized Auth"
              description="Secure authentication across all your PostPipe services for a seamless user experience."
            />
          </div>
        </div>
      </section>

      <section id="makers" className="py-20 md:py-32 overflow-hidden bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Side: Content & Terminal */}
            <div className="flex flex-col gap-8 text-left">
              <div>
                <h2 className="font-headline text-3xl font-bold mb-4">
                  Meet the Makers
                </h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  Built by developers, for developers. We are passionate about open source and creating tools that empower the community.
                </p>
              </div>

              {/* Terminal Card */}
              <div className="relative w-full max-w-md aspect-video rounded-xl border bg-black/90 shadow-2xl overflow-hidden flex flex-col">
                {/* Terminal Header */}
                <div className="flex items-center px-4 py-2 border-b border-white/10 bg-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="ml-4 text-xs text-white/40 font-mono">buffer — bash</div>
                </div>
                {/* Terminal Content */}
                <div className="p-4 font-mono text-sm text-green-400 space-y-2">
                  <div className="flex">
                    <span className="text-blue-400 mr-2">~</span>
                    <span className="text-white">$ git log --oneline</span>
                  </div>
                  <div className="text-white/70 pl-4 space-y-1">
                    <p><span className="text-yellow-500">a1b2c3d</span> Initial commit</p>
                    <p><span className="text-yellow-500">e5f6g7h</span> Added zero-trust connector</p>
                    <p><span className="text-yellow-500">i8j9k0l</span> Sent to production 🚀</p>
                  </div>
                  <div className="flex mt-2">
                    <span className="text-blue-400 mr-2">~</span>
                    <span className="text-white animate-pulse">_</span>
                  </div>
                </div>

                {/* Decorative Gradient Blob */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
              </div>
            </div>

            {/* Right Side: Radial Intro */}
            <div className="flex justify-center lg:justify-end w-full">
              <RadialIntro
                orbitItems={[
                  { id: 1, name: 'Sourodip-1', src: 'https://github.com/Sourodip-1.png', href: 'https://github.com/Sourodip-1', size: 120 },
                  { id: 2, name: 'yo-soyam', src: 'https://github.com/yo-soyam.png', href: 'https://github.com/yo-soyam', size: 110 },
                  { id: 3, name: 'souvikvos', src: 'https://github.com/souvikvos.png', href: 'https://github.com/souvikvos', size: 110 },
                ]}
                stageSize={400}
                imageSize={70}
                className="mx-0"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <div className={cn("min-h-[14rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <h2 className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};