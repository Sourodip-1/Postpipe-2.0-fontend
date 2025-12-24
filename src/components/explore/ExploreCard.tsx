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
}

export function ExploreCard({ title, author, image, tags, className, onClick }: ExploreCardProps) {
    return (
        <Card onClick={onClick} className={cn("explore-card overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_20px_-4px_hsl(var(--primary)/0.4)] group cursor-pointer", className)}>
            <div className="aspect-video relative overflow-hidden bg-muted/50">
                {/* Helper for missing images */}
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20 text-4xl font-bold uppercase tracking-widest select-none">
                    {title.substring(0, 2)}
                </div>
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="flex gap-2">
                        {tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-background/80 backdrop-blur-sm">{tag}</Badge>
                        ))}
                    </div>
                </div>
            </div>
            <CardContent className="p-4">
                <h3 className="font-semibold text-lg leading-none tracking-tight mb-2 group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    A high-quality component for your next project.
                </p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={author.avatar} />
                        <AvatarFallback>{author.name.substring(0, 1)}</AvatarFallback>
                    </Avatar>
                    <span>{author.name}</span>
                </div>
                <span className="text-xs text-muted-foreground font-mono">Free</span>
            </CardFooter>
        </Card>
    )
}
