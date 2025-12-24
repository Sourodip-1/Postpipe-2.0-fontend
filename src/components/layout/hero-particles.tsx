"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

import { Particles } from "@/components/ui/particles"
import { AnimatedButton } from "../ui/animated-button"
import { MagneticText } from "../ui/morphing-cursor"
import { WordRotate } from "../ui/word-rotate"
import { CreditCard } from "lucide-react"

export function HeroParticles() {
  const { theme, systemTheme } = useTheme()
  const [color, setColor] = useState("#ffffff")
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const currentTheme = theme === "system" ? systemTheme : theme
    setColor(currentTheme === "dark" ? "#ffffff" : "#000000")
  }, [theme, systemTheme])


  return (
    <div className="relative flex h-[100vh] min-h-[500px] w-full flex-col items-center justify-center overflow-hidden">
      <div className="z-10 flex flex-col items-center text-center gap-6 px-4">
        <MagneticText text="PostPipe" hoverText="Pro!" className="font-body text-8xl md:text-9xl lg:text-[10rem] font-black" />
        <div className="flex text-lg text-muted-foreground max-w-3xl items-center justify-center">
          <span>The largest Next.js backend component</span>
          <WordRotate
            words={["library", "Scaffold", "CLIs", "loader", "boilerplate"]}
            className="text-lg text-foreground dark:text-white ml-2"
          />
        </div>
        <div className="flex gap-4 items-center mt-4">
          <div onClick={() => router.push(isAuthenticated ? "/dashboard/workflows" : "/login")} className="cursor-pointer">
            <AnimatedButton>Get Started</AnimatedButton>
          </div>
          <Link href="#features">
            <button className="btn-31 h-[56px] px-8 flex items-center justify-center bg-zinc-950 border border-zinc-800 text-white font-black uppercase tracking-wider gap-2 cursor-pointer shadow-lg relative overflow-hidden transition-all duration-300">
              <span className="text-wrapper">Learn More</span>
            </button>
          </Link>
        </div>
      </div>
      <Particles
        className="absolute inset-0 -z-10"
        quantity={280}
        size={0.8}
        staticity={30}
        ease={50}
        color={color}
        refresh
      />
    </div>
  )
}
