"use client";

import * as React from "react";
import Link from 'next/link';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Plus,
    Copy,
    Code,
    Eye,
    Edit,
    PauseCircle,
    PlayCircle,
    CopyPlus,
    Trash2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { deleteFormAction, duplicateFormAction, toggleFormStatusAction } from "@/app/actions/dashboard";

type Form = {
    id: string;
    name: string;
    connectorName: string;
    submissions: number;
    lastSubmission: string;
    status: "Live" | "Paused";
    fields: any[]; // Store fields for embed generation
};


interface FormsClientProps {
    initialForms: any[];
}



export default function FormsClient({ initialForms = [] }: FormsClientProps) {
    const router = useRouter();

    // Helper to map DB form to UI form
    // Helper to map DB form to UI form
    const mapForms = (data: any[]) => data.map((f: any) => {
        const subCount = f.submissions?.length || 0;
        let lastSub = "Never";

        if (subCount > 0 && f.submissions) {
            // Sort by date descending
            const sorted = [...f.submissions].sort((a: any, b: any) =>
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
            );
            if (sorted[0]) {
                lastSub = new Date(sorted[0].submittedAt).toLocaleDateString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
            }
        }

        return {
            id: f.id,
            name: f.name,
            connectorName: f.connectorName || "Standard Connector",
            submissions: subCount,
            lastSubmission: lastSub,
            status: f.status || "Live",
            fields: f.fields || []
        };
    });

    const [forms, setForms] = React.useState<Form[]>(mapForms(initialForms));

    // Sync with server data when it changes (e.g. after duplication)
    React.useEffect(() => {
        setForms(mapForms(initialForms));
    }, [initialForms]);

    const toggleStatus = async (id: string) => {
        const form = forms.find(f => f.id === id);
        if (!form) return;

        // Optimistic update
        const newStatus = form.status === 'Live' ? 'Paused' : 'Live';
        setForms(prev => prev.map(f => {
            if (f.id === id) {
                return { ...f, status: newStatus };
            }
            return f;
        }));

        toast({ description: `Form ${newStatus === 'Live' ? 'resumed' : 'paused'}` });

        try {
            await toggleFormStatusAction(id);
            router.refresh();
        } catch (e) {
            // Revert on failure
            setForms(prev => prev.map(f => {
                if (f.id === id) {
                    return { ...f, status: form.status };
                }
                return f;
            }));
            toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        }
    };

    const handleDuplicate = async (id: string) => {
        toast({ description: "Duplicating form..." });
        try {
            await duplicateFormAction(id);
            toast({ title: "Success", description: "Form duplicated." });
            router.refresh(); // This will trigger the prop update and useEffect
        } catch (e) {
            toast({ title: "Error", description: "Failed to duplicate form", variant: "destructive" });
        }
    };

    const deleteForm = async (id: string) => {
        try {
            // Optimistic update
            setForms(prev => prev.filter(f => f.id !== id));

            // Server Action
            await deleteFormAction(id);

            toast({ title: "Form Deleted", description: "The form has been permanently removed.", variant: "destructive" });
            router.refresh();
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete form", variant: "destructive" });
        }
    };

    const copyEmbed = (id: string) => {
        const form = forms.find(f => f.id === id);
        if (!form) return;

        const embedCode = `
<form action="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/public/submit/${id}" method="POST">
${form.fields.map((f: any) => `  <div>
    <label>${f.name}</label>
    <input type="${f.type}" name="${f.name}" ${f.required ? 'required' : ''} />
  </div>`).join('\n')}
  <button type="submit">Submit</button>
</form>`.trim();

        navigator.clipboard.writeText(embedCode);
        toast({ title: "Embed Code Copied", description: "Paste this into your website HTML." });
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Static Forms</h1>
                    <p className="text-muted-foreground">
                        Manage your backendless forms and connections.
                    </p>
                </div>
                <Link href="/dashboard/forms/new">
                    <RainbowButton className="h-9 px-4 text-xs text-white">
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        <span className="whitespace-pre-wrap text-center font-medium leading-none tracking-tight">
                            New Form
                        </span>
                    </RainbowButton>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Form Name</TableHead>
                            <TableHead>Linked Connector</TableHead>
                            <TableHead className="text-right">Submissions</TableHead>
                            <TableHead>Last Submission</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {forms.map((form) => (
                            <TableRow key={form.id}>
                                <TableCell className="font-medium">{form.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                                        {form.connectorName}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{form.submissions.toLocaleString()}</TableCell>
                                <TableCell className="text-muted-foreground">{form.lastSubmission}</TableCell>
                                <TableCell>
                                    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", form.status === 'Live' ? "text-foreground" : "text-muted-foreground")}>
                                        {form.status === 'Live' ? (
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                            </span>
                                        ) : (
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                                        )}
                                        {form.status}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center gap-1 justify-end">
                                        <Link href={`/dashboard/forms/${form.id}/edit`}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-transparent hover:text-white hover:scale-110 transition-all duration-300">
                                                <Edit className="h-4 w-4" />
                                                <span className="sr-only">Edit</span>
                                            </Button>
                                        </Link>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] hover:bg-[length:200%] hover:animate-rainbow hover:text-white hover:shadow-[0_0_20px_hsl(var(--color-1))] hover:!bg-transparent data-[state=open]:!bg-transparent transition-all duration-300">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Form Actions</DropdownMenuLabel>
                                                <Link href={`/dashboard/forms/${form.id}/submissions`}>
                                                    <DropdownMenuItem>
                                                        <Eye className="mr-2 h-4 w-4" /> View Submissions
                                                    </DropdownMenuItem>
                                                </Link>
                                                <Link href={`/dashboard/forms/${form.id}/edit`}>
                                                    <DropdownMenuItem>
                                                        <Edit className="mr-2 h-4 w-4" /> Edit Form
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => copyEmbed(form.id)}>
                                                    <Code className="mr-2 h-4 w-4" /> Copy Embed HTML
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDuplicate(form.id)}>
                                                    <CopyPlus className="mr-2 h-4 w-4" /> Duplicate Form
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => toggleStatus(form.id)}>
                                                    {form.status === 'Live' ? (
                                                        <>
                                                            <PauseCircle className="mr-2 h-4 w-4 text-orange-500" /> <span className="text-orange-500">Pause Form</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PlayCircle className="mr-2 h-4 w-4 text-green-500" /> <span className="text-green-500">Resume Form</span>
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => deleteForm(form.id)} className="text-destructive focus:text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Form
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div >
    );
}
