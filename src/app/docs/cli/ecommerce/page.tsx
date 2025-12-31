import React from "react";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Terminal } from "lucide-react";

export const metadata: Metadata = {
    title: "E-commerce CLI - PostPipe",
    description: "Build an E-commerce backend with PostPipe CLI",
};

export default function EcommerceCliPage() {
    return (
        <div className="space-y-12 pb-20">
            <div className="border-b pb-8">
                <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">CLI Tool</Badge>
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">E-commerce Scaffolding</h1>
                <p className="text-xl text-muted-foreground max-w-3xl">
                    Generate a fully functional, production-ready E-commerce backend and frontend in minutes specifically designed for Next.js 14.
                </p>
                <div className="mt-6 bg-neutral-950 p-4 rounded-lg border border-neutral-800 font-mono text-sm text-white inline-block">
                    npx create-postpipe-ecommerce@latest
                </div>
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="text-2xl font-bold tracking-tight mb-6">Features Included</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            "Next.js 14 App Router Architecture",
                            "Authentication (Login / Signup)",
                            "Product Management (CRUD)",
                            "Shopping Cart & Checkout Flow",
                            "Order History & Tracking",
                            "Admin Dashboard",
                            "Wishlist & Reviews System",
                            "Database Integration (MongoDB/Postgres)"
                        ].map((feature) => (
                            <div key={feature} className="flex items-start gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight">Usage Guide</h2>
                    <p className="text-muted-foreground">
                        Running the command will trigger an interactive setup wizard:
                    </p>
                    <ol className="list-decimal list-inside space-y-4 text-muted-foreground ml-4">
                        <li>
                            <strong className="text-foreground">Project Name</strong>: Choose a name for your new store.
                        </li>
                        <li>
                            <strong className="text-foreground">Database</strong>: Select your preferred database provider.
                        </li>
                        <li>
                            <strong className="text-foreground">Environment</strong>: Auto-generate `.env` template for keys.
                        </li>
                    </ol>
                </section>

                <section>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Scaffolded Structure</h2>
                    <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-lg text-sm font-mono overflow-x-auto">
                        <pre>{`my-store/
├── app/
│   ├── (auth)/        # Authentication routes
│   ├── (shop)/        # Storefront routes
│   ├── admin/         # Admin dashboard
│   └── api/           # Backend API routes
├── components/        # UI Components (Shadcn UI)
├── lib/               # Database & Utilities
├── models/            # Data Models
└── public/            # Static assets`}</pre>
                    </div>
                </section>
            </div>
        </div>
    );
}
