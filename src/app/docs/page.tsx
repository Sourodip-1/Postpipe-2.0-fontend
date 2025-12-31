"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    Book,
    Terminal,
    Menu,
    X,
    Search,
    ChevronRight,
    Server,
    ShieldCheck,
    ShoppingCart,
    Cpu,
    Code,
    Database,
    ArrowRight,
    Copy,
    Check,
    User,
    Box,
    CreditCard,
    Package,
    FileText,
    LayoutPanelLeft,
    Bell,
    BarChart3,
    Upload,
    Mail
} from 'lucide-react';

// --- Components ---

// 1. CodeBlock: Handles syntax highlighting simulation and copy functionality
const CodeBlock = ({ code, language = 'bash' }: { code: string, language?: string }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        // Fallback for iframe environments where navigator.clipboard might be restricted
        const textArea = document.createElement("textarea");
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
        } catch (err) {
            console.error('Failed to copy', err);
        }
        document.body.removeChild(textArea);

        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-4 rounded-lg overflow-hidden border border-slate-700 bg-[#0f1117]">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700">
                <span className="text-xs text-slate-400 font-mono uppercase">{language}</span>
                <button
                    onClick={handleCopy}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                    title="Copy to clipboard"
                >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-slate-400" />}
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-slate-200 whitespace-pre">
                    {code}
                </pre>
            </div>
        </div>
    );
};

// 2. Note/Callout Component
const Note = ({ type = 'info', children }: { type?: 'info' | 'warning' | 'success', children: React.ReactNode }) => {
    const styles = {
        info: 'bg-blue-900/20 border-blue-500/30 text-blue-200',
        warning: 'bg-amber-900/20 border-amber-500/30 text-amber-200',
        success: 'bg-emerald-900/20 border-emerald-500/30 text-emerald-200',
    };

    return (
        <div className={`p-4 my-4 rounded-lg border ${styles[type]} flex gap-3`}>
            <div className="shrink-0 mt-1">
                {type === 'info' && <Book size={18} />}
                {type === 'warning' && <ShieldCheck size={18} />}
                {type === 'success' && <Check size={18} />}
            </div>
            <div className="text-sm leading-relaxed">{children}</div>
        </div>
    );
};

// --- Data Definitions ---

const cliTools = [
    {
        category: "Core",
        command: "npx create-postpipe-connector",
        description: "The Essential Tool. Scaffolds the self-hosted database connector.",
        icon: <Database className="w-5 h-5 text-blue-400" />
    },
    {
        category: "Auth",
        command: "npx create-postpipe-auth",
        description: "Master Tool. Scaffolds a complete Authentication system (Login, Signup, DB, Email).",
        icon: <User className="w-5 h-5 text-emerald-400" />
    },
    {
        category: "E-commerce",
        command: "npx create-postpipe-ecommerce",
        description: "Full-stack shop backend & frontend logic.",
        icon: <ShoppingCart className="w-5 h-5 text-purple-400" />
    },
    {
        category: "E-commerce",
        command: "npx create-postpipe-shop",
        description: "Scaffolds specific Shop features like Cart and Wishlist.",
        icon: <ShoppingCart className="w-5 h-5 text-purple-300" />
    },
    {
        category: "E-commerce",
        command: "npx create-postpipe-delivery",
        description: "Delivery tracking and management components.",
        icon: <Box className="w-5 h-5 text-amber-400" />
    },
    {
        category: "E-commerce",
        command: "npx create-postpipe-payment",
        description: "Components for payment processing integration.",
        icon: <CreditCard className="w-5 h-5 text-indigo-400" />
    },
    {
        category: "Features",
        command: "npx create-postpipe-appointment",
        description: "Appointment Booking System (Models, APIs).",
        icon: <Package className="w-5 h-5 text-orange-400" />
    },
    {
        category: "Features",
        command: "npx create-postpipe-form",
        description: "Interactive Form APIs (Contact, Feedback, Newsletter).",
        icon: <FileText className="w-5 h-5 text-pink-400" />
    },
    {
        category: "Features",
        command: "npx create-postpipe-profile",
        description: "User Profile management (Update Name, Change Password).",
        icon: <User className="w-5 h-5 text-cyan-400" />
    },
    {
        category: "Features",
        command: "npx create-postpipe-cms",
        description: "Scaffolds simple Content Management System capabilities.",
        icon: <LayoutPanelLeft className="w-5 h-5 text-rose-400" />
    },
    {
        category: "Features",
        command: "npx create-postpipe-search",
        description: "Scaffolds search functionality.",
        icon: <Search className="w-5 h-5 text-teal-400" />
    },
    {
        category: "Features",
        command: "npx create-postpipe-notify",
        description: "Notification system (Emails, Alerts).",
        icon: <Bell className="w-5 h-5 text-yellow-400" />
    },
    {
        category: "Features",
        command: "npx create-postpipe-analytics",
        description: "Analytics tracking components.",
        icon: <BarChart3 className="w-5 h-5 text-red-400" />
    },
    {
        category: "Features",
        command: "npx create-postpipe-upload",
        description: "File upload utilities.",
        icon: <Upload className="w-5 h-5 text-sky-400" />
    },
    {
        category: "Admin",
        command: "npx create-postpipe-admin",
        description: "Scaffolds an Admin Dashboard.",
        icon: <LayoutPanelLeft className="w-5 h-5 text-zinc-400" />
    },
    {
        category: "Utilities",
        command: "npx create-postpipe-crud",
        description: "Basic CRUD template.",
        icon: <Terminal className="w-5 h-5 text-gray-400" />
    },
    {
        category: "Utilities",
        command: "npx create-postpipe-email",
        description: "Sets up Resend email utility.",
        icon: <Mail className="w-5 h-5 text-lime-400" />
    },
];

// --- Page Content Definitions ---

interface PageContent {
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
}

const pages: Record<string, PageContent> = {
    introduction: {
        title: 'Introduction',
        icon: <Book size={18} />,
        content: (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="border-b border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">Introduction to PostPipe 🧪</h1>
                    <p className="text-xl text-slate-400">The Zero Trust bridge between your browser and your data.</p>
                </div>

                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">Core Philosophy</h2>
                    <p className="text-slate-300 mb-4 leading-relaxed">
                        PostPipe is built on the principle of <span className="text-indigo-400 font-semibold">Zero Trust</span>.
                        In a world where data security is paramount, we believe that your database credentials should
                        never leave your infrastructure.
                    </p>
                    <Note type="info">
                        Traditional secure tunnels often require trust in an intermediary. PostPipe utilizes a
                        <strong> Zero Trust Connector</strong> model where the SaaS platform orchestrates requests but never holds the keys.
                    </Note>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-6 mt-6">
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <div className="bg-indigo-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-indigo-400">
                                <Server size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">1. The Lab (SaaS)</h3>
                            <p className="text-sm text-slate-400">
                                The central dashboard that manages forms and relays data. It acts as the orchestration layer.
                            </p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <div className="bg-emerald-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">2. The Connector</h3>
                            <p className="text-sm text-slate-400">
                                A self-hosted Node.js agent living in your infrastructure. It keeps your credentials safe locally.
                            </p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-blue-400">
                                <Terminal size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-2">3. The Browser</h3>
                            <p className="text-sm text-slate-400">
                                The client-side interface that initiates requests and displays results securely.
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        )
    },
    'getting-started': {
        title: 'Getting Started',
        icon: <Terminal size={18} />,
        content: (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="border-b border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">Getting Started 🚀</h1>
                    <p className="text-xl text-slate-400">Run your first Zero Trust simulation in minutes.</p>
                </div>

                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">Prerequisites</h2>
                    <ul className="list-disc list-inside space-y-2 text-slate-300 ml-4">
                        <li><strong>Node.js 18+</strong>: Required for all apps and CLI tools.</li>
                        <li><strong>MongoDB or Postgres</strong>: Running locally or in the cloud.</li>
                    </ul>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">Step 1: Start the SaaS Simulation</h2>
                    <p className="text-slate-300 mb-4">Run the "Dynamic Lab" to host the Dashboard and Mock Ingest API.</p>
                    <CodeBlock
                        code={`npm run dev:lab\n# Starts the Lab on http://localhost:3000`}
                    />
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">Step 2: Create & Run a Connector</h2>
                    <p className="text-slate-300 mb-4">In a separate terminal window, generate your secure connector.</p>

                    <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">Generate</h3>
                    <CodeBlock code="node cli/create-postpipe-connector/dist/index.js my-test-connector" />

                    <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">Install & Configure</h3>
                    <p className="text-slate-300 mb-2">Crucial: Change the port to 3001 to avoid conflicts.</p>
                    <CodeBlock
                        code={`cd my-test-connector\nnpm install\n\n# In your .env file:\nPORT=3001`}
                    />

                    <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">Start</h3>
                    <CodeBlock code="npm run dev" />
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">Step 3: Connect Them</h2>
                    <ol className="list-decimal list-inside space-y-3 text-slate-300 ml-4">
                        <li>Open the <strong>Connector Demo Page</strong> at <code className="bg-slate-800 px-1 rounded">http://localhost:3000/connector-demo</code></li>
                        <li>Enter your Connector URL: <code className="bg-slate-800 px-1 rounded">http://localhost:3001/postpipe/ingest</code></li>
                        <li>Click <strong>Generate Credentials</strong>.</li>
                        <li>Copy the ID and Secret into your connector's <code className="bg-slate-800 px-1 rounded">.env</code> file.</li>
                        <li>Restart your connector terminal.</li>
                    </ol>
                    <Note type="success">
                        If successful, you will see data flow from the Browser, through the Lab, to your Connector, and back!
                    </Note>
                </section>
            </div>
        )
    },
    architecture: {
        title: 'Architecture',
        icon: <Cpu size={18} />,
        content: (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="border-b border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">System Architecture 🏗️</h1>
                    <p className="text-xl text-slate-400">Understanding the Monorepo and Data Flow.</p>
                </div>

                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">Directory Structure</h2>
                    <CodeBlock
                        language="text"
                        code={`PostPipe-2.0/
├── apps/               # Next.js Applications
│   ├── web/            # The Main SaaS Platform (Dynamic Lab)
│   ├── dynamic/        # Dynamic App components (Internal)
│   └── static/         # Static Site Generation components
├── cli/                # The CLI Ecosystem
│   ├── create-postpipe-connector/ # Scaffolder for connectors
│   └── components-cli/            # Storage for Templates
├── packages/           # Shared Libraries
│   └── ui/             # Shared React/Shadcn UI components
└── templates/          # Standard templates`}
                    />
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">Data Flow: The Zero Trust Model</h2>
                    <div className="space-y-4">
                        {[
                            { title: '1. Ingress', desc: 'Request hits apps/web (The Lab).' },
                            { title: '2. Routing', desc: 'The Lab looks up the ConnectorID.' },
                            { title: '3. Tunneling', desc: 'Payload forwarded to the specific active Connector.' },
                            { title: '4. Execution', desc: 'Connector executes DB operation locally.' },
                            { title: '5. Egress', desc: 'Encrypted result sent back to apps/web.' }
                        ].map((step, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                                <div className="bg-indigo-500/20 text-indigo-400 w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold">
                                    {i + 1}
                                </div>
                                <div>
                                    <h3 className="font-medium text-white">{step.title}</h3>
                                    <p className="text-slate-400 text-sm">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        )
    },
    cli: {
        title: 'CLI Tools',
        icon: <Code size={18} />,
        content: (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="border-b border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">CLI Ecosystem 🛠️</h1>
                    <p className="text-xl text-slate-400">Scaffold complex systems in seconds.</p>
                </div>

                <section>
                    <p className="text-slate-300 mb-6">
                        All tools are designed to be run with <code className="text-indigo-400">npx</code>.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {cliTools.map((tool, index) => (
                            <div key={index} className="flex flex-col p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 hover:border-slate-700 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 group-hover:border-slate-700 transition-colors">
                                        {tool.icon}
                                    </div>
                                    <span className={`
                    text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded-full border 
                    ${tool.category === 'Core' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''}
                    ${tool.category === 'Auth' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                    ${tool.category === 'E-commerce' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : ''}
                    ${tool.category === 'Features' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : ''}
                    ${tool.category === 'Admin' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : ''}
                    ${tool.category === 'Utilities' ? 'bg-lime-500/10 text-lime-400 border-lime-500/20' : ''}
                  `}>
                                        {tool.category}
                                    </span>
                                </div>
                                <code className="text-sm font-mono text-indigo-400 block mb-2 break-all bg-slate-950/50 p-1.5 rounded border border-transparent group-hover:border-slate-800">
                                    {tool.command}
                                </code>
                                <p className="text-sm text-slate-400 leading-relaxed mt-auto">
                                    {tool.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        )
    },
    auth: {
        title: 'Authentication',
        icon: <ShieldCheck size={18} />,
        content: (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="border-b border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">Authentication CLI 🔐</h1>
                    <p className="text-xl text-slate-400">Production-ready auth system in seconds.</p>
                </div>

                <section>
                    <h2 className="text-2xl font-semibold text-white mb-4">Installation</h2>
                    <CodeBlock code="npx create-postpipe-auth" />
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">What It Generates</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                            <h3 className="text-lg font-medium text-indigo-300 mb-3">Backend & DB</h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2"><ArrowRight size={14} /> Server Actions for Login/Signup</li>
                                <li className="flex items-center gap-2"><ArrowRight size={14} /> Zod Validation Schemas</li>
                                <li className="flex items-center gap-2"><ArrowRight size={14} /> JWT Session Management</li>
                                <li className="flex items-center gap-2"><ArrowRight size={14} /> Mongoose User Model</li>
                            </ul>
                        </div>
                        <div className="p-5 rounded-lg border border-slate-700 bg-slate-800/30">
                            <h3 className="text-lg font-medium text-emerald-300 mb-3">Frontend Pages</h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                <li className="flex items-center gap-2"><ArrowRight size={14} /> /login (LoginPage.tsx)</li>
                                <li className="flex items-center gap-2"><ArrowRight size={14} /> /signup (SignupPage.tsx)</li>
                                <li className="flex items-center gap-2"><ArrowRight size={14} /> /verify-email</li>
                                <li className="flex items-center gap-2"><ArrowRight size={14} /> /reset-password</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">Configuration</h2>
                    <p className="text-slate-300 mb-2">Required <code className="text-indigo-400">.env</code> variables:</p>
                    <CodeBlock
                        language="env"
                        code={`DATABASE_URI=mongodb+srv://...\nJWT_SECRET=your_super_secret_key\nRESEND_API_KEY=re_123...\nNEXT_PUBLIC_APP_URL=http://localhost:3000`}
                    />
                </section>
            </div>
        )
    },
    ecommerce: {
        title: 'E-commerce',
        icon: <ShoppingCart size={18} />,
        content: (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="border-b border-slate-800 pb-6 mb-8">
                    <h1 className="text-4xl font-bold text-white mb-4">E-commerce CLI 🛒</h1>
                    <p className="text-xl text-slate-400">Scalable shop backend with Next.js App Router.</p>
                </div>

                <section>
                    <CodeBlock code="npx create-postpipe-ecommerce" />
                </section>

                <section className="mt-8">
                    <h2 className="text-2xl font-semibold text-white mb-4">Features Included</h2>
                    <div className="grid gap-4">
                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                <ShoppingCart size={16} className="text-indigo-400" /> Product & Cart
                            </h3>
                            <p className="text-slate-400 text-sm">Server-side cart validation, Wishlists, and Product review systems.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                <Database size={16} className="text-emerald-400" /> Order Processing
                            </h3>
                            <p className="text-slate-400 text-sm">Comprehensive Order models, Payment tracking schema, and Checkout APIs.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                            <h3 className="font-medium text-white mb-2 flex items-center gap-2">
                                <Terminal size={16} className="text-amber-400" /> Advanced
                            </h3>
                            <p className="text-slate-400 text-sm">Basic Analytics, Transactional Emails, and Admin Dashboard ready structures.</p>
                        </div>
                    </div>
                </section>
            </div>
        )
    }
};

// --- Main App Layout ---

export default function PostPipeDocs() {
    const [activePage, setActivePage] = useState('introduction');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Close sidebar on page change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
        window.scrollTo(0, 0);
    }, [activePage]);

    // Filter navigation items based on search
    const filteredPages = Object.keys(pages).filter(key =>
        pages[key].title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#09090b] text-slate-200 font-sans selection:bg-indigo-500/30">

            {/* Mobile Navbar with sticky positioning adjusted for Global Nav */}
            <div className="lg:hidden sticky top-14 z-40 border-b border-slate-800 bg-[#09090b]/80 backdrop-blur-md px-4 py-3 flex items-center justify-between">
                <div></div>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400 hover:text-white">
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <div className="flex max-w-[1600px] mx-auto">

                {/* Sidebar Navigation */}
                <aside className={`
          fixed lg:sticky lg:top-16 h-[calc(100vh-60px)] lg:h-[calc(100vh-4rem)] w-72 bg-[#09090b] border-r border-slate-800 
          z-40 transition-transform duration-300 ease-in-out lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0 top-[110px]' : '-translate-x-full lg:translate-x-0 top-16'}
        `}>
                    <div className="p-6 h-full flex flex-col">
                        {/* Desktop Logo - Hidden since we have global header, or keep as sub-branding */}
                        <div className="hidden lg:flex items-center gap-3 font-bold text-white text-xl mb-8">
                            <div className="relative h-8 w-40">
                                <Image src="/PostPipe.svg" alt="PostPipe" fill className="object-contain object-left" />
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search documentation..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                        </div>

                        {/* Nav Links */}
                        <nav className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
                            {filteredPages.map(key => {
                                const page = pages[key];
                                const isActive = activePage === key;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActivePage(key)}
                                        className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${isActive
                                                ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
                    `}
                                    >
                                        <span className={isActive ? 'text-indigo-400' : 'text-slate-500'}>
                                            {page.icon}
                                        </span>
                                        {page.title}
                                        {isActive && <ChevronRight size={14} className="ml-auto" />}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-6 border-t border-slate-800 text-xs text-slate-500">
                            <p>v2.0.4-beta</p>
                            <p className="mt-1">Generated by PostPipe Docs</p>
                        </div>
                    </div>
                </aside>

                {/* Overlay for mobile sidebar */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
                        style={{ top: '60px' }}
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content Area */}
                <main className="flex-1 min-w-0">
                    <div className="max-w-4xl mx-auto px-4 py-8 lg:px-12 lg:py-12">

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
                            <span>Docs</span>
                            <ChevronRight size={14} />
                            <span className="text-indigo-400 font-medium">{pages[activePage].title}</span>
                        </div>

                        {/* Dynamic Content Render */}
                        {pages[activePage].content}

                        {/* Navigation Footer */}
                        <div className="mt-16 pt-8 border-t border-slate-800 flex justify-between">
                            {(() => {
                                const keys = Object.keys(pages);
                                const currentIndex = keys.indexOf(activePage);
                                const prev = keys[currentIndex - 1];
                                const next = keys[currentIndex + 1];

                                return (
                                    <>
                                        {prev ? (
                                            <button
                                                onClick={() => setActivePage(prev)}
                                                className="group flex flex-col items-start gap-1"
                                            >
                                                <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                                                    <ArrowRight size={12} className="rotate-180" /> Previous
                                                </span>
                                                <span className="text-lg font-medium text-slate-300 group-hover:text-white transition-colors">
                                                    {pages[prev].title}
                                                </span>
                                            </button>
                                        ) : <div />}

                                        {next ? (
                                            <button
                                                onClick={() => setActivePage(next)}
                                                className="group flex flex-col items-end gap-1"
                                            >
                                                <span className="text-xs text-slate-500 flex items-center gap-1 group-hover:text-indigo-400 transition-colors">
                                                    Next <ArrowRight size={12} />
                                                </span>
                                                <span className="text-lg font-medium text-slate-300 group-hover:text-white transition-colors">
                                                    {pages[next].title}
                                                </span>
                                            </button>
                                        ) : <div />}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
