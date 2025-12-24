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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="bg-card/50">
                <CardHeader className="flex flex-row items-center gap-4">
                  {feature.icon}
                  <CardTitle className="font-headline text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}