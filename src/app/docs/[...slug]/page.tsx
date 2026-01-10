import React from "react";
import { getDocBySlug } from "@/lib/docs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
/* import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; */
/* import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'; */
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface DocPageProps {
    params: Promise<{
        slug: string[];
    }>;
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
    const { slug } = await params;
    const doc = getDocBySlug(slug);
    if (!doc) {
        return {
            title: "PostPipe Documentation",
        };
    }
    return {
        title: `${doc.frontmatter.title || "Docs"} - PostPipe`,
        description: doc.frontmatter.description || "PostPipe Documentation",
    };
}

import NeuralNetworkHero from "@/components/ui/neural-network-hero";

export default async function DocPage({ params }: DocPageProps) {
    const { slug } = await params;
    const doc = getDocBySlug(slug);

    if (!doc) {
        notFound();
    }

    // Determine Hero Props based on slug or default
    const isIntro = slug.length === 1 && slug[0] === 'introduction';

    // Default Buttons
    let ctaButtons = [
        { text: "Dashboard", href: "/dashboard", primary: true },
        { text: "Back to Home", href: "/" }
    ];

    // Customize for Intro
    if (isIntro) {
        ctaButtons = [
            { text: "Static Setup", href: "/docs/guides/static-connector", primary: true },
            { text: "Dynamic CLI", href: "/docs/guides/cli-components" }
        ];
    }

    return (
        <div className="w-full relative">
            <NeuralNetworkHero
                title={doc.frontmatter.title || "Documentation"}
                description={doc.frontmatter.description || "Everything you need to build with PostPipe."}
                badgeText={isIntro ? "PostPipe V2.0" : "Guide"}
                badgeLabel={isIntro ? "Docs" : "Tutorial"}
                ctaButtons={ctaButtons}
                microDetails={[]}
                showBackground={false} // Global background handles this
            />

            <div className="max-w-5xl mx-auto px-6 pb-24 -mt-40 relative z-10 pointer-events-none">
                <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-12 pointer-events-auto min-h-[500px]">

                    {/* Breadcrumbs for non-intro pages */}
                    {!isIntro && (
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-8 border-b border-white/5 pb-4">
                            <Link href="/docs/introduction" className="hover:text-white transition-colors">Docs</Link>
                            <ChevronRight size={14} />
                            <span className="text-white font-medium">{doc.frontmatter.title}</span>
                        </div>
                    )}

                    <div className="prose prose-invert prose-lg max-w-none 
                        prose-headings:text-white prose-headings:font-light
                        prose-p:text-slate-300 prose-p:leading-relaxed
                        prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-white prose-strong:font-semibold
                        prose-li:text-slate-300
                        prose-li:marker:text-slate-500
                        prose-code:text-indigo-300 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                        prose-pre:bg-black/50 prose-pre:backdrop-blur-md prose-pre:border prose-pre:border-white/10
                    ">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                        >
                            {doc.content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
}
