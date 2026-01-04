"use client";

import { Copy, ExternalLink, GitPullRequest, Maximize2 } from "lucide-react";
import { MeshGradient, Dithering } from "@paper-design/shaders-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const releases = [
    {
        title: "v2.0.0: Per-Connector Database Routing",
        date: "January 04, 2026",
        image: "https://res.cloudinary.com/dbaw86kzf/image/upload/v1767534741/967e77cc-ef30-4ec9-b086-97fbbf903710.png",
        excerpt:
            "Major refactoring introduces per-connector database configuration, removing global routing rules and enabling granular database management for each connector instance.",
        contributors: ["https://github.com/souvikvos",
            "https://github.com/yo-soyam",
            "https://github.com/Sourodip-1",],
        content: (
            <div className="prose dark:prose-invert max-w-none">
                <h3>Per-Connector Database Management</h3>
                <p>
                    Complete overhaul of the database configuration system. Each connector now manages its own database aliases independently.
                </p>
                <ul>
                    <li>Removed global routing rules in favor of connector-specific configuration</li>
                    <li>New dedicated Database page for managing connector databases</li>
                    <li>Auto-generated aliases from environment variable names</li>
                    <li>Enhanced form builder with connector-aware database selection</li>
                </ul>
                <h4>UI/UX Improvements</h4>
                <ul>
                    <li>Simplified database configuration with only 2 required fields (URI, Database Name)</li>
                    <li>Real-time validation and error handling</li>
                    <li>Improved visual design with card-based layouts</li>
                </ul>
            </div>
        ),
    },
    {
        title: "v1.5.0: Connector Deployment & Vercel Integration",
        date: "January 03, 2026",
        image: "https://res.cloudinary.com/dbaw86kzf/image/upload/v1767534536/ea4e6a7c-7478-4321-86cd-0247a2bdaad3.png",
        excerpt:
            "Streamlined connector deployment with native Vercel support, guided setup wizard, and enhanced security features for seamless cloud deployment.",
        contributors: [
            "https://github.com/souvikvos",
            "https://github.com/yo-soyam",
            "https://github.com/Sourodip-1",
        ],
        content: (
            <div className="prose dark:prose-invert max-w-none">
                <h3>Vercel-Ready Connectors</h3>
                <p>
                    Deploy your connectors to Vercel with a single click. Serverless-compatible architecture ensures scalability and reliability.
                </p>
                <ul>
                    <li>Vercel deployment configuration included</li>
                    <li>Environment variable-based configuration</li>
                    <li>Serverless function optimization</li>
                </ul>
                <h4>Enhanced Setup Wizard</h4>
                <p>
                    Interactive wizard guides users through credential generation, repository forking, and cloud deployment.
                </p>
                <ul>
                    <li>Step-by-step deployment instructions</li>
                    <li>Visual cues and gating mechanisms</li>
                    <li>Automatic credential generation</li>
                </ul>
            </div>
        ),
    },
    {
        title: "v1.2.0: Secure Public API & Zero Data Retention",
        date: "January 02, 2026",
        image: "https://res.cloudinary.com/dbaw86kzf/image/upload/v1767534193/c7752202-eeb9-4974-b236-01945ce65a65.png",
        excerpt:
            "Introduced secure public API for fetching form submissions directly from user-deployed connectors with strict zero data retention policy.",
        contributors: [
            "https://github.com/souvikvos",
            "https://github.com/yo-soyam",
            "https://github.com/Sourodip-1",
        ],
        content: (
            <div className="prose dark:prose-invert max-w-none">
                <h3>Public API Launch</h3>
                <p>
                    New REST API enables secure access to form submissions with robust authentication and authorization.
                </p>
                <ul>
                    <li>Token-based authentication for API access</li>
                    <li>Dynamic database routing support</li>
                    <li>Comprehensive error handling</li>
                </ul>
                <h4>Zero Data Retention</h4>
                <p>
                    Postpipe never stores user submission data. All data is proxied directly from user-controlled databases.
                </p>
            </div>
        ),
    },
    {
        title: "v1.1.0: Enhanced Authentication & Connector Management",
        date: "December 27, 2025",
        image: "https://res.cloudinary.com/dbaw86kzf/image/upload/v1767533119/9b5457d1-108f-4ee7-bf45-db02c035b128.png",
        excerpt:
            "Improved connector authentication, better error logging, and enhanced dashboard UI for managing multiple connectors.",
        contributors: [
            "https://github.com/souvikvos",
            "https://github.com/yo-soyam",
            "https://github.com/Sourodip-1",
        ],
        content: (
            <div className="prose dark:prose-invert max-w-none">
                <h3>Authentication Improvements</h3>
                <ul>
                    <li>Standardized authentication contract between dashboard and connectors</li>
                    <li>Enhanced error logging and debugging tools</li>
                    <li>Improved token validation and security</li>
                </ul>
                <h4>Dashboard Enhancements</h4>
                <ul>
                    <li>Redesigned connector cards with better visual hierarchy</li>
                    <li>Secret rotation functionality</li>
                    <li>Real-time connection status indicators</li>
                </ul>
            </div>
        ),
    },
    {
        title: "v1.0.0: Postpipe Launch",
        date: "December 25, 2025",
        image: "https://res.cloudinary.com/dbaw86kzf/image/upload/v1767532857/45c05d69-7a71-4cf5-b2aa-1bcf2e279ebd_t8asix.jpg",
        excerpt:
            "Official launch of Postpipe - the modern form backend solution with user-controlled data, static workflows, and MongoDB integration.",
        contributors: [
            "https://github.com/souvikvos",
            "https://github.com/yo-soyam",
            "https://github.com/Sourodip-1",
        ],
        content: (
            <div className="prose dark:prose-invert max-w-none">
                <h3>Core Features</h3>
                <ul>
                    <li>Visual form builder with drag-and-drop interface</li>
                    <li>Static workflows - frontend directly connects to your database</li>
                    <li>MongoDB connector template for easy deployment</li>
                    <li>User profile management API</li>
                    <li>CLI package for rapid integration</li>
                </ul>
                <h4>Security First</h4>
                <p>
                    Built with security in mind - users maintain full control of their data with zero server-side retention.
                </p>
                <ul>
                    <li>OAuth-style connector authentication</li>
                    <li>Bcrypt password hashing</li>
                    <li>Environment-based configuration</li>
                </ul>
                <h4>Developer Experience</h4>
                <ul>
                    <li>Beautiful dashboard with dark mode support</li>
                    <li>Comprehensive documentation</li>
                    <li>NPM packages for quick setup</li>
                    <li>Easy-to-customize connector templates</li>
                </ul>
            </div>
        ),
    },
];

export default function ChangelogComponent() {
    const copyLink = (version: string) => {
        const url = `${window.location.origin}${window.location.pathname}#${version}`;
        navigator.clipboard.writeText(url);
    };

    return (
        <section className="relative w-full">
            {/* shader header full-width */}
            <div className="relative w-full overflow-hidden">
                <MeshGradient
                    colors={["#5b00ff", "#00ffa3", "#ff9a00", "#ea00ff"]}
                    swirl={0.55}
                    distortion={0.85}
                    speed={0.1}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/30" />

                <div className="relative container mx-auto px-4 py-12 text-left">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                            <GitPullRequest className="size-4" />
                            <p>Changelog</p>
                        </div>
                        <h1 className="text-4xl font-semibold text-white leading-snug">
                            Postpipe Updates
                            <br /> & Release Notes
                        </h1>
                    </div>
                </div>
            </div>

            {/* content */}
            <div className="grid justify-center container mx-auto px-4 border-x border-border">
                {releases.map((item, idx) => (
                    <Dialog key={idx}>
                        <div className="relative flex flex-col lg:flex-row w-full py-16 gap-6 lg:gap-0" id={item.title.split(":")[0]}>
                            <div className="lg:sticky top-2 h-fit">
                                <time className="text-muted-foreground w-36 text-sm font-medium lg:absolute">
                                    {item.date}
                                </time>
                            </div>

                            <div className="flex max-w-prose flex-col gap-4 lg:mx-auto">
                                <h3 className="text-3xl font-medium lg:pt-10 lg:text-3xl">{item.title}</h3>
                                <DialogTrigger asChild>
                                    <div className="relative cursor-pointer group">
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            className="border-border max-h-96 w-full rounded-lg border object-cover transition-transform group-hover:scale-[1.02]"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 rounded-lg" />
                                    </div>
                                </DialogTrigger>
                                <p className="text-muted-foreground text-sm font-medium">
                                    {item.excerpt}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <div className="flex items-center -space-x-2">
                                            {item.contributors.slice(0, 3).map((src, id) => (
                                                <img
                                                    key={id}
                                                    src={`${src}.png`}
                                                    alt="Contributor"
                                                    className="border-border size-6 rounded-full border bg-background"
                                                />
                                            ))}
                                        </div>
                                        {item.contributors.length > 3 && (
                                            <span className="text-muted-foreground text-sm font-medium">
                                                +{item.contributors.length - 3} contributors
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Maximize2 className="size-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Show full release</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => copyLink(item.title.split(":")[0])}>
                                                        <Copy className="size-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Copy link</p>
                                                </TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(`https://github.com/Sourodip-1/Postpipe-2.0-fontend-/releases/tag/${item.title.split(":")[0]}`, '_blank')}
                                                    >
                                                        <ExternalLink className="size-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>View on GitHub</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-border absolute bottom-0 left-0 h-px w-full" />
                        </div>

                        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-prose">
                            <DialogHeader>
                                <DialogTitle className="text-left">{item.title}</DialogTitle>
                                <DialogDescription className="text-left">
                                    {item.excerpt}
                                </DialogDescription>
                            </DialogHeader>
                            <img
                                src={item.image}
                                alt={item.title}
                                className="border-border max-h-96 w-full rounded-lg border object-cover"
                            />
                            {item.content}
                        </DialogContent>
                    </Dialog>
                ))}
            </div>
        </section>
    );
}
