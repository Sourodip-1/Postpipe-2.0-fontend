"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"

import { Particles } from "@/components/ui/particles"
import { Button } from "../ui/button"
import { AnimatedButton } from "../ui/animated-button"
import { dotFlowItems } from "@/lib/dot-flow-data"
import { MagneticText } from "../ui/morphing-cursor"
import { WordRotate } from "../ui/word-rotate"

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
            <MagneticText text="PostPipe" hoverText="2.0" className="font-body text-8xl md:text-9xl lg:text-[10rem] font-black" />
            <div className="flex text-lg text-muted-foreground max-w-3xl">
              The largest Next.js backend component&nbsp;
              <WordRotate
                words={["library", "Scaffold", "CLIs", "loader", "boilerplate"]}
                className="text-lg text-muted-foreground"
              />
            </div>
            <div className="flex gap-4 items-center mt-4">
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
