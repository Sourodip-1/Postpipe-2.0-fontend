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


import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

export function Header2() {
	const scrolled = useScroll(10);
	const pathname = usePathname();
	const isExplore = pathname?.startsWith("/explore");
	const [isOpen, setIsOpen] = React.useState(false);

	const links = [
		{ href: "/explore", label: "Forge" },
		{ href: "/static", label: "Static" },
		{ href: "/dashboard/changelog", label: "Change Log" },
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

				{/* Mobile Menu */}
				<div className="flex items-center gap-2 md:hidden">
					<ThemeToggle />
					<Sheet open={isOpen} onOpenChange={setIsOpen}>
						<SheetTrigger asChild>
							<Button variant="ghost" size="icon" className="shrink-0">
								<Menu className="h-5 w-5" />
								<span className="sr-only">Toggle menu</span>
							</Button>
						</SheetTrigger>
						<SheetContent side="right">
							<SheetHeader>
								<SheetTitle className="text-left">Menu</SheetTitle>
							</SheetHeader>
							<div className="flex flex-col gap-4 mt-8">
								{links.map((link, i) => (
									<Link
										key={i}
										href={link.href}
										className="text-lg font-medium hover:text-primary transition-colors"
										onClick={() => setIsOpen(false)}
									>
										{link.label}
									</Link>
								))}
								<div className="pt-4 mt-4 border-t">
									<div className="flex justify-start">
										<AuthButton />
									</div>
								</div>
							</div>
						</SheetContent>
					</Sheet>
				</div>
			</div>
		</header>
	);
}
