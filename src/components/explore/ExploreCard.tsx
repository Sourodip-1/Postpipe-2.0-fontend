"use client"

import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface ExploreCardProps {
    title: string
    author: {
        name: string
        avatar?: string
        handle?: string
    }
    image: string
    tags?: string[]
    className?: string
    onClick?: () => void
    imageClassName?: string
}

export function ExploreCard({ title, author, image, tags, className, onClick, imageClassName }: ExploreCardProps) {
    return (
        <Card onClick={onClick} className={cn("explore-card overflow-hidden rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-900 shadow-sm hover:border-primary/50 transition-all duration-300 hover:-translate-y-[2px] hover:shadow-md group cursor-pointer", className)}>
            <div className={cn("aspect-video relative overflow-hidden bg-muted/50", imageClassName)}>
                {/* Free Badge Overlay */}
                <div className="absolute top-3 right-3 z-10 transform-gpu">
                    <Badge variant="secondary" className="bg-white dark:bg-black/80 hover:bg-white dark:hover:bg-black/90 text-neutral-900 dark:text-white border border-neutral-200/50 dark:border-white/10 shadow-sm text-[10px] px-2 h-5">Free</Badge>
                </div>

                {/* Helper for missing images */}
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 text-4xl font-bold uppercase tracking-widest select-none">
                    {title.substring(0, 2)}
                </div>
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient Overlay for Tags */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4 transform-gpu">
                    <div className="flex gap-2">
                        {tags?.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-black/40 border-white/20 text-white text-[10px] h-5">{tag}</Badge>
                        ))}
                    </div>
                </div>
            </div>

            <CardContent className="p-4 pb-3">
                <h3 className="font-semibold text-lg leading-tight tracking-tight group-hover:text-primary transition-colors">{title}</h3>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-5 w-5 border border-neutral-200 dark:border-white/10">
                        <AvatarImage
                            src={author.avatar}
                            className={cn(author.name === "PostPipe" && "invert dark:invert-0")}
                        />
                        <AvatarFallback className="text-[10px]">{author.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-xs">{author.name}</span>
                </div>
            </CardFooter>
        </Card>
    )
}
