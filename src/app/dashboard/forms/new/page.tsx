"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Code, Save, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

type FormField = {
    id: string;
    label: string;
    type: "text" | "email" | "textarea" | "number";
    required: boolean;
};

export default function NewFormPage() {
    const [formName, setFormName] = useState("");
    const [connector, setConnector] = useState("");
    const [fields, setFields] = useState<FormField[]>([
        { id: "1", label: "Full Name", type: "text", required: true },
        { id: "2", label: "Email Address", type: "email", required: true },
        { id: "3", label: "Message", type: "textarea", required: true },
    ]);
    const [generatedId, setGeneratedId] = useState<string | null>(null);

    const addField = () => {
        setFields([...fields, { id: Date.now().toString(), label: "New Field", type: "text", required: false }]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, key: keyof FormField, value: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const handleSave = () => {
        if (!formName || !connector) {
            toast({ title: "Validation Error", description: "Please provide a name and select a connector.", variant: "destructive" });
            return;
        }

        // Mock Save
        const mockId = `form_${Date.now().toString(36)}`;
        setGeneratedId(mockId);
        toast({ title: "Form Saved", description: "Your form is ready to embed." });
    };

    const embedCodeHTML = generatedId ? `
<form action="https://api.postpipe.dev/web/submit/${generatedId}" method="POST">
${fields.map(f => `  <div>
    <label>${f.label}</label>
    <input type="${f.type}" name="${f.label.toLowerCase().replace(/\s/g, '_')}" ${f.required ? 'required' : ''} />
  </div>`).join('\n')}
  <button type="submit">Submit</button>
</form>`.trim() : "";

    const embedCodeReact = generatedId ? `
const MyForm = () => {
  return (
    <form action="https://api.postpipe.dev/web/submit/${generatedId}" method="POST">
${fields.map(f => `      <div>
        <label>${f.label}</label>
        <input type="${f.type}" name="${f.label.toLowerCase().replace(/\s/g, '_')}" ${f.required ? 'required' : ''} />
      </div>`).join('\n')}
      <button type="submit">Submit</button>
    </form>
  );
}`.trim() : "";

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/forms">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create New Form</h1>
                    <p className="text-muted-foreground text-sm">Design your form and connect it to a database.</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={() => setFields([])}>Reset</Button>
                    <RainbowButton className="h-9 px-6" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save Form
                    </RainbowButton>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Builder */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Form Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Form Name</Label>
                                <Input placeholder="e.g. Contact Us" value={formName} onChange={e => setFormName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Select Connector</Label>
                                <Select value={connector} onValueChange={setConnector}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose where data goes..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="c1">Primary Prod (Verified)</SelectItem>
                                        <SelectItem value="c2">Dev Local (Verified)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Form Fields</h3>
                            <Button size="sm" variant="outline" onClick={addField}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> Add Field
                            </Button>
                        </div>

                        {fields.map((field, index) => (
                            <Card key={field.id} className="relative group">
                                <CardContent className="p-4 flex gap-4 items-start">
                                    <div className="mt-3 text-muted-foreground cursor-move"><GripVertical className="h-4 w-4" /></div>
                                    <div className="grid gap-4 flex-1 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Label</Label>
                                            <Input value={field.label} onChange={e => updateField(field.id, "label", e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select value={field.type} onValueChange={val => updateField(field.id, "type", val)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Text Input</SelectItem>
                                                    <SelectItem value="email">Email</SelectItem>
                                                    <SelectItem value="textarea">Text Area</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch id={`req-${field.id}`} checked={field.required} onCheckedChange={checked => updateField(field.id, "required", checked)} />
                                            <Label htmlFor={`req-${field.id}`}>Required</Label>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeField(field.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Right Column: Preview/Code */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Generated Embed</CardTitle>
                            <CardDescription>
                                {generatedId ? "Copy this code to your website." : "Save your form to generate code."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {generatedId ? (
                                <Tabs defaultValue="html">
                                    <TabsList className="w-full mb-4">
                                        <TabsTrigger value="html" className="flex-1">HTML</TabsTrigger>
                                        <TabsTrigger value="react" className="flex-1">React</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="html">
                                        <div className="relative">
                                            <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto max-h-[400px]">
                                                {embedCodeHTML}
                                            </pre>
                                            <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-6 w-6" onClick={() => navigator.clipboard.writeText(embedCodeHTML)}>
                                                <Code className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="react">
                                        <div className="relative">
                                            <pre className="bg-muted p-4 rounded-md text-xs font-mono overflow-auto max-h-[400px]">
                                                {embedCodeReact}
                                            </pre>
                                            <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-6 w-6" onClick={() => navigator.clipboard.writeText(embedCodeReact)}>
                                                <Code className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <div className="h-[200px] flex items-center justify-center border-2 border-dashed rounded-md text-muted-foreground text-sm bg-muted/20">
                                    Click "Save Form" to generate code
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
