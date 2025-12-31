import React from "react";
import { getDocBySlug } from "@/lib/docs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
/* import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'; */
/* import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'; */
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface DocPageProps {
    params: {
        slug: string[];
    };
}

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
    const doc = getDocBySlug(params.slug);
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

export default function DocPage({ params }: DocPageProps) {
    const doc = getDocBySlug(params.slug);

    if (!doc) {
        notFound();
    }

    return (
        <div className="prose dark:prose-invert max-w-none pb-20">
            {/* If title exists in frontmatter, display it. Otherwise assume it's in MD. */}
            {doc.frontmatter.title && (
                <div className="border-b pb-4 mb-8">
                    <h1 className="mb-2">{doc.frontmatter.title}</h1>
                    {doc.frontmatter.description && (
                        <p className="text-xl text-muted-foreground m-0">{doc.frontmatter.description}</p>
                    )}
                </div>
            )}

            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom components mapping
                    /* code({node, inline, className, children, ...props}) {
                        // Syntax highlighting logic could go here
                        return <code className={className} {...props}>{children}</code>
                    } */
                }}
            >
                {doc.content}
            </ReactMarkdown>
        </div>
    );
}
