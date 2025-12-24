'use client';

import { useActionState, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from '@/lib/auth/actions';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, Mail, Upload, Loader2, Link as LinkIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function ProfileClient() {
    const { user, loading, refreshSession } = useAuth();
    const [state, formAction] = useActionState(updateProfile, { success: false, message: '' });

    // Local state for immediate feedback
    const [name, setName] = useState('');
    const [image, setImage] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize state when user data is available
    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setImage(user.image || '');
            // Reset dirty state on initial load
            setIsDirty(false);
        }
    }, [user, state.success]); // Also reset when save is successful

    // Check for changes
    useEffect(() => {
        if (user) {
            const hasNameChanged = name !== (user.name || '');
            const hasImageChanged = image !== (user.image || '');
            setIsDirty(hasNameChanged || hasImageChanged);
        }
    }, [name, image, user]);

    // Handle form submission start
    const handleSubmit = () => {
        setIsSaving(true);
    };

    // Reset saving state when action completes
    useEffect(() => {
        if (state.message) {
            setIsSaving(false);
            if (state.success && refreshSession) {
                refreshSession();
            }
        }
    }, [state, refreshSession]);

    // Handle Image Upload
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                setImage(data.url);
            } else {
                console.error('Upload failed:', data.error);
                // Optionally show localized error in UI
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setIsUploading(false);
            // Clear input so same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    return (
        <div className="mx-auto max-w-2xl py-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground">Manage your personal information and account preferences.</p>
            </div>

            <form action={formAction} onSubmit={handleSubmit}>
                <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            Update your photo and personal details here.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Profile Image Section */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Avatar className="h-24 w-24 border-2 border-border shadow-sm">
                                <AvatarImage src={image} alt="Avatar" className="object-cover" />
                                <AvatarFallback className="text-lg font-semibold bg-secondary text-secondary-foreground">
                                    {getInitials(name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                                <Label htmlFor="image" className="text-sm font-medium">Profile Image</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="image"
                                            name="image"
                                            type="url"
                                            value={image}
                                            onChange={(e) => setImage(e.target.value)}
                                            placeholder="https://example.com/avatar.png"
                                            className="pl-9"
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            title="Upload Image"
                                        >
                                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground">
                                    Enter a public URL for your avatar.
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div className="grid gap-6">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        name="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email - Read Only */}
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    Email Address
                                    <span className="text-xs font-normal text-muted-foreground">(Read-only)</span>
                                </Label>
                                <div className="relative group">
                                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="pl-9 bg-muted/50 text-muted-foreground border-dashed"
                                    />
                                    <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground/70" />
                                </div>
                                <p className="text-[0.8rem] text-muted-foreground flex items-center gap-1">
                                    <InfoIcon className="h-3 w-3 inline" /> To change your email, please contact <a href="mailto:support@postpipe.in" className="underline hover:text-foreground">support</a>.
                                </p>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col items-start gap-4 border-t bg-muted/10 px-6 py-4 sm:flex-row sm:justify-between sm:items-center">
                        <div className="flex-1 text-sm text-muted-foreground">
                            {state.message && (
                                <div className={`flex items-center gap-2 font-medium ${state.success ? 'text-green-600 dark:text-green-500' : 'text-destructive'}`}>
                                    {state.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                    {state.message}
                                </div>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={!isDirty || isSaving}
                            className="w-full sm:w-auto min-w-[140px]"
                        >
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}

function InfoIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    )
}
