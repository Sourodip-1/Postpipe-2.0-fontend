"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy, Download, Link as LinkIcon, AlertCircle, Database, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getConnectorsAction, createAuthPresetAction, updateAuthPresetAction } from "@/app/actions/builder";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AuthPresetGenerator({ onSuccess, initialPreset }: { onSuccess?: () => void, initialPreset?: any }) {
    const router = useRouter();
    const [presetName, setPresetName] = React.useState(initialPreset?.name || "");
    const [isSaving, setIsSaving] = React.useState(false);
    const [codeTab, setCodeTab] = React.useState<"html" | "react">("html");
    const [headless, setHeadless] = React.useState(false);

    const [providers, setProviders] = React.useState({
        email: initialPreset?.providers?.email ?? true,
        google: initialPreset?.providers?.google ?? false,
        github: initialPreset?.providers?.github ?? false
    });
    const [requireEmailVerification, setRequireEmailVerification] = React.useState(initialPreset?.providers?.requireEmailVerification || false);
    const [redirectUrl, setRedirectUrl] = React.useState(initialPreset?.redirectUrl || "");
    const [envFrontendUrlAlias, setEnvFrontendUrlAlias] = React.useState(initialPreset?.envFrontendUrlAlias || "");
    const [projectId, setProjectId] = React.useState(initialPreset?.projectId || "");
    const [targetDatabase, setTargetDatabase] = React.useState(initialPreset?.targetDatabase || "default");
    const [apiUrl, setApiUrl] = React.useState(initialPreset?.apiUrl || "");
    const [isApiUrlManuallyEdited, setIsApiUrlManuallyEdited] = React.useState(!!initialPreset?.apiUrl);

    // Email Provider and SMTP settings
    const [emailProvider, setEmailProvider] = React.useState<"resend" | "nodemailer">(initialPreset?.providers?.emailProvider || "resend");
    const [smtpHost, setSmtpHost] = React.useState(initialPreset?.providers?.smtpHost || "");
    const [smtpPort, setSmtpPort] = React.useState(initialPreset?.providers?.smtpPort || "587");
    const [smtpUser, setSmtpUser] = React.useState(initialPreset?.providers?.smtpUser || "");
    const [smtpPass, setSmtpPass] = React.useState(initialPreset?.providers?.smtpPass || "");

    // Load connectors for database routing selection
    const [connectors, setConnectors] = React.useState<any[]>([]);
    const [selectedConnector, setSelectedConnector] = React.useState("");

    React.useEffect(() => {
        getConnectorsAction().then(data => {
            setConnectors(data);
            if (initialPreset?.connectorId) {
                setSelectedConnector(initialPreset.connectorId);
            } else if (data.length > 0) {
                setSelectedConnector(data[0].id);
            }
        });
    }, [initialPreset]);

    const activeConnectorData = connectors.find((c: any) => c.id === selectedConnector);
    const availableDatabases = activeConnectorData?.databases ? Object.keys(activeConnectorData.databases) : [];

    React.useEffect(() => {
        if (!isApiUrlManuallyEdited && activeConnectorData?.url) {
            // Trim trailing slash just in case
            const base = activeConnectorData.url.replace(/\/$/, "");
            setApiUrl(`${base}/api/auth`);
        }
    }, [selectedConnector, activeConnectorData, isApiUrlManuallyEdited]);

    const handleProviderChange = (provider: keyof typeof providers) => {
        setProviders((prev: typeof providers) => {
            const next = { ...prev, [provider]: !prev[provider] };
            // Ensure at least one provider is selected. If unchecking the last one, prevent it.
            if (!next.email && !next.google && !next.github) {
                return prev;
            }
            return next;
        });
    };

    const projectAlias = presetName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'PROJECT';

    const generateSnippet = () => {
        const activeProviders = Object.keys(providers).filter(k => providers[k as keyof typeof providers]);

        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com';
        const redirectDisplay = (!redirectUrl || redirectUrl === 'window.location.origin') ? 'window.location.origin' : `"${redirectUrl}"`;
        const scriptUrl = `${origin}/api/public/cdn/auth.js${projectId ? `?projectId=${projectId}` : ''}`;

        if (codeTab === "html") {
            return `<!-- Place this where you want the Postpipe Auth UI to render -->
${headless ? '<!-- Headless Mode enabled: You are responsible for the UI -->' : '<div id="postpipe-auth"></div>'}

<!-- Include the Postpipe Auth CDN script -->
<script src="${scriptUrl}"></script>

<!-- Initialize Postpipe Auth -->
<script>
    PostpipeAuth.init({
        apiUrl: "${apiUrl}",
        projectId: "${projectId || 'YOUR_PROJECT_ID'}",
        providers: ${JSON.stringify(activeProviders)},
        headless: ${headless},
        redirectUrl: ${redirectDisplay}${envFrontendUrlAlias ? `,\n        envFrontendUrlAlias: "${envFrontendUrlAlias}"` : ''}${projectAlias ? `,\n        projectAlias: "${projectAlias}"` : ''}${targetDatabase && targetDatabase !== 'default' ? `,\n        targetDatabase: "${targetDatabase}"` : ''}
    });

    // Handle Auth Events
    PostpipeAuth.on("success", (user) => {
        console.log("Authenticated User:", user);
        // Add your custom login success logic here
    });

    PostpipeAuth.on("error", (error) => {
        console.error("Authentication Error:", error);
    });
</script>`;
        }

        return `'use client';

import { useEffect, useState } from 'react';

/**
 * 1. Add the Global CDN script to your layout/head:
 * <script src="${scriptUrl}"></script>
 */

export default function PostpipeAuthProvider() {
    ${headless ? 'const [user, setUser] = useState(null);\n    const [error, setError] = useState(null);' : ''}

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).PostpipeAuth) {
            (window as any).PostpipeAuth.init({
                apiUrl: "${apiUrl}",
                projectId: "${projectId || 'YOUR_PROJECT_ID'}",
                providers: ${JSON.stringify(activeProviders)},
                headless: ${headless},
                redirectUrl: ${redirectDisplay}${envFrontendUrlAlias ? `,\n                envFrontendUrlAlias: "${envFrontendUrlAlias}"` : ''}${projectAlias ? `,\n                projectAlias: "${projectAlias}"` : ''}${targetDatabase && targetDatabase !== 'default' ? `,\n                targetDatabase: "${targetDatabase}"` : ''}
            });

            (window as any).PostpipeAuth.on("success", (user: any) => {
                console.log("Authenticated User:", user);
                ${headless ? 'setUser(user);' : ''}
            });

            ${headless ? '(window as any).PostpipeAuth.on("error", (err: any) => setError(err.message));' : ''}
        }
    }, []);

    ${headless ? `
    if (user) return <div>Welcome, {user.email}</div>;

    return (
        <form onSubmit={(e) => {
            e.preventDefault();
            const email = e.currentTarget.email.value;
            const password = e.currentTarget.password.value;
            (window as any).PostpipeAuth.loginWithEmail(email, password);
        }}>
            {error && <div style={{color: 'red'}}>{error}</div>}
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">Log In</button>
        </form>
    );` : 'return <div id="postpipe-auth" />;' }
}`;
    };

    const renderSnippet = () => {
        const activeProvidersList = Object.keys(providers).filter(k => providers[k as keyof typeof providers]);
        const providersListStr = JSON.stringify(activeProvidersList);
        const projectIdDisplay = projectId || 'YOUR_PROJECT_ID';
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://your-app.com';
        const redirectDisplay = redirectUrl || origin;
        const scriptUrl = `${origin}/api/public/cdn/auth.js${projectId ? `?projectId=${projectId}` : ''}`;

        if (codeTab === "html") {
            return (
                <React.Fragment>
                    <span className="text-[#7EE787]">&lt;!-- Place this where you want the Postpipe Auth UI to render --&gt;</span>{'\n'}
                    {headless ? (
                        <span className="text-[#7EE787]">&lt;!-- Headless Mode enabled: You are responsible for the UI --&gt;</span>
                    ) : (
                        <span className="text-[#89B4FA]">&lt;div id="postpipe-auth"&gt;&lt;/div&gt;</span>
                    )}
                    {'\n\n'}
                    <span className="text-[#7EE787]">&lt;!-- Include the Postpipe Auth CDN script --&gt;</span>{'\n'}
                    <span className="text-[#89B4FA]">&lt;script src="{scriptUrl}"&gt;&lt;/script&gt;</span>{'\n\n'}
                    <span className="text-[#89B4FA]">&lt;script&gt;</span>{'\n'}
                    <span className="text-white">    PostpipeAuth.init({'{'}</span>{'\n'}
                    <span className="text-white">        apiUrl: "{apiUrl}",</span>{'\n'}
                    <span className="text-white">        projectId: "{projectIdDisplay}",</span>{'\n'}
                    <span className="text-white">        providers: {providersListStr},</span>{'\n'}
                    <span className="text-white">        headless: {headless ? 'true' : 'false'},</span>{'\n'}
                    <span className="text-white">        redirectUrl: "{redirectDisplay}"</span>{envFrontendUrlAlias ? `,\n        envFrontendUrlAlias: "${envFrontendUrlAlias}"` : ''}{projectAlias ? `,\n        projectAlias: "${projectAlias}"` : ''}{targetDatabase && targetDatabase !== 'default' ? `,\n        targetDatabase: "${targetDatabase}"` : ''}{'\n'}
                    <span className="text-white">    {'}'});</span>{'\n\n'}
                    <span className="text-[#7EE787]">    // Handle Auth Events</span>{'\n'}
                    <span className="text-[#89B4FA]">    PostpipeAuth.on("success", (user) =&gt; {'{'}</span>{'\n'}
                    <span className="text-[#89B4FA]">        console.log("Authenticated User:", user);</span>{'\n'}
                    <span className="text-[#89B4FA]">    {'}'});</span>{'\n'}
                    <span className="text-[#89B4FA]">&lt;/script&gt;</span>
                </React.Fragment>
            );
        }

        return (
            <React.Fragment>
                <span className="text-[#CBA6F7]">import</span> {'{'} <span className="text-[#89B4FA]">useEffect</span>{headless && <>, <span className="text-[#89B4FA]">useState</span></>} {'}'} <span className="text-[#CBA6F7]">from</span> <span className="text-[#A6E3A1]">'react'</span>;{'\n\n'}
                <span className="text-[#CBA6F7]">export default function</span> <span className="text-[#89B4FA]">PostpipeAuthComponent</span>() {'{'}{'\n'}
                {headless && (
                    <React.Fragment>
                        <span className="text-[#89B4FA]">    const [user, setUser] = useState(null);</span>{'\n'}
                        <span className="text-[#89B4FA]">    const [error, setError] = useState(null);</span>{'\n\n'}
                    </React.Fragment>
                )}
                <span className="text-[#89B4FA]">    useEffect(() =&gt; {'{'}</span>{'\n'}
                <span className="text-[#89B4FA]">        if (typeof window !== 'undefined' &amp;&amp; (window as any).PostpipeAuth) {'{'}</span>{'\n'}
                <span className="text-[#89B4FA]">            (window as any).PostpipeAuth.init({'{'}</span>{'\n'}
                <span className="text-[#89B4FA]">                apiUrl: "{apiUrl}",</span>{'\n'}
                <span className="text-[#89B4FA]">                projectId: "{projectIdDisplay}",</span>{'\n'}
                <span className="text-[#89B4FA]">                providers: {providersListStr},</span>{'\n'}
                <span className="text-[#89B4FA]">                headless: {headless ? 'true' : 'false'},</span>{'\n'}
                <span className="text-[#89B4FA]">                redirectUrl: "{redirectDisplay}"</span>{envFrontendUrlAlias ? `,\n                envFrontendUrlAlias: "${envFrontendUrlAlias}"` : ''}{projectAlias ? `,\n                projectAlias: "${projectAlias}"` : ''}{targetDatabase && targetDatabase !== 'default' ? `,\n                targetDatabase: "${targetDatabase}"` : ''}{'\n'}
                <span className="text-[#89B4FA]">            {'}'});</span>{'\n\n'}
                <span className="text-[#89B4FA]">            (window as any).PostpipeAuth.on("success", (u: any) =&gt; {'{'}</span>{'\n'}
                <span className="text-[#89B4FA]">                console.log("Success!", u);</span>{'\n'}
                {headless && <span className="text-[#89B4FA]">                setUser(u);</span>}{'\n'}
                <span className="text-[#89B4FA]">            {'}'});</span>{'\n'}
                {headless && (
                    <span className="text-[#89B4FA]">            (window as any).PostpipeAuth.on("error", (err: any) =&gt; setError(err.message));</span>
                )}{'\n'}
                <span className="text-[#89B4FA]">        {'}'}</span>{'\n'}
                <span className="text-[#89B4FA]">    {'}'}, []);{'\n\n'}</span>
                {headless ? (
                    <React.Fragment>
                        <span className="text-[#CBA6F7]">    if (user) return &lt;div&gt;Welcome!&lt;/div&gt;;</span>{'\n\n'}
                        <span className="text-[#CBA6F7]">    return (</span>{'\n'}
                        <span className="text-[#89B4FA]">        &lt;form onSubmit={'{'}(ev) =&gt; {'{'} ev.preventDefault(); (window as any).PostpipeAuth.loginWithEmail(ev.target.email.value, ev.target.password.value); {'}'}{'}'} &gt;</span>{'\n'}
                        <span className="text-[#89B4FA]">            {'{'}error &amp;&amp; &lt;div style={'{'}{'{'} color: 'red' {'}'}{'}'} &gt; {'{'}error{'}'} &lt;/div&gt; {'}'}</span>{'\n'}
                        <span className="text-[#89B4FA]">            &lt;input name="email" placeholder="Email" /&gt;</span>{'\n'}
                        <span className="text-[#89B4FA]">            &lt;input name="password" type="password" /&gt;</span>{'\n'}
                        <span className="text-[#89B4FA]">            &lt;button type="submit"&gt;Login&lt;/button&gt;</span>{'\n'}
                        <span className="text-[#89B4FA]">        &lt;/form&gt;</span>{'\n'}
                        <span className="text-[#CBA6F7]">    );</span>
                    </React.Fragment>
                ) : (
                    <span className="text-[#CBA6F7]">    return &lt;div id="postpipe-auth" /&gt;;</span>
                )}{'\n'}
                {'}'}
            </React.Fragment>
        );
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateSnippet());
        toast({ title: "Copied!", description: "Auth snippet copied to clipboard." });

        if (providers.email && requireEmailVerification) {
            setTimeout(() => {
                const providerMessage = emailProvider === 'resend' ? "RESEND_API_KEY" : "SMTP_HOST and other Nodemailer variables";
                toast({
                    title: "Action Required",
                    description: "Remember to set " + providerMessage + " in your connector's .env to enable verification emails.",
                });
            }, 300);
        }
    };

    const handleSave = async () => {
        if (!presetName.trim()) {
            toast({ title: "Missing Name", description: "Please provide a name for this preset.", variant: "destructive" });
            return;
        }
        if (!selectedConnector) {
            toast({ title: "Missing Connector", description: "Please select a Connector.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("name", presetName);
            formData.append("connectorId", selectedConnector);
            formData.append("targetDatabase", targetDatabase);
            formData.append("projectId", projectId);
            formData.append("redirectUrl", redirectUrl);
            formData.append("envFrontendUrlAlias", envFrontendUrlAlias);
            formData.append("apiUrl", apiUrl);
            formData.append("providers", JSON.stringify({
                ...providers,
                requireEmailVerification,
                emailProvider,
                smtpHost,
                smtpPort,
                smtpUser,
                smtpPass
            }));

            let res;
            if (initialPreset) {
                res = await updateAuthPresetAction(initialPreset.id, formData);
            } else {
                res = await createAuthPresetAction(formData);
            }

            if (res.error) {
                toast({ title: "Error", description: res.error, variant: "destructive" });
            } else {
                toast({ title: "Success!", description: initialPreset ? "Auth Preset updated." : "Auth Preset saved successfully." });
                if (onSuccess) onSuccess();
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to save preset.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="bg-card dark:bg-white/[0.03] rounded-xl border border-border dark:border-white/5 p-6 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            Auth Configuration
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Beta</Badge>
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Generate plug-and-play authentication bound directly to your connected Postpipe databases.
                        </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-xl p-4 flex gap-3 text-orange-800 dark:text-orange-300 text-sm">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">Deployment Checklist:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Make sure your remote Postpipe Connector is running and updated.</li>
                                <li className="mt-2">
                                    <strong>Connector Configuration Required:</strong> Add these to your Connector's <code>.env</code> file:
                                    <div className="mt-2 bg-orange-100/50 dark:bg-orange-950/50 p-3 rounded-md text-xs font-mono space-y-1 border border-orange-200/50 dark:border-orange-900/50 overflow-x-auto selection:bg-orange-200 dark:selection:bg-orange-900 text-orange-900 dark:text-orange-200">
                                        {(() => {
                                            const getEnvKey = (key: string) => `${key}_${projectAlias}`;
                                            return (
                                                <React.Fragment>
                                                    <div className="text-orange-900/50 dark:text-orange-200/50"># Core Auth Settings</div>
                                                    <div>{getEnvKey('JWT_SECRET')}="<span className="opacity-50">your-super-secret-jwt-key</span>"</div>
                                                    <div>{envFrontendUrlAlias || 'FRONTEND_URL'}="<span className="opacity-50">https://your-app.com</span>"</div>
                                                    {providers.google && (
                                                        <React.Fragment>
                                                            <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># Google OAuth</div>
                                                            <div>{getEnvKey('GOOGLE_CLIENT_ID')}="<span className="opacity-50">your-google-client-id</span>"</div>
                                                            <div>{getEnvKey('GOOGLE_CLIENT_SECRET')}="<span className="opacity-50">your-google-client-secret</span>"</div>
                                                        </React.Fragment>
                                                    )}
                                                    {providers.github && (
                                                        <React.Fragment>
                                                            <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># GitHub OAuth</div>
                                                            <div>{getEnvKey('GITHUB_CLIENT_ID')}="<span className="opacity-50">your-github-client-id</span>"</div>
                                                            <div>{getEnvKey('GITHUB_CLIENT_SECRET')}="<span className="opacity-50">your-github-client-secret</span>"</div>
                                                        </React.Fragment>
                                                    )}
                                                    {providers.email && requireEmailVerification && (
                                                        <React.Fragment>
                                                            <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># Email Provider Choice</div>
                                                            <div>{getEnvKey('EMAIL_PROVIDER')}="{emailProvider}"</div>
                                                            {emailProvider === 'resend' ? (
                                                                <React.Fragment>
                                                                    <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># Resend Verification</div>
                                                                    <div>{getEnvKey('RESEND_API_KEY')}="<span className="opacity-50">your-resend-api-key</span>"</div>
                                                                    <div>{getEnvKey('RESEND_FROM_EMAIL')}="<span className="opacity-50">onboarding@resend.dev</span>"</div>
                                                                </React.Fragment>
                                                            ) : (
                                                                <React.Fragment>
                                                                    <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># Nodemailer (SMTP)</div>
                                                                    <div>{getEnvKey('SMTP_HOST')}="{smtpHost || '<span className="opacity-50">smtp.example.com</span>'}"</div>
                                                                    <div>{getEnvKey('SMTP_PORT')}="{smtpPort || '587'}"</div>
                                                                    <div>{getEnvKey('SMTP_USER')}="{smtpUser || '<span className="opacity-50">user@example.com</span>'}"</div>
                                                                    <div>{getEnvKey('SMTP_PASS')}="{smtpPass || '<span className="opacity-50">your-password</span>'}"</div>
                                                                    <div>{getEnvKey('SMTP_SECURE')}="{smtpPort === '465' ? 'true' : 'false'}"</div>
                                                                </React.Fragment>
                                                            )}
                                                        </React.Fragment>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })()}
                                    </div>
                                </li>
                                {providers.email && (
                                    <li className="mt-4">
                                        <strong>Password Reset Page:</strong> To handle password resets, create a page (e.g., <code>reset-password.html</code>) on your frontend domain and paste this exact same Auth Snippet there. Set <code>{envFrontendUrlAlias || 'FRONTEND_URL'}</code> in your connector's <code>.env</code> to point to this new page.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300 font-semibold text-sm">
                            <CheckCircle2 className="h-4 w-4" />
                            Next Steps for Beginners
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300">1</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground">Configure Env:</strong> Copy the orange snippet above and paste it into your Connector's <code>.env</code> file. Update the placeholders with your actual secrets.
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300">2</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground">Embed Snippet:</strong> Copy the code from the right panel and paste it into your website (e.g., <code>index.html</code>).
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-bold text-blue-700 dark:text-blue-300">3</div>
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                    <strong className="text-foreground">Catch Redirects:</strong> Create a matching <code>reset-password.html</code> and paste the same snippet there to handle password recovery.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                Preset Name
                            </label>
                            <Input
                                placeholder="e.g., Main App Login"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <label className="text-sm font-medium">Authentication Providers</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${providers.email ? 'border-foreground bg-accent/50' : 'hover:bg-muted/50'}`}>
                                <Checkbox
                                    checked={providers.email}
                                    onCheckedChange={() => handleProviderChange('email')}
                                    disabled={providers.email && !providers.google && !providers.github}
                                />
                                <span className="text-sm font-medium">Email / Password</span>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${providers.google ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                <Checkbox
                                    checked={providers.google}
                                    onCheckedChange={() => handleProviderChange('google')}
                                />
                                <span className="text-sm font-medium">Google OAuth</span>
                            </label>

                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${providers.github ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                                <Checkbox
                                    checked={providers.github}
                                    onCheckedChange={() => handleProviderChange('github')}
                                />
                                <span className="text-sm font-medium">GitHub OAuth</span>
                            </label>
                        </div>

                        {providers.email && (
                            <div className="mt-4 p-4 rounded-lg border bg-card shadow-sm space-y-4">
                                <h3 className="text-sm font-medium">Security & Verification</h3>
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <Checkbox
                                        checked={requireEmailVerification}
                                        onCheckedChange={(checked) => setRequireEmailVerification(!!checked)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="text-sm font-medium">Require Email Verification</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Users must verify their email address before they can log in.
                                        </p>
                                    </div>
                                </label>

                                {requireEmailVerification && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">Email Provider</label>
                                            <Select value={emailProvider} onValueChange={(val: any) => setEmailProvider(val)}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Select provider" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="resend">Resend (API)</SelectItem>
                                                    <SelectItem value="nodemailer">Nodemailer (SMTP)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {emailProvider === 'nodemailer' && (
                                            <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">SMTP Host</label>
                                                    <Input size={32} className="h-8 text-xs" placeholder="smtp.gmail.com" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">SMTP Port</label>
                                                    <Input size={32} className="h-8 text-xs" placeholder="587" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Username</label>
                                                    <Input size={32} className="h-8 text-xs" placeholder="user@gmail.com" value={smtpUser} onChange={e => setSmtpUser(e.target.value)} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Password</label>
                                                    <Input size={32} type="password" className="h-8 text-xs" placeholder="••••••••" value={smtpPass} onChange={e => setSmtpPass(e.target.value)} />
                                                </div>
                                            </div>
                                        )}

                                        {emailProvider === 'resend' && (
                                            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-blue-600 dark:text-blue-400">
                                                <p>Requires <strong>RESEND_API_KEY</strong> in your connector's .env file.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <label className="text-sm font-medium flex items-center gap-2">
                             <CheckCircle2 className={cn("h-4 w-4", headless ? "text-purple-500" : "text-muted-foreground")} />
                             Configuration Mode
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setHeadless(false)}
                                className={cn(
                                    "px-4 py-3 rounded-xl border text-left transition-all",
                                    !headless ? "bg-blue-500/10 border-blue-500/40" : "bg-transparent border-border hover:border-muted-foreground/30"
                                )}
                            >
                                <div className="font-bold text-xs mb-1">Managed UI</div>
                                <div className="text-[10px] text-muted-foreground leading-tight">Drop-in auth screens</div>
                            </button>
                            <button
                                onClick={() => setHeadless(true)}
                                className={cn(
                                    "px-4 py-3 rounded-xl border text-left transition-all",
                                    headless ? "bg-purple-500/10 border-purple-500/40" : "bg-transparent border-border hover:border-muted-foreground/30"
                                )}
                            >
                                <div className="font-bold text-xs mb-1">Headless</div>
                                <div className="text-[10px] text-muted-foreground leading-tight">Custom frontend only</div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                Project ID (Optional)
                            </label>
                            <Input
                                placeholder="e.g., prj_123456"
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Useful if multiplexing multiple endpoints in one frontend.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                Redirect URL (Optional)
                            </label>
                            <Input
                                placeholder="e.g., https://myapp.com/dashboard"
                                value={redirectUrl}
                                onChange={(e) => setRedirectUrl(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Where to send the user after successful authentication.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                Frontend URL .env Alias (Optional)
                            </label>
                            <Input
                                placeholder="e.g., YOUR_FRONTEND_URL"
                                value={envFrontendUrlAlias}
                                onChange={(e) => setEnvFrontendUrlAlias(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">The environment variable name your connector should use to read this frontend's URL (e.g., <code>FRONTEND_URL</code>).</p>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                    Connector
                                </label>
                                <Select value={selectedConnector} onValueChange={setSelectedConnector}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a Connector" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {connectors.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                    Target Collection / Table
                                </label>
                                <Select value={targetDatabase} onValueChange={setTargetDatabase}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a database" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Fallback Default Database</SelectItem>
                                        {availableDatabases.map(dbName => (
                                            <SelectItem key={dbName} value={dbName}>{dbName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Select where the `postpipe_users` table/collection will be instantiated.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                                    Auth API URL
                                </label>
                                <Input
                                    placeholder="e.g., https://my-connector.com/api/auth"
                                    value={apiUrl}
                                    onChange={(e) => {
                                        setApiUrl(e.target.value);
                                        setIsApiUrlManuallyEdited(true);
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">The fully qualified URL to your Connector's auth edge. Auto-inferred from selected connector.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Snippet Preview Panel */}
            <div className="bg-[#0D1117] rounded-xl border border-[#30363D] overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-[#161B22] border-b border-[#30363D]">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="flex bg-[#0D1117] rounded-md p-0.5 border border-[#30363D]">
                            <button
                                onClick={() => setCodeTab("html")}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                    codeTab === "html" ? "bg-[#30363D] text-white" : "text-[#8B949E] hover:text-white"
                                )}
                            >
                                HTML Snippet
                            </button>
                            <button
                                onClick={() => setCodeTab("react")}
                                className={cn(
                                    "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all",
                                    codeTab === "react" ? "bg-[#30363D] text-white" : "text-[#8B949E] hover:text-white"
                                )}
                            >
                                React Component
                            </button>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[#8B949E] hover:text-white hover:bg-[#30363D]" onClick={copyToClipboard}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy Code
                    </Button>
                </div>

                <div className="p-4 overflow-x-auto flex-1 text-[#E6EDF3]">
                    <pre className="text-sm font-mono leading-relaxed">
                        <code>
                            {renderSnippet()}
                        </code>
                    </pre>
                </div>

                <div className="p-4 border-t border-[#30363D] bg-[#161B22] flex justify-between">
                    <Button onClick={handleSave} disabled={isSaving} className="h-9">
                        {isSaving ? "Saving..." : "Save Configuration"}
                    </Button>
                    <Button onClick={copyToClipboard} variant="secondary" className="h-9">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Code
                    </Button>
                </div>
            </div>
        </div>
    );
}
