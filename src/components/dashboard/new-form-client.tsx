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
import { createFormAction, getConnectorsAction, updateFormAction } from "@/app/actions/builder";
import { useEffect } from "react";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type FormField = {
    id: string;
    label: string;
    type: "text" | "email" | "textarea" | "number";
    required: boolean;
};

type NewFormClientProps = {
    onBack?: () => void;
    initialData?: any; // Form data for editing
};

// Sortable Item Component
function SortableField({
    field,
    updateField,
    removeField
}: {
    field: FormField;
    updateField: (id: string, key: keyof FormField, value: any) => void;
    removeField: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Card className={`relative group ${isDragging ? "opacity-50" : ""}`}>
                <CardContent className="p-4 flex gap-4 items-start">
                    {/* Drag Handle */}
                    <div
                        className="mt-3 text-muted-foreground cursor-grab active:cursor-grabbing hover:text-foreground transition-colors"
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="grid gap-4 flex-1 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                                value={field.label}
                                onChange={e => updateField(field.id, "label", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={field.type}
                                onValueChange={val => updateField(field.id, "type", val)}
                            >
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
                            <Switch
                                id={`req-${field.id}`}
                                checked={field.required}
                                onCheckedChange={checked => updateField(field.id, "required", checked)}
                            />
                            <Label htmlFor={`req-${field.id}`}>Required</Label>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeField(field.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function NewFormClient({ onBack, initialData }: NewFormClientProps) {
    const [formName, setFormName] = useState(initialData?.name || "");
    const [connector, setConnector] = useState(initialData?.connectorId || "");
    const [targetDb, setTargetDb] = useState(initialData?.targetDatabase || "default");

    // Convert fields from DB format ({name, type, required}) to Client format ({id, label, type, required})
    const initialFields = initialData?.fields
        ? initialData.fields.map((f: any, i: number) => ({
            id: i.toString(),
            label: f.name,
            type: f.type,
            required: f.required
        }))
        : [
            { id: "1", label: "Full Name", type: "text", required: true },
            { id: "2", label: "Email Address", type: "email", required: true },
            { id: "3", label: "Message", type: "textarea", required: true },
        ];

    const [fields, setFields] = useState<FormField[]>(initialFields);
    const [generatedId, setGeneratedId] = useState<string | null>(initialData?.id || null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require drag movement of 5px before activation
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addField = () => {
        setFields([...fields, { id: Date.now().toString(), label: "New Field", type: "text", required: false }]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, key: keyof FormField, value: any) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    // Load connectors on mount
    const [connectors, setConnectors] = useState<any[]>([]);
    useEffect(() => {
        getConnectorsAction().then(data => {
            setConnectors(data);
        });
    }, []);

    const handleSave = async () => {
        if (!formName || !connector) {
            toast({ title: "Validation Error", description: "Please provide a name and select a connector.", variant: "destructive" });
            return;
        }

        const formData = new FormData();
        formData.append('name', formName);
        formData.append('connectorId', connector);
        if (targetDb) formData.append('targetDatabase', targetDb);
        // Map fields to match simple structure expected by server
        const simplifiedFields = fields.map(f => ({ name: f.label, type: f.type, required: f.required }));
        formData.append('fields', JSON.stringify(simplifiedFields));

        try {
            let res;
            if (initialData?.id) {
                // Update existing
                res = await updateFormAction(initialData.id, formData);
                if (res.error) {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                } else {
                    toast({ title: "Form Updated", description: "Your changes have been saved." });
                }
            } else {
                // Create new
                res = await createFormAction(formData);
                if (res.error) {
                    toast({ title: "Error", description: res.error, variant: "destructive" });
                } else {
                    setGeneratedId(res.formId || '');
                    toast({ title: "Form Saved", description: "Your form is ready to embed." });
                }
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to save form.", variant: "destructive" });
        }
    };

    const embedCodeHTML = generatedId ? `
<form action="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/public/submit/${generatedId}" method="POST">
${fields.map(f => `  <div>
    <label>${f.label}</label>
    <input type="${f.type}" name="${f.label}" ${f.required ? 'required' : ''} />
  </div>`).join('\n')}
  <button type="submit">Submit</button>
</form>`.trim() : "";

    const embedCodeReact = generatedId ? `
const MyForm = () => {
  return (
    <form action="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002'}/api/public/submit/${generatedId}" method="POST">
${fields.map(f => `      <div>
        <label>${f.label}</label>
        <input type="${f.type}" name="${f.label}" ${f.required ? 'required' : ''} />
      </div>`).join('\n')}
      <button type="submit">Submit</button>
    </form>
  );
}`.trim() : "";

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                {onBack ? (
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                ) : (
                    <Link href="/dashboard/forms">
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                )}
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{initialData ? "Edit Form" : "Create New Form"}</h1>
                    <p className="text-muted-foreground text-sm">Design your form and connect it to a database.</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={() => setFields([])}>Reset</Button>
                    <RainbowButton className="h-9 px-6" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> {initialData ? "Update Form" : "Save Form"}
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
                                        {connectors.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Target Database</Label>
                                <Select value={targetDb} onValueChange={setTargetDb}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select target database..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="default">Default (default)</SelectItem>
                                        {connector && connectors.find((c: any) => c.id === connector)?.databases && Object.keys(connectors.find((c: any) => c.id === connector)?.databases || {}).map((key: string) => (
                                            <SelectItem key={key} value={key}>{key}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Select where submissions should be routed.</p>
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

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={fields.map(f => f.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4">
                                    {fields.map((field) => (
                                        <SortableField
                                            key={field.id}
                                            field={field}
                                            updateField={updateField}
                                            removeField={removeField}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
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
