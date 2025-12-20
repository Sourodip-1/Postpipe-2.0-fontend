"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { Particles } from "@/components/ui/particles"
import { Button } from "../ui/button"
import { AnimatedButton } from "../ui/animated-button"
// import { DotFlow } from "../ui/dot-flow"
import { dotFlowItems } from "@/lib/dot-flow-data"

export function HeroParticles() {
  const { theme, systemTheme } = useTheme()
  const [color, setColor] = useState("#ffffff")

  useEffect(() => {
    const currentTheme = theme === "system" ? systemTheme : theme
    setColor(currentTheme === "dark" ? "#ffffff" : "#9D4EDD")
  }, [theme, systemTheme])


  return (
    <div className="relative flex h-[70vh] min-h-[500px] w-full flex-col items-center justify-center overflow-hidden">
        <div className="z-10 flex flex-col items-center text-center gap-6 px-4">
             <h1 className="font-headline text-4xl font-bold md:text-6xl lg:text-7xl pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
              Build & Automate with PostPipe Pro
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              From static forms to agentic AI-powered workflows, PostPipe Pro is the
              all-in-one platform for modern developers and creators.
            </p>
            <div className="flex gap-4 items-center">
              <AnimatedButton>Get Started</AnimatedButton>
              <Button asChild variant="outline" className="h-auto bg-black border-zinc-800 text-white hover:bg-white hover:text-black px-8 py-[18.5px] text-sm uppercase font-black">
                <Link href="#features">Learn More</Link>
              </Button>
            </div>
        </div>
      <Particles
        className="absolute inset-0 -z-10"
        quantity={200}
        ease={80}
        color={color}
        refresh
      />
    </div>
  )
}
