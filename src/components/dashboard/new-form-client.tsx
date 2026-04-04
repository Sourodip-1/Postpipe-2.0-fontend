"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Code, Save, GripVertical, Clipboard, Check, AlertCircle, Settings, Layers, Send, Lock, Sparkles, Database, Shield, RotateCcw, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPES, getGroupedFieldTypes } from "@/config/field-types";
import { ReferenceFieldConfig } from "@/components/ui/reference-input";
import { RainbowButton } from "@/components/ui/rainbow-button";
import Loader from "@/components/ui/loader";
import { BorderBeam } from "@/components/ui/border-beam";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { toast } from "@/hooks/use-toast";
import { createFormAction, getConnectorsAction, updateFormAction } from "@/app/actions/builder";
import { getFormsAction } from "@/app/actions/dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { inferCollectionFromFieldName } from "@/lib/reference-utils";

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
    type: string; // keyof typeof FIELD_TYPES
    required: boolean;
    options?: string;
    isRelationalSource?: boolean;
    reference?: {
        collection: string;
        displayField?: string;
    };
};

/** The set of field types that trigger the reference config panel */
const REFERENCE_TYPES = new Set(["reference"]);

type NewFormClientProps = {
    onBack?: () => void;
    initialData?: any; // Form data for editing
};

// Sortable Item Component
function SortableField({ field, updateField, removeField, isNew, availableCollections }: {
    field: FormField;
    updateField: (id: string, key: keyof FormField, value: any) => void;
    removeField: (id: string) => void;
    isNew?: boolean;
    availableCollections?: { id: string; name: string; fields?: { name: string; type: string }[] }[];
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });
    const [typeSearch, setTypeSearch] = useState("");

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        position: isDragging ? "relative" as const : "static" as const,
    };

    const filteredGroups = useMemo(() => {
        const q = typeSearch.toLowerCase();
        if (!q) return getGroupedFieldTypes();
        const result: Record<string, { value: string; label: string }[]> = {};
        Object.entries(getGroupedFieldTypes()).forEach(([cat, items]) => {
            const matched = items.filter(f => f.label.toLowerCase().includes(q) || f.value.toLowerCase().includes(q));
            if (matched.length) result[cat] = matched;
        });
        return result;
    }, [typeSearch]);

    const isReferenceType = REFERENCE_TYPES.has(field.type);

    // When switching TO a reference type, auto-suggest a collection from the label
    const handleTypeChange = (val: string) => {
        updateField(field.id, "type", val);
        setTypeSearch("");
        if (REFERENCE_TYPES.has(val) && !field.reference?.collection) {
            const suggested = inferCollectionFromFieldName(field.label);
            updateField(field.id, "reference", {
                collection: suggested,
                displayField: "name",
            });
        }
        // Clear reference when switching away from reference type
        if (!REFERENCE_TYPES.has(val) && field.reference) {
            updateField(field.id, "reference", undefined);
        }
    };

    return (
        <div id={`field-card-${field.id}`} ref={setNodeRef} style={style} className="relative mt-2">
            <div className={`relative group rounded-xl border bg-black/40 backdrop-blur-md shadow-sm transition-all duration-300 ${
                isDragging ? "opacity-50 scale-[0.98] ring-2 ring-primary/50" :
                isNew ? "border-emerald-500/50 ring-2 ring-emerald-500/30 shadow-[0_0_12px_rgba(52,211,153,0.2)]" :
                isReferenceType ? "border-violet-500/30 hover:border-violet-400/50" :
                "hover:border-primary/30 border-white/5"
            }`}>
                {/* Subtle violet glow on reference fields */}
                {isReferenceType && !isDragging && (
                    <div className="absolute inset-0 rounded-xl bg-violet-500/5 pointer-events-none" />
                )}

                <div className="p-4 flex gap-3 items-start relative z-10">
                    <div className="mt-2 text-neutral-500 cursor-grab active:cursor-grabbing hover:text-white transition-colors" {...attributes} {...listeners}>
                        <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="grid gap-3 flex-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-neutral-400 uppercase tracking-wider">Label</Label>
                                <Input value={field.label} onChange={e => updateField(field.id, "label", e.target.value)} className="h-8 text-xs bg-white/5 border-white/10 text-white" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] text-neutral-400 uppercase tracking-wider">
                                    Type
                                    {isReferenceType && (
                                        <span className="ml-1.5 text-[8px] text-violet-400 bg-violet-500/15 border border-violet-500/25 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                                            relational
                                        </span>
                                    )}
                                </Label>
                                <Select value={field.type} onValueChange={handleTypeChange}>
                                    <SelectTrigger className={`h-8 text-xs border-white/10 text-white ${
                                        isReferenceType ? "bg-violet-500/10 border-violet-500/30" : "bg-white/5"
                                    }`}><SelectValue /></SelectTrigger>
                                    <SelectContent className="max-h-[340px] p-0">
                                        {/* Search input */}
                                        <div className="sticky top-0 z-20 bg-[#09090D] border-b border-white/5 px-2 py-1.5">
                                            <input
                                                autoFocus
                                                placeholder="Search types…"
                                                value={typeSearch}
                                                onChange={e => setTypeSearch(e.target.value)}
                                                onKeyDown={e => e.stopPropagation()}
                                                className="w-full bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-indigo-500/50"
                                            />
                                        </div>
                                        <div className="overflow-y-auto max-h-[260px]">
                                            {Object.keys(filteredGroups).length === 0 ? (
                                                <p className="py-4 text-center text-xs text-neutral-500">No types found</p>
                                            ) : (
                                                Object.entries(filteredGroups).map(([category, ftypes]) => (
                                                    <SelectGroup key={category}>
                                                        <SelectLabel className={`text-xs font-semibold bg-black/40 px-2 py-1 uppercase tracking-wider sticky top-0 z-10 ${
                                                            category === 'Reference' ? 'text-violet-300' : 'text-indigo-300'
                                                        }`}>{category}</SelectLabel>
                                                        {ftypes.map(f => (
                                                            <SelectItem key={f.value} value={f.value} className="pl-6 text-xs hover:bg-white/5 cursor-pointer">
                                                                {f.label}
                                                                {REFERENCE_TYPES.has(f.value) && (
                                                                    <span className="ml-2 text-[9px] text-violet-400">🔗</span>
                                                                )}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                ))
                                            )}
                                        </div>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Enum Options */}
                        {field.type === 'enum' && (
                            <div className="pt-2">
                                <Label className="text-[10px] text-neutral-400 uppercase tracking-wider">Options (Comma-separated)</Label>
                                <Input value={field.options || ""} onChange={e => updateField(field.id, "options", e.target.value)} placeholder="e.g. user, admin, guest" className="h-8 text-xs bg-white/5 border-white/10 text-white mt-1" />
                            </div>
                        )}

                        {/* ── Reference Configuration Panel ── */}
                        {isReferenceType && (
                            <div className="pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                <ReferenceFieldConfig
                                    value={field.reference}
                                    onChange={(ref) => updateField(field.id, "reference", ref)}
                                    collections={availableCollections || []}
                                    compact={false}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                            <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                    <Switch id={`req-${field.id}`} checked={field.required} onCheckedChange={checked => updateField(field.id, "required", checked)} className="scale-75 origin-left" />
                                    <Label htmlFor={`req-${field.id}`} className="text-xs text-neutral-300 font-normal">Required</Label>
                                </div>
                                {!isReferenceType && (
                                    <div className="flex items-center space-x-2">
                                        <Switch id={`rel-${field.id}`} checked={field.isRelationalSource || false} onCheckedChange={checked => updateField(field.id, "isRelationalSource", checked)} className="scale-75 origin-left" />
                                        <Label htmlFor={`rel-${field.id}`} className="text-xs text-emerald-300 font-normal">Make Relational Field</Label>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {isReferenceType && field.reference?.collection && (
                                    <span className="text-[9px] text-violet-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Link2 className="w-2.5 h-2.5" />
                                        → {field.reference.collection}
                                    </span>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100" onClick={() => removeField(field.id)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return (
        <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8 hover:bg-white/10 text-neutral-400" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
        </Button>
    );
}

export default function NewFormClient({ onBack, initialData }: NewFormClientProps) {
    const [formName, setFormName] = useState(initialData?.name || "");
    const [tempName, setTempName] = useState("");
    const [connector, setConnector] = useState(initialData?.connectorId || "");
    const [targetDb, setTargetDb] = useState(initialData?.targetDatabase || "default");
    const [activeTab, setActiveTab] = useState("build");
    const [addPulse, setAddPulse] = useState(false);
    const [newFieldId, setNewFieldId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const initialFields = initialData?.fields
        ? initialData.fields.map((f: any, i: number) => ({
            id: i.toString(),
            label: f.name,
            type: f.type,
            required: f.required,
            options: f.options,
            isRelationalSource: f.isRelationalSource,
            reference: f.reference, // preserve existing reference configs
        }))
        : [
            { id: "1", label: "Full Name", type: "text", required: true },
            { id: "2", label: "Email Address", type: "email", required: true },
            { id: "3", label: "Message", type: "textarea", required: false },
        ];

    const [fields, setFields] = useState<FormField[]>(initialFields);
    const [generatedId, setGeneratedId] = useState<string | null>(initialData?.id || null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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
        const id = Date.now().toString();
        setFields(prev => [...prev, { id, label: "New Field", type: "text", required: false }]);
        setNewFieldId(id);
        setAddPulse(true);
        setTimeout(() => setAddPulse(false), 600);
        setTimeout(() => setNewFieldId(null), 1000);
        // Scroll to bottom of the field list after render
        requestAnimationFrame(() => {
            const el = document.getElementById(`field-card-${id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
    };
    const removeField = (id: string) => setFields(fields.filter(f => f.id !== id));
    const updateField = (id: string, key: keyof FormField, value: any) => setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));

    const [broadcastTargets, setBroadcastTargets] = useState<string[]>(initialData?.routing?.broadcast || []);
    const [splits, setSplits] = useState<{ target: string; fields: string[]; excludeFromMain?: boolean }[]>(initialData?.routing?.splits || []);
    const [maskedFields, setMaskedFields] = useState<string[]>(initialData?.routing?.transformations?.mask || []);
    const [hashedFields, setHashedFields] = useState<string[]>(initialData?.routing?.transformations?.hash || []);

    const [connectors, setConnectors] = useState<any[]>([]);
    const [availableForms, setAvailableForms] = useState<any[]>([]);

    useEffect(() => {
        getConnectorsAction().then(data => setConnectors(data));
        // Load existing forms as available collections for reference fields
        getFormsAction().then((forms: any[]) => {
            setAvailableForms(forms.map((f: any) => ({
                id: f.id,
                name: f.name,
                fields: (f.fields || []).map((ff: any) => ({ name: ff.name, type: ff.type, isRelationalSource: ff.isRelationalSource })),
            })));
        }).catch(() => {
            // Non-critical — silently fail if forms can't be loaded
        });
    }, []);

    const selectedConnectorData = connectors.find((c: any) => c.id === connector);
    const availableDatabases = selectedConnectorData?.databases ? Object.keys(selectedConnectorData.databases) : [];

    const toggleBroadcast = (dbName: string) => setBroadcastTargets(prev => prev.includes(dbName) ? prev.filter(t => t !== dbName) : [...prev, dbName]);
    const addSplit = () => setSplits([...splits, { target: "", fields: [] }]);
    const updateSplit = (index: number, key: keyof typeof splits[0], value: any) => {
        const newSplits = [...splits];
        // @ts-ignore
        newSplits[index][key] = value;
        setSplits(newSplits);
    };
    const removeSplit = (index: number) => setSplits(splits.filter((_, i) => i !== index));

    const handleSave = async () => {
        if (!formName || !connector) {
            toast({ title: "Validation Error", description: "Please provide a form name and select a connector.", variant: "destructive" });
            setActiveTab("settings");
            return;
        }

        setIsSaving(true);

        const formData = new FormData();
        formData.append('name', formName);
        formData.append('connectorId', connector);
        if (targetDb) formData.append('targetDatabase', targetDb);
        const simplifiedFields = fields.map(f => ({
            name: f.label,
            type: f.type,
            required: f.required,
            options: f.options,
            isRelationalSource: f.isRelationalSource,
            // Include reference config so it's persisted to the DB
            ...(f.reference?.collection ? { reference: f.reference } : {}),
        }));
        formData.append('fields', JSON.stringify(simplifiedFields));
        formData.append('routing', JSON.stringify({ broadcast: broadcastTargets, splits: splits.filter(s => s.target && s.fields.length > 0), transformations: { mask: maskedFields, hash: hashedFields } }));

        try {
            let res;
            if (initialData?.id) {
                res = await updateFormAction(initialData.id, formData);
                if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
                else toast({ title: "Form Updated", description: "Your changes have been deployed." });
            } else {
                res = await createFormAction(formData);
                if (res.error) toast({ title: "Error", description: res.error, variant: "destructive" });
                else {
                    setGeneratedId(res.formId || '');
                    toast({ title: "Form Deployed", description: "Matrix connection established. Proceeding to Embed." });
                    setActiveTab("embed");
                }
            }
        } catch (e) {
            toast({ title: "Error", description: "Failed to deploy form.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setFormName("");
        setTempName("");
        setFields([{ id: Date.now().toString(), label: "New Field", type: "text", required: false }]);
        setConnector("");
        setTargetDb("");
        setBroadcastTargets([]);
        setSplits([]);
        setMaskedFields([]);
        setHashedFields([]);
        setGeneratedId(null);
        setActiveTab("build");
        toast({ description: "Form workspace has been reset." });
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const embedUrl = `${appUrl}/api/public/submit/${generatedId || 'YOUR_FORM_ID'}`;

    const hasImageFields = fields.some(f => f.type === 'image' || f.type === 'image_array');
    const connectorUrl = connectors.find((c: any) => c.id === connector)?.url || 'http://localhost:3002';

    const renderEmbedField = (f: FormField) => {
        const conf = FIELD_TYPES[f.type] || FIELD_TYPES.text;

        if (conf.category === 'Media' && (f.type === 'image' || f.type === 'image_array')) {
            const isMultiple = f.type === 'image_array';
            return `  <div class="field-group">
    <label>${f.label}${f.required ? ' *' : ''}</label>
    <input type="file" name="${f.label}" accept="image/*" ${isMultiple ? 'multiple ' : ''}${f.required ? 'required' : ''} />
    <${isMultiple ? 'div' : 'img'} id="preview-${f.label}" style="display:${isMultiple ? 'flex' : 'none'};${isMultiple ? 'gap:8px;flex-wrap:wrap;' : 'max-width:200px;'}margin-top:8px;${isMultiple ? '' : 'border-radius:6px;'}"${isMultiple ? '' : ' alt="preview"'}></${isMultiple ? 'div' : 'img'}>
  </div>`;
        }
        if (conf.category === 'Boolean') {
            return `  <div class="field-group" style="display:flex;align-items:center;gap:8px;">
    <input type="checkbox" name="${f.label}" id="${f.label}" ${f.required ? 'required' : ''} />
    <label for="${f.label}">${f.label}${f.required ? ' *' : ''}</label>
  </div>`;
        }
        if (conf.category === 'Selection' && f.type === 'enum') {
            const options = (f.options || "").split(',').map(o => o.trim()).filter(Boolean);
            return `  <div class="field-group">
    <label>${f.label}${f.required ? ' *' : ''}</label>
    <select name="${f.label}" ${f.required ? 'required' : ''}>
      <option value="">Select an option</option>
${options.map(o => `      <option value="${o}">${o}</option>`).join('\n')}
    </select>
  </div>`;
        }

        const isTextarea = conf.component === 'TextareaInput' || conf.component === 'JsonEditor';
        let inputType = 'text';
        if (f.type === 'email') inputType = 'email';
        else if (conf.category === 'Numeric') inputType = 'number';
        else if (conf.category === 'Temporal') inputType = 'datetime-local';

        let step = '';
        if (f.type === 'number') step = ' step="1"';
        if (f.type === 'decimal') step = ' step="any"';

        if (f.type === 'uuid' || f.type === 'foreign_key' || f.type === 'reference') {
          return `  <div class="field-group">
    <label>${f.label}${f.required ? ' *' : ''}</label>
    <select name="${f.label}" ${f.required ? 'required' : ''} data-pp-reference="${f.reference?.collection || ''}" data-pp-display="${f.reference?.displayField || 'name'}">
      <option value="">Select ${f.label.toLowerCase()}...</option>
    </select>
  </div>`;
        }

        return `  <div class="field-group">
    <label>${f.label}${f.required ? ' *' : ''}${f.type === 'list' || f.type === 'array' ? ' (comma-separated)' : ''}</label>
    <${isTextarea ? 'textarea' : `input type="${inputType}"${step}`} name="${f.label}" ${f.required ? 'required' : ''}></${isTextarea ? 'textarea' : 'input'}>
  </div>`;
    };

    const referenceFields = fields.filter(f => f.type === 'uuid' || f.type === 'foreign_key' || f.type === 'reference');
    const hasReferenceFields = referenceFields.length > 0;

    const referenceFetchScript = hasReferenceFields ? `
<script>
  (function() {
    var selects = document.querySelectorAll('select[data-pp-reference]');
    selects.forEach(function(sel) {
      var col = sel.getAttribute('data-pp-reference');
      var display = sel.getAttribute('data-pp-display');
      if (!col) return;
      fetch('${appUrl}/api/public/references/' + col)
        .then(function(r) { return r.json(); })
        .then(function(res) {
          var dataArr = res.data || res;
          if (!dataArr || !Array.isArray(dataArr)) return;
          dataArr.forEach(function(item) {
            var opt = document.createElement('option');
            opt.value = item._id || item.id || item.submissionId;
            opt.textContent = item.data ? (item.data[display] || item.data.name || 'Unnamed') : (item[display] || item.name || 'Unnamed');
            sel.appendChild(opt);
          });
        })
        .catch(function(e) { console.error('Reference fetch failed:', e); });
    });
  })();
</script>` : '';

    const imageUploadScript = (hasImageFields || hasReferenceFields) ? `
<script>
  document.getElementById('pp-form').addEventListener('submit', async function(e) {
    if (this.getAttribute('method') === 'POST' && !this.id) return; // skip if simple POST
    e.preventDefault();
    var btn = document.getElementById('pp-submit-btn');
    btn.disabled = true; btn.textContent = 'Processing...';
    var data = {}; var errors = [];
    var uploads = Array.from(this.querySelectorAll('input,textarea,select')).map(async function(input) {
      if (!input.name) return;
      if (input.type === 'file' && input.files && input.files.length > 0) {
        try {
          var uploadedUrls = [];
          for (var i = 0; i < input.files.length; i++) {
            var fileInfo = input.files[i];
            var compressed = fileInfo;
            if (fileInfo.type.startsWith('image/')) {
              compressed = await new Promise(function(resolve) {
                var reader = new FileReader();
                reader.onload = function(e) {
                  var img = new Image();
                  img.onload = function() {
                    var canvas = document.createElement('canvas');
                    var w = img.width, h = img.height, max = 1000;
                    if (w > max) { h = Math.round((h * max) / w); w = max; }
                    canvas.width = w; canvas.height = h;
                    var ctx = canvas.getContext('2d');
                    if (!ctx) return resolve(fileInfo);
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob(function(b) {
                      if (b) resolve(new File([b], fileInfo.name, {type: 'image/jpeg'}));
                      else resolve(fileInfo);
                    }, 'image/jpeg', 0.8);
                  };
                  img.onerror = function() { resolve(fileInfo); };
                  img.src = e.target.result;
                };
                reader.onerror = function() { resolve(fileInfo); };
                reader.readAsDataURL(fileInfo);
              });
            }
            var fd = new FormData(); fd.append('file', compressed);
            var r = await fetch('${connectorUrl}/postpipe/upload', { method: 'POST', body: fd });
            var d = await r.json();
            if (!r.ok || !d.url) throw new Error(d.error || 'Upload failed');
            uploadedUrls.push(d.url);
          }
          if (input.multiple) { data[input.name] = uploadedUrls; } else { data[input.name] = uploadedUrls[0]; }
        } catch(e) { errors.push(input.name + ': ' + e.message); }
      } else if (input.type !== 'submit') { 
        if (input.type === 'checkbox') data[input.name] = input.checked;
        else data[input.name] = input.value; 
      }
    });
    await Promise.all(uploads);
    if (errors.length) { alert('Upload failed:\\n' + errors.join('\\n')); btn.disabled=false; btn.textContent='Submit Form'; return; }
    btn.textContent = 'Submitting...';
    try {
      var res = await fetch('${embedUrl}', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
      if (res.ok) { btn.textContent='✓ Submitted!'; document.getElementById('pp-form').reset(); document.querySelectorAll('[id^="preview-"]').forEach(function(el){if(el.tagName.toLowerCase()==='img'){el.src='';el.style.display='none';}else{el.innerHTML='';}}); }
      else { var err=await res.json(); alert('Submission failed: '+(err.error||res.statusText)); btn.disabled=false; btn.textContent='Submit Form'; }
    } catch(e) { alert('Network error: '+e.message); btn.disabled=false; btn.textContent='Submit Form'; }
  });
  document.querySelectorAll('input[type="file"]').forEach(function(input) {
    input.addEventListener('change', function() {
      var p = document.getElementById('preview-'+input.name);
      if (p && input.files && input.files.length > 0) {
        if (p.tagName.toLowerCase() === 'img') {
          p.src = URL.createObjectURL(input.files[0]); p.style.display = 'block';
        } else {
          p.innerHTML = '';
          for (var i = 0; i < input.files.length; i++) {
            var img = document.createElement('img');
            img.src = URL.createObjectURL(input.files[i]);
            img.style.maxWidth = '100px';
            img.style.borderRadius = '6px';
            p.appendChild(img);
          }
        }
      }
    });
  });
</script>` : '';

    const embedCodeHTML = `<!-- Postpipe Cosmic Embed -->
<form id="pp-form" action="${embedUrl}" method="POST" class="postpipe-form">
${fields.map(renderEmbedField).join('\n')}
  <button type="submit" id="pp-submit-btn" class="submit-btn">Submit Form</button>
</form>${imageUploadScript}${referenceFetchScript}`;

    const embedCodeReact = `import { useState } from 'react';

export default function MyPostpipeForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    
    try {
      await fetch('${embedUrl}', {
        method: 'POST',
        body: formData
      });
      alert('Success!');
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
${fields.map(f => {
        const conf = FIELD_TYPES[f.type] || FIELD_TYPES.text;
        if (conf.category === 'Boolean') {
            return `      <div className="flex items-center gap-2">
        <input type="checkbox" name="${f.label}" id="${f.label}" ${f.required ? 'required' : ''} />
        <label htmlFor="${f.label}">${f.label}</label>
      </div>`;
        }
        if (conf.category === 'Selection' && f.type === 'enum') {
            const opts = (f.options || "").split(',').map(o => o.trim()).filter(Boolean);
            return `      <div>
        <label>${f.label}</label>
        <select name="${f.label}" ${f.required ? 'required' : ''} className="border p-2 w-full rounded">
          <option value="">Select...</option>
${opts.map(o => `          <option value="${o}">${o}</option>`).join('\n')}
        </select>
      </div>`;
        }
        const isTa = conf.component === 'TextareaInput' || conf.component === 'JsonEditor';
        let inputType = 'text';
        if (f.type === 'email') inputType = 'email';
        else if (conf.category === 'Numeric') inputType = 'number';
        else if (conf.category === 'Temporal') inputType = 'datetime-local';

        let stepAttr = '';
        if (f.type === 'number') stepAttr = ' step="1"';
        if (f.type === 'decimal') stepAttr = ' step="any"';

        const placeholderAttr = f.type === 'uuid' ? ' placeholder="UUID"' : (f.type === 'foreign_key' || f.type === 'fk' ? ' placeholder="Reference ID"' : '');

        return `      <div>
        <label>${f.label}</label>
        <${isTa ? 'textarea' : 'input type="' + inputType + '"' + stepAttr + placeholderAttr} name="${f.label}" ${f.required ? 'required' : ''} className="border p-2 w-full rounded" />
      </div>`;
    }).join('\n')}
      <button type="submit" disabled={loading} className="bg-blue-600 text-white p-2 rounded">
        {loading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}`;

    // Professional Form Preview Render
    const renderLivePreview = () => (
        <div className="relative w-full max-w-sm mx-auto rounded-[2rem] border border-white/5 bg-[#09090D] shadow-2xl overflow-hidden flex flex-col group/preview animate-in zoom-in-95 duration-1000">
            {/* The animated beam on the preview card itself looks ultra-premium */}
            <div className="absolute inset-0 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-1000 pointer-events-none">
                <BorderBeam size={250} duration={8} delay={0} colorFrom="#8b5cf6" colorTo="#3b82f6" />
            </div>

            <div className="p-8 flex-1 flex flex-col relative z-10 w-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                </div>

                <h3 className="text-2xl font-semibold text-white tracking-tight mb-1">{formName || "Untitled Form"}</h3>
                <p className="text-sm text-neutral-400 mb-8">Please fill out this form to continue.</p>

                <div className="space-y-4 flex-1 w-full">
                    {fields.map((f, i) => {
                        const conf = FIELD_TYPES[f.type] || FIELD_TYPES.text;
                        return (
                            <div key={`preview-${f.id}`} className="space-y-1.5 animate-in slide-in-from-bottom-2 fade-in fill-mode-both" style={{ animationDelay: `${i * 50}ms` }}>
                                <label className="text-[11px] font-medium text-neutral-300 ml-1 tracking-wide uppercase">{f.label} {f.required && <span className="text-red-400">*</span>}</label>
                                {conf.component === 'TextareaInput' || conf.component === 'JsonEditor' ? (
                                    <textarea className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none resize-none h-24 shadow-inner" placeholder={conf.component === "JsonEditor" ? "{ ... }" : `Enter ${f.label.toLowerCase()}...`} disabled />
                                ) : conf.category === "Media" ? (
                                    <div className="flex items-center gap-3 bg-[#12121A] border border-white/5 rounded-xl px-4 py-3">
                                        <span className="text-lg">📷</span>
                                        <span className="text-sm text-neutral-500">Image upload field</span>
                                    </div>
                                ) : conf.category === "Boolean" ? (
                                    <div className="flex items-center gap-2 mt-2">
                                        <input type="checkbox" disabled className="w-4 h-4 rounded border-white/10 bg-[#12121A]" />
                                        <span className="text-sm text-neutral-400">Checkbox</span>
                                    </div>
                                ) : conf.category === "Selection" ? (
                                    <select className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-sm text-white outline-none shadow-inner" disabled>
                                        <option>Select {(f.options || "").split(',')[0] || "option"}...</option>
                                    </select>
                                ) : conf.category === "Reference" ? (
                                    /* ── Reference field preview ── */
                                    <div className="w-full bg-[#12121A] border border-violet-500/20 rounded-xl px-4 py-3 flex items-center gap-3 shadow-inner">
                                        <Link2 className="w-4 h-4 text-violet-400 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-neutral-400 truncate">
                                                {f.reference?.collection
                                                    ? <>→ <span className="text-violet-300 font-mono">{f.reference.collection}</span></>
                                                    : <span className="text-neutral-600 italic">No collection selected</span>
                                                }
                                            </p>
                                        </div>
                                        {f.reference?.collection && (
                                            <span className="text-[9px] text-violet-400 bg-violet-500/15 border border-violet-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                                                ref
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <input type={conf.category === "Numeric" ? "number" : f.type === "email" ? "email" : conf.category === "Temporal" ? "datetime-local" : "text"} step={f.type === "decimal" ? "any" : f.type === "number" ? "1" : undefined} className="w-full bg-[#12121A] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all outline-none shadow-inner" placeholder={conf.category === "Structured" ? "item1, item2, item3" : `Enter ${f.label.toLowerCase()}...`} disabled />
                                )}
                            </div>
                        )
                    })}
                    {fields.length === 0 && (
                        <div className="text-center py-10 opacity-50 text-neutral-500 text-sm border border-dashed border-white/10 rounded-xl bg-white/5 w-full">
                            Canvas is empty
                        </div>
                    )}
                </div>

                <div className="pt-8 mt-auto w-full flex flex-col items-center">
                    <button disabled className="w-full relative group overflow-hidden bg-white text-black font-semibold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <span className="relative z-10">Submit Interrogation</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                    <div className="text-center mt-4 flex flex-col items-center justify-center">
                        <span className="text-[10px] text-neutral-500 flex items-center justify-center gap-1"><Lock className="w-3 h-3" /> Secured by Postpipe</span>
                        <span className="text-[9px] text-neutral-600 mt-1 uppercase tracking-widest font-medium">Powered by CDDRS</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 pt-[65px] z-[40] bg-[#05050A]">
            {/* The App Layout */}
            <div className="flex flex-col w-full h-full relative overflow-hidden">
                {/* Subtle cosmic background */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#05050A] to-[#05050A] pointer-events-none" />
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full pointer-events-none" />

                {/* Top App Bar */}
                <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 lg:px-8 relative z-20">
                    <div className="flex items-center gap-4 flex-1">
                        {onBack ? (
                            <Button variant="ghost" size="icon" onClick={onBack} className="text-neutral-400 hover:text-white rounded-full bg-white/5"><ArrowLeft className="h-5 w-5" /></Button>
                        ) : (
                            <Link href="/dashboard/forms">
                                <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white rounded-full bg-white/5"><ArrowLeft className="h-5 w-5" /></Button>
                            </Link>
                        )}
                        <div className="h-6 w-px bg-white/10" />
                        <Input
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            className="bg-transparent border-transparent hover:border-white/10 focus:border-white/20 focus-visible:ring-indigo-500/50 focus-visible:ring-1 text-lg font-semibold text-white px-3 w-full max-w-[300px] transition-all"
                            placeholder="Untitled Form"
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {generatedId && (
                            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20 mr-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Live
                            </div>
                        )}
                        <Button variant="ghost" className="text-neutral-400 hover:text-white xl:hidden border border-white/10 bg-black/50" onClick={() => setActiveTab(activeTab === "preview" ? "build" : "preview")}>
                            {activeTab === "preview" ? "Close Preview" : "Preview"}
                        </Button>
                        <Button variant="ghost" className="h-9 px-4 text-sm text-neutral-400 hover:text-white hover:bg-white/5 border border-white/5 rounded-xl transition-all mr-2" onClick={handleReset}>
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset
                        </Button>
                        <RainbowButton onClick={handleSave} className="h-9 px-6 text-sm shadow-[0_0_15px_rgba(139,92,246,0.3)]" disabled={isSaving}>
                            {isSaving ? <div className="scale-75 -mx-4 flex items-center justify-center"><Loader /></div> : <><Save className="w-4 h-4 mr-2" /> {initialData ? "Update Form" : "Deploy Form"}</>}
                        </RainbowButton>
                    </div>
                </header>

                {/* Workspace area */}
                <div className="flex-1 flex overflow-hidden relative z-10 w-full max-w-[1600px] mx-auto">
                    {!formName && (
                        <div className="absolute inset-0 z-50 bg-[#05050A]/70 backdrop-blur-md flex flex-col items-center pt-[15vh] pb-4 px-4 overflow-y-auto">
                            <div className="bg-[#09090D] p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center max-w-sm w-full animate-in zoom-in-y-95 duration-500">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                    <Lock className="w-8 h-8 text-neutral-400" />
                                </div>
                                <h2 className="text-xl font-semibold mb-2 text-white text-center">Name Your Form</h2>
                                <p className="text-sm text-neutral-400 text-center mb-6 leading-relaxed">
                                    Please provide a name to unlock the Builder workspace and start configuring fields.
                                </p>
                                <div className="w-full space-y-4">
                                    <Input
                                        value={tempName}
                                        onChange={(e) => setTempName(e.target.value)}
                                        placeholder="e.g. Customer Feedback Form"
                                        className="bg-black/50 border-white/10 text-white placeholder:text-neutral-600 h-11 focus-visible:ring-indigo-500/50"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && tempName.trim()) {
                                                setFormName(tempName.trim());
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90 text-white h-11 rounded-xl transition-all"
                                        onClick={() => {
                                            if (tempName.trim()) setFormName(tempName.trim());
                                        }}
                                        disabled={!tempName.trim()}
                                    >
                                        Start Building <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Left Panel: Controls */}
                    <div className={`w-full xl:w-[60%] 2xl:w-[65%] shrink-0 border-r border-white/5 bg-[#09090D]/80 backdrop-blur-md flex flex-col transition-transform duration-300 ${activeTab === 'preview' ? '-translate-x-full xl:translate-x-0 absolute xl:relative h-full z-10' : ''}`}>
                        {/* Tab Headers */}
                        <div className="flex p-3 gap-2 bg-black/20 border-b border-white/5">
                            <button onClick={() => setActiveTab("build")} className={`flex-1 py-2.5 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'build' ? 'bg-[#181824] text-white shadow-sm border border-white/5' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`}>
                                <Layers className="w-4 h-4" /> Fields
                            </button>
                            <button onClick={() => setActiveTab("settings")} className={`flex-1 py-2.5 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'settings' ? 'bg-[#181824] text-white shadow-sm border border-white/5' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`}>
                                <Settings className="w-4 h-4" /> Config
                            </button>
                            <button onClick={() => setActiveTab("embed")} className={`flex-1 py-2.5 text-xs font-medium rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${activeTab === 'embed' ? 'bg-[#181824] text-white shadow-sm border border-white/5' : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'}`}>
                                <Code className="w-4 h-4" /> Embed
                            </button>
                        </div>

                        {/* Control Content */}
                        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <div className="p-6 pb-20">

                                {/* BUILD TAB */}
                                {activeTab === 'build' && (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <h2 className="text-sm font-semibold text-white">Schema Definition</h2>
                                                <p className="text-[11px] text-neutral-400 mt-0.5">Configure the structure of your data payload.</p>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                onClick={addField}
                                                className={`h-9 w-9 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white shadow-lg transition-all duration-300 ${addPulse
                                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 scale-95"
                                                    : "hover:scale-110 hover:border-primary/50"
                                                    }`}
                                            >
                                                {addPulse ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-5 w-5" />}
                                            </Button>
                                        </div>

                                        {/* Cloudinary notice — shown when any image field exists */}
                                        {hasImageFields && (
                                            <div className="flex gap-3 items-start rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 animate-in fade-in slide-in-from-top-2">
                                                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-amber-300">Image Upload requires Cloudinary</p>
                                                    <p className="text-[11px] text-amber-300/70 leading-relaxed">
                                                        Your connector must have these env vars set for image uploads to work:
                                                    </p>
                                                    <pre className="mt-1.5 text-[10px] font-mono text-amber-200/60 bg-black/30 rounded-lg px-3 py-2 leading-relaxed">
                                                        {`CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_URL=cloudinary://...`}
                                                    </pre>
                                                    <p className="text-[10px] text-amber-300/50 pt-1">Add these in your Vercel / cloud dashboard → Environment Variables, then redeploy your connector.</p>
                                                </div>
                                            </div>
                                        )}

                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                                <div className="space-y-1">
                                                    {fields.map((field) => (
                                                        <SortableField
                                                            key={field.id}
                                                            field={field}
                                                            updateField={updateField}
                                                            removeField={removeField}
                                                            isNew={field.id === newFieldId}
                                                            availableCollections={availableForms}
                                                        />
                                                    ))}
                                                    {fields.length === 0 && (
                                                        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                                                            <Layers className="w-8 h-8 mx-auto text-neutral-500 mb-3" />
                                                            <p className="text-sm text-neutral-400">Schema is empty</p>
                                                            <Button variant="link" onClick={addField} className="text-primary h-auto p-0 mt-2">Add your first field</Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                    </div>
                                )}

                                {/* SETTINGS TAB */}
                                {activeTab === 'settings' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-500">
                                        <div className="space-y-6">
                                            <div>
                                                <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Database className="w-4 h-4 text-indigo-400" /> Core Integration</h2>
                                                <p className="text-xs text-neutral-400 mt-1">Select the backend matrix for this form.</p>
                                            </div>
                                            <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-neutral-300">Target Connector</Label>
                                                    <Select value={connector} onValueChange={setConnector}>
                                                        <SelectTrigger className="bg-[#0A0A0F] border-white/10 text-white"><SelectValue placeholder="Choose target connector..." /></SelectTrigger>
                                                        <SelectContent>
                                                            {connectors.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs text-neutral-300">Target Database</Label>
                                                    <Select value={targetDb} onValueChange={setTargetDb}>
                                                        <SelectTrigger className="bg-[#0A0A0F] border-white/10 text-white"><SelectValue placeholder="Select primary database..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="default">Default Node</SelectItem>
                                                            {availableDatabases.map((key: string) => <SelectItem key={key} value={key}>{key}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        {connector && availableDatabases.length > 0 && (
                                            <div className="space-y-6 pt-6 border-t border-white/5">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Send className="w-4 h-4 text-blue-400" /> Advanced Routing</h2>
                                                    <p className="text-xs text-neutral-400 mt-1">Distribute subsets of data across systems.</p>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Broadcast */}
                                                    <div className="space-y-3">
                                                        <Label className="text-xs font-medium text-neutral-300">Multi-Node Broadcast</Label>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {availableDatabases.filter(db => db !== targetDb).map((db) => (
                                                                <div key={db} className="flex items-center space-x-3 border border-white/5 bg-black/40 p-3 rounded-xl">
                                                                    <Switch id={`broadcast-${db}`} checked={broadcastTargets.includes(db)} onCheckedChange={() => toggleBroadcast(db)} />
                                                                    <Label htmlFor={`broadcast-${db}`} className="text-xs text-neutral-200">Mirror to <span className="font-mono text-primary/80">{db}</span></Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Breakpoints */}
                                                    <div className="space-y-3 pt-4 border-t border-white/5">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-medium text-neutral-300">Field Breakpoints</Label>
                                                            <Button variant="ghost" size="sm" onClick={addSplit} className="h-6 text-[10px] px-2 bg-white/5 hover:bg-white/10 rounded-md text-white">
                                                                <Plus className="h-3 w-3 mr-1" /> Add Rule
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {splits.map((split, idx) => (
                                                                <div key={idx} className="p-3 border border-white/5 bg-black/40 rounded-xl space-y-3 relative group">
                                                                    <Button variant="ghost" size="icon" className="h-5 w-5 absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400" onClick={() => removeSplit(idx)}>
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                    <div className="grid grid-cols-1 gap-3 pr-6">
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[9px] text-neutral-500 uppercase tracking-widest">Target DB</Label>
                                                                            <Select value={split.target} onValueChange={(val) => updateSplit(idx, "target", val)}>
                                                                                <SelectTrigger className="h-7 text-[10px] bg-[#0A0A0F] border-white/5 text-white"><SelectValue /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    {availableDatabases.map(db => <SelectItem key={db} value={db}>{db}</SelectItem>)}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <Label className="text-[9px] text-neutral-500 uppercase tracking-widest">Fields (Click to toggle)</Label>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {fields.map(f => (
                                                                                    <div
                                                                                        key={f.id}
                                                                                        onClick={() => updateSplit(idx, "fields", split.fields.includes(f.label) ? split.fields.filter(n => n !== f.label) : [...split.fields, f.label])}
                                                                                        className={`cursor-pointer text-[9px] px-2 py-1 rounded border ${split.fields.includes(f.label) ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 border-transparent text-neutral-400 hover:bg-white/10"}`}
                                                                                    >
                                                                                        {f.label}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
                                                                        <Switch className="scale-75 origin-left" checked={split.excludeFromMain || false} onCheckedChange={(checked) => updateSplit(idx, "excludeFromMain", checked)} />
                                                                        <Label className="text-[10px] text-neutral-400">Exclude from Main Database</Label>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {connector && availableDatabases.length > 0 && (
                                            <div className="space-y-6 pt-6 border-t border-white/5">
                                                <div>
                                                    <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-orange-400" /> Security Transformations</h2>
                                                    <p className="text-xs text-neutral-400 mt-1">Apply cryptographic overlays to sensitive fields.</p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="space-y-2 p-3 border border-white/5 bg-black/40 rounded-xl">
                                                        <Label className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">Masking (****)</Label>
                                                        <div className="flex flex-wrap gap-1 min-h-[40px]">
                                                            {fields.map(f => (
                                                                <div key={`mask-${f.id}`} onClick={() => setMaskedFields(prev => prev.includes(f.label) ? prev.filter(n => n !== f.label) : [...prev, f.label])} className={`cursor-pointer text-[10px] px-2 py-1 rounded border ${maskedFields.includes(f.label) ? "bg-orange-500/20 text-orange-300 border-orange-500/30" : "bg-white/5 border-transparent text-neutral-400 hover:bg-white/10"}`}>{f.label}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 p-3 border border-white/5 bg-black/40 rounded-xl">
                                                        <Label className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Hashing (SHA256)</Label>
                                                        <div className="flex flex-wrap gap-1 min-h-[40px]">
                                                            {fields.map(f => (
                                                                <div key={`hash-${f.id}`} onClick={() => setHashedFields(prev => prev.includes(f.label) ? prev.filter(n => n !== f.label) : [...prev, f.label])} className={`cursor-pointer text-[10px] px-2 py-1 rounded border ${hashedFields.includes(f.label) ? "bg-blue-500/20 text-blue-300 border-blue-500/30" : "bg-white/5 border-transparent text-neutral-400 hover:bg-white/10"}`}>{f.label}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* EMBED TAB */}
                                {activeTab === 'embed' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-500 h-full flex flex-col">
                                        <div>
                                            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Code className="w-4 h-4 text-green-400" /> Integration Code</h2>
                                            <p className="text-xs text-neutral-400 mt-1">Your form is ready to be injected into any client.</p>
                                        </div>

                                        {!generatedId ? (
                                            <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-black/20 text-center p-8">
                                                <AlertCircle className="h-10 w-10 text-neutral-600 mb-4" />
                                                <p className="text-sm font-medium text-neutral-300 mb-2">Form not deployed yet</p>
                                                <p className="text-xs text-neutral-500 max-w-xs mb-6">You need to deploy the form to the network before connection codes become available.</p>
                                                <RainbowButton onClick={handleSave} className="h-9 px-6 text-sm">Deploy Now</RainbowButton>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-3 border border-indigo-500/30 bg-indigo-500/10 rounded-xl">
                                                    <Label className="text-[10px] text-indigo-300 uppercase tracking-wider">Endpoint</Label>
                                                    <div className="flex items-center mt-1">
                                                        <input readOnly value={embedUrl} className="flex-1 bg-transparent text-xs text-indigo-100 outline-none" />
                                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-indigo-400 hover:text-indigo-300 hover:bg-white/5" onClick={() => { navigator.clipboard.writeText(embedUrl); toast({ description: "Endpoint copied" }); }}><Clipboard className="h-3 w-3" /></Button>
                                                    </div>
                                                </div>

                                                <div className="relative group border border-white/10 rounded-xl overflow-hidden bg-[#0A0A0F]">
                                                    <Tabs defaultValue="react" className="w-full">
                                                        <TabsList className="w-full flex bg-white/5 border-b border-white/5 p-0 h-auto rounded-none justify-start">
                                                            <TabsTrigger value="react" className="text-[10px] rounded-none py-2 px-4 data-[state=active]:bg-white/10 data-[state=active]:text-white">React / Next.js</TabsTrigger>
                                                            <TabsTrigger value="html" className="text-[10px] rounded-none py-2 px-4 data-[state=active]:bg-white/10 data-[state=active]:text-white">HTML snippet</TabsTrigger>
                                                        </TabsList>

                                                        <TabsContent value="react" className="mt-0 relative">
                                                            <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-6 px-2 text-[10px] text-neutral-400 hover:text-white bg-black/50" onClick={() => { navigator.clipboard.writeText(embedCodeReact); toast({ description: "React code copied" }); }}><Clipboard className="h-3 w-3 mr-1" /> Copy</Button>
                                                            <pre className="p-4 pt-10 text-[10px] text-neutral-300 font-mono overflow-auto max-h-[350px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                                                <code>{embedCodeReact}</code>
                                                            </pre>
                                                        </TabsContent>

                                                        <TabsContent value="html" className="mt-0 relative">
                                                            <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-6 px-2 text-[10px] text-neutral-400 hover:text-white bg-black/50" onClick={() => { navigator.clipboard.writeText(embedCodeHTML); toast({ description: "HTML copied" }); }}><Clipboard className="h-3 w-3 mr-1" /> Copy</Button>
                                                            <pre className="p-4 pt-10 text-[10px] text-neutral-300 font-mono overflow-auto max-h-[350px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                                                <code>{embedCodeHTML}</code>
                                                            </pre>
                                                        </TabsContent>
                                                    </Tabs>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Floating Action Button for Add Field */}
                        {activeTab === 'build' && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500 pointer-events-none">
                                <Button
                                    onClick={addField}
                                    className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] border border-white/10 flex items-center gap-2 pointer-events-auto transition-all hover:scale-105 active:scale-95 group"
                                >
                                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="font-semibold text-sm tracking-wide">Add New Field</span>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Live Preview Canvas */}
                    <div className={`absolute xl:relative flex-1 bg-gradient-to-br from-[#020205] to-[#0A0A10] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full flex items-start justify-center p-6 md:p-12 transition-all duration-300 h-full w-full ${activeTab === 'preview' ? 'z-20' : 'opacity-0 xl:opacity-100 -z-10 xl:z-0'}`}>
                        {/* Grid Pattern Overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

                        <div className="w-full min-h-full max-w-2xl flex justify-center items-start pt-12 md:pt-20 pb-12 relative z-10 animate-in zoom-in-95 xl:zoom-in-100 duration-700">
                            {renderLivePreview()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
