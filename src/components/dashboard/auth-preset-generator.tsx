"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy, Download, Link as LinkIcon, AlertCircle, Database } from "lucide-react";
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

export default function AuthPresetGenerator({ onSuccess, initialPreset }: { onSuccess?: () => void, initialPreset?: any }) {
    const router = useRouter();
    const [presetName, setPresetName] = React.useState(initialPreset?.name || "");
    const [isSaving, setIsSaving] = React.useState(false);

    const [providers, setProviders] = React.useState({
        email: initialPreset?.providers?.email ?? true,
        google: initialPreset?.providers?.google ?? false,
        github: initialPreset?.providers?.github ?? false
    });
    const [requireEmailVerification, setRequireEmailVerification] = React.useState(initialPreset?.providers?.requireEmailVerification || false);
    const [redirectUrl, setRedirectUrl] = React.useState(initialPreset?.redirectUrl || "");
    const [projectId, setProjectId] = React.useState(initialPreset?.projectId || "");
    const [targetDatabase, setTargetDatabase] = React.useState(initialPreset?.targetDatabase || "default");
    const [apiUrl, setApiUrl] = React.useState(initialPreset?.apiUrl || "http://localhost:3002/api/auth");

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

    const generateSnippet = () => {
        const activeProviders = Object.keys(providers).filter(k => providers[k as keyof typeof providers]);

        return `<!-- Place this where you want the Postpipe Auth UI to render -->
<div id="postpipe-auth"></div>

<!-- Include the Postpipe Auth CDN script -->
<script src="${window.location.origin}/api/public/cdn/auth.js${projectId ? `?projectId=${projectId}` : ''}"></script>

<!-- Initialize Postpipe Auth -->
<script>
    PostpipeAuth.init({
        apiUrl: "${apiUrl}",
        projectId: "${projectId || 'YOUR_PROJECT_ID'}",
        providers: ${JSON.stringify(activeProviders)},
        redirectUrl: ${(!redirectUrl || redirectUrl === 'window.location.origin') ? 'window.location.origin' : `"${redirectUrl}"`}${targetDatabase && targetDatabase !== 'default' ? `,\n        targetDatabase: "${targetDatabase}"` : ''}
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
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateSnippet());
        toast({ title: "Copied!", description: "Auth snippet copied to clipboard." });

        if (providers.email && requireEmailVerification) {
            setTimeout(() => {
                toast({
                    title: "Action Required",
                    description: "Remember to set RESEND_API_KEY in your connector's .env to enable verification emails.",
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
            {/* Configuration Panel */}
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
                                        <div className="text-orange-900/50 dark:text-orange-200/50"># Core Auth Settings</div>
                                        <div>CONNECTOR_SECRET="<span className="opacity-50">your-super-secret-jwt-key</span>"</div>

                                        {providers.google && (
                                            <>
                                                <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># Google OAuth</div>
                                                <div>GOOGLE_CLIENT_ID="<span className="opacity-50">your-google-client-id</span>"</div>
                                                <div>GOOGLE_CLIENT_SECRET="<span className="opacity-50">your-google-client-secret</span>"</div>
                                            </>
                                        )}

                                        {providers.github && (
                                            <>
                                                <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># GitHub OAuth</div>
                                                <div>GITHUB_CLIENT_ID="<span className="opacity-50">your-github-client-id</span>"</div>
                                                <div>GITHUB_CLIENT_SECRET="<span className="opacity-50">your-github-client-secret</span>"</div>
                                            </>
                                        )}

                                        {providers.email && requireEmailVerification && (
                                            <>
                                                <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># Email Provider Choice</div>
                                                <div>EMAIL_PROVIDER="{emailProvider}"</div>

                                                {emailProvider === 'resend' ? (
                                                    <>
                                                        <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># Resend Verification</div>
                                                        <div>RESEND_API_KEY="<span className="opacity-50">your-resend-api-key</span>"</div>
                                                        <div>RESEND_FROM_EMAIL="<span className="opacity-50">onboarding@resend.dev</span>"</div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-orange-900/50 dark:text-orange-200/50 mt-2"># Nodemailer (SMTP)</div>
                                                        <div>SMTP_HOST="{smtpHost || '<span className="opacity-50">smtp.example.com</span>'}"</div>
                                                        <div>SMTP_PORT="{smtpPort || '587'}"</div>
                                                        <div>SMTP_USER="{smtpUser || '<span className="opacity-50">user@example.com</span>'}"</div>
                                                        <div>SMTP_PASS="{smtpPass || '<span className="opacity-50">your-password</span>'}"</div>
                                                        <div>SMTP_SECURE="{smtpPort === '465' ? 'true' : 'false'}"</div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </li>
                            </ul>
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Snippet Preview Panel */}
            <div className="bg-[#0D1117] rounded-xl border border-[#30363D] overflow-hidden flex flex-col shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 bg-[#161B22] border-b border-[#30363D]">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-xs text-[#8B949E] font-mono ml-2">postpipe-auth-snippet.html</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 text-[#8B949E] hover:text-white hover:bg-[#30363D]" onClick={copyToClipboard}>
                        <Copy className="h-3.5 w-3.5 mr-1.5" />
                        Copy Code
                    </Button>
                </div>

                <div className="p-4 overflow-x-auto flex-1 text-[#E6EDF3]">
                    <pre className="text-sm font-mono leading-relaxed">
                        <code>
                            <span className="text-[#7EE787]">&lt;!-- Place this where you want the Postpipe Auth UI to render --&gt;</span>
                            {'\n'}
                            <span className="text-[#89B4FA]">&lt;div</span> <span className="text-[#F38BA8]">id</span>=<span className="text-[#A6E3A1]">"postpipe-auth"</span><span className="text-[#89B4FA]">&gt;&lt;/div&gt;</span>
                            {'\n\n'}
                            <span className="text-[#7EE787]">&lt;!-- Include the Postpipe Auth CDN script --&gt;</span>
                            {'\n'}
                            <span className="text-[#89B4FA]">&lt;script</span> <span className="text-[#F38BA8]">src</span>=<span className="text-[#A6E3A1]">"{`${window.location.origin}/api/public/cdn/auth.js${projectId ? `?projectId=${projectId}` : ''}`}"</span><span className="text-[#89B4FA]">&gt;&lt;/script&gt;</span>
                            {'\n\n'}
                            <span className="text-[#89B4FA]">&lt;script&gt;</span>{'\n'}
                            <span className="text-[#89B4FA]">PostpipeAuth</span>.<span className="text-[#89B4FA]">init</span>({`{`}{'\n'}
                            <span className="text-[#89B4FA]">    apiUrl</span>: <span className="text-[#A6E3A1]">"{apiUrl}"</span>,{'\n'}
                            <span className="text-[#89B4FA]">    projectId</span>: <span className="text-[#A6E3A1]">"{projectId || 'YOUR_PROJECT_ID'}"</span>,{'\n'}
                            <span className="text-[#89B4FA]">    providers</span>: <span className="text-[#F9E2AF]">{JSON.stringify(Object.keys(providers).filter(k => providers[k as keyof typeof providers]))}</span>,{'\n'}
                            <span className="text-[#89B4FA]">    redirectUrl</span>: {redirectUrl ? <span className="text-[#A6E3A1]">"{redirectUrl}"</span> : <span className="text-[#F9E2AF]">window.location.href</span>}{targetDatabase && targetDatabase !== 'default' ? `,\n    targetDatabase: "${targetDatabase}"` : ''}{'\n'}
                            {`}`});{'\n\n'}
                            <span className="text-[#7EE787]">// Handle Auth Events</span>{'\n'}
                            <span className="text-[#89B4FA]">PostpipeAuth</span>.<span className="text-[#89B4FA]">on</span>(<span className="text-[#A6E3A1]">"success"</span>, (<span className="text-[#F38BA8]">user</span>) <span className="text-[#CBA6F7]">=&gt;</span> {`{`}{'\n'}
                            <span className="text-[#89B4FA]">    console</span>.<span className="text-[#89B4FA]">log</span>(<span className="text-[#A6E3A1]">"Authenticated User:"</span>, user);{'\n'}
                            {`}`});{'\n\n'}
                            <span className="text-[#89B4FA]">PostpipeAuth</span>.<span className="text-[#89B4FA]">on</span>(<span className="text-[#A6E3A1]">"error"</span>, (<span className="text-[#F38BA8]">error</span>) <span className="text-[#CBA6F7]">=&gt;</span> {`{`}{'\n'}
                            <span className="text-[#89B4FA]">    console</span>.<span className="text-[#89B4FA]">error</span>(<span className="text-[#A6E3A1]">"Authentication Error:"</span>, error);{'\n'}
                            {`}`});{'\n'}
                            <span className="text-[#89B4FA]">&lt;/script&gt;</span>
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
