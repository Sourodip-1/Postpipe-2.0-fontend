import Link from "next/link";
import { AnimatedWords } from "../ui/animated-words";

const productLinks = [
    { href: "/login", label: "Product" },
    { href: "/docs", label: "Docs" },
    { href: "/explore", label: "Dynamic" },
];

const resourceLinks = [
    { href: "/blog", label: "Blog" },
    { href: "/static", label: "Static" },
    { href: "/dashboard", label: "Dashboard" },
];


export function AppFooter() {
    return (
        <footer className="border-t bg-background">
            <div className="container mx-auto px-4 py-16 md:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16 md:mb-24">
                    <div>
                        <h3 className="text-xl md:text-2xl font-medium">Experience the Backend</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h4 className="font-medium mb-4">Product</h4>
                            <ul className="space-y-3">
                                {productLinks.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium mb-4">Resources</h4>
                            <ul className="space-y-3">
                                {resourceLinks.map((link) => (
                                    <li key={link.label}>
                                        <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="text-center mb-16 md:mb-24">
                    <AnimatedWords
                        text="PostPiPe"
                        className="font-headline text-8xl md:text-[12rem] lg:text-[15rem] font-bold tracking-tighter leading-none"
                    />
                </div>
            </div>
        </footer>
    );
}
