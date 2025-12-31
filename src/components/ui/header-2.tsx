'use client';
import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useScroll } from '@/hooks/use-scroll';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { AuthButton } from '../layout/auth-button';
import { Logo } from '../icons/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';


export function Header2() {
	const scrolled = useScroll(10);
	const pathname = usePathname();
	const isExplore = pathname?.startsWith("/explore");

	const links = [
		{ href: "/explore", label: "Dynamic" },
		{ href: "/static", label: "Static" },
		{ href: "/dashboard/workflows", label: "Workflows" },
		{ href: "/docs", label: "Docs" },
	];

	return (
		<header
			className={cn(
				'sticky top-0 z-50 w-full transition-all ease-out',
				scrolled && "md:top-4"
			)}
		>
			<div
				className={cn(
					"mx-auto flex h-16 max-w-full items-center justify-between border-b bg-background px-4 transition-all duration-300 ease-out",
					scrolled && "h-14 max-w-5xl rounded-lg border bg-background/95 shadow-md backdrop-blur-sm supports-[backdrop-filter]:bg-background/60"
				)}
			>
				<Link href="/" className="flex items-center gap-2">
					<div className="relative h-8 w-40">
						<Image src="/PostPipe-Black.svg" alt="PostPipe" fill className="dark:hidden object-contain object-left" />
						<Image src="/PostPipe.svg" alt="PostPipe" fill className="hidden dark:block object-contain object-left" />
					</div>
				</Link>
				<div className="hidden items-center gap-2 md:flex">
					{links.map((link, i) => (
						<Link key={i} className="animated-underline text-sm font-medium px-2 py-1" href={link.href}>
							{link.label}
						</Link>
					))}
					<AuthButton />
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
