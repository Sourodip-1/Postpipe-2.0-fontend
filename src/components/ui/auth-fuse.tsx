"use client";

import * as React from "react";
import { useState, useId, useEffect, useActionState } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Image from "next/image";
import { BeamsBackground } from "@/components/ui/beams-background";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export interface TypewriterProps {
    text: string | string[];
    speed?: number;
    cursor?: string;
    loop?: boolean;
    deleteSpeed?: number;
    delay?: number;
    className?: string;
}

export function Typewriter({
    text,
    speed = 100,
    cursor = "|",
    loop = false,
    deleteSpeed = 50,
    delay = 1500,
    className,
}: TypewriterProps) {
    const [displayText, setDisplayText] = useState("");
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [textArrayIndex, setTextArrayIndex] = useState(0);

    const textArray = Array.isArray(text) ? text : [text];
    const currentText = textArray[textArrayIndex] || "";

    useEffect(() => {
        if (!currentText) return;

        const timeout = setTimeout(
            () => {
                if (!isDeleting) {
                    if (currentIndex < currentText.length) {
                        setDisplayText((prev) => prev + currentText[currentIndex]);
                        setCurrentIndex((prev) => prev + 1);
                    } else if (loop) {
                        setTimeout(() => setIsDeleting(true), delay);
                    }
                } else {
                    if (displayText.length > 0) {
                        setDisplayText((prev) => prev.slice(0, -1));
                    } else {
                        setIsDeleting(false);
                        setCurrentIndex(0);
                        setTextArrayIndex((prev) => (prev + 1) % textArray.length);
                    }
                }
            },
            isDeleting ? deleteSpeed : speed,
        );

        return () => clearTimeout(timeout);
    }, [
        currentIndex,
        isDeleting,
        currentText,
        loop,
        speed,
        deleteSpeed,
        delay,
        displayText,
        text,
    ]);

    return (
        <span className={className}>
            {displayText}
            <span className="animate-pulse">{cursor}</span>
        </span>
    );
}

const labelVariants = cva(
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
    React.ElementRef<typeof LabelPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
    <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
    />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default: "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
                destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline: "border border-input bg-background hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary-foreground/60 underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-md px-3",
                lg: "h-12 rounded-md px-6",
                icon: "h-8 w-8",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
    }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-black focus-visible:ring-1 focus-visible:ring-black focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    labelDescription?: React.ReactNode;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, label, labelDescription, ...props }, ref) => {
        const id = useId();
        const [showPassword, setShowPassword] = useState(false);
        const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
        return (
            <div className="grid w-full items-center gap-2">
                {label && (
                    <div className="flex items-center">
                        <Label htmlFor={id}>{label}</Label>
                        {labelDescription && <div className="ml-auto inline-block text-sm">{labelDescription}</div>}
                    </div>
                )}
                <div className="relative">
                    <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
                    <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
                    </button>
                </div>
            </div>
        );
    }
);
PasswordInput.displayName = "PasswordInput";

import { useRouter } from "next/navigation";
import { login, signup, resendVerification, forgotPassword } from "@/lib/auth/actions";
import Loader from "@/components/ui/loader";

function SignInForm({ setView }: { setView: (v: "signin" | "signup" | "forgot") => void }) {
    const router = useRouter();
    const [state, formAction] = useActionState(login, { success: false, message: "" });

    return (
        <form action={formAction} autoComplete="on" className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Sign in to your account</h1>
                <p className="text-balance text-sm text-muted-foreground">Enter your email below to sign in</p>
            </div>
            <div className="grid gap-4">
                <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" /></div>
                <PasswordInput
                    name="password"
                    label="Password"
                    labelDescription={<a href="#" onClick={(e) => { e.preventDefault(); setView("forgot"); }} className="ml-auto inline-block text-sm underline text-muted-foreground hover:text-foreground">Forgot your password?</a>}
                    required
                    autoComplete="current-password"
                    placeholder="Password"
                />

                {state.message && (
                    <p className={cn("text-sm text-center font-medium", state.success ? "text-green-500" : "text-red-500")}>
                        {state.message}
                    </p>
                )}

                <Button type="submit" variant="default" className="mt-2 text-white dark:text-black">Sign In</Button>
            </div>
        </form>
    );
}

function SignUpForm({ setView }: { setView: (v: "signin" | "signup" | "forgot") => void }) {
    const [state, formAction, isPending] = useActionState(signup, { success: false, message: "" });
    const [resendState, resendAction] = useActionState(resendVerification, { success: false, message: "" });
    const [submittedEmail, setSubmittedEmail] = useState("");

    // Capture email when user types (simple approach) or from formData if we could intercept.
    // For simplicity, let's track the input value.
    const [emailInput, setEmailInput] = useState("");

    useEffect(() => {
        if (state.success && emailInput) {
            setSubmittedEmail(emailInput);
        }
    }, [state.success, emailInput]);

    if (state.success) {
        return (
            <div className="flex flex-col gap-6 text-center">
                <h1 className="text-2xl font-bold text-green-500">Account Created!</h1>
                <div className="space-y-2">
                    <p className="text-muted-foreground">{state.message}</p>
                    <p className="text-sm">Did not receive the email?</p>
                </div>

                {submittedEmail && (
                    <form action={resendAction} className="flex flex-col gap-2">
                        <input type="hidden" name="email" value={submittedEmail} />
                        <Button type="submit" variant="outline">
                            Resend Verification Email
                        </Button>
                        {resendState.message && (
                            <p className={cn("text-xs font-medium", resendState.success ? "text-green-500" : "text-red-500")}>
                                {resendState.message}
                            </p>
                        )}
                    </form>
                )}
            </div>
        );
    }

    return (
        <form action={formAction} autoComplete="on" className="flex flex-col gap-8 relative">
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-balance text-sm text-muted-foreground">Enter your details below to sign up</p>
            </div>
            <div className="grid gap-4">
                <div className="grid gap-1">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" type="text" placeholder="John Doe" required autoComplete="name" />
                    {state.errors?.name && <p className="text-xs text-red-500">{state.errors.name[0]}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} />
                    {state.errors?.email && <p className="text-xs text-red-500">{state.errors.email[0]}</p>}
                </div>
                <div className="grid gap-2">
                    <PasswordInput name="password" label="Password" required autoComplete="new-password" placeholder="Password" />
                    {state.errors?.password && <p className="text-xs text-red-500">{state.errors.password[0]}</p>}
                </div>
                <div className="grid gap-2">
                    <PasswordInput name="confirmPassword" label="Confirm Password" required autoComplete="new-password" placeholder="Confirm Password" />
                    {state.errors?.confirmPassword && <p className="text-xs text-red-500">{state.errors.confirmPassword[0]}</p>}
                </div>

                {state.message && (
                    <p className={cn("text-sm text-center font-medium", state.success ? "text-green-500" : "text-red-500")}>
                        {state.message}
                    </p>
                )}

                <Button type="submit" variant="default" className="mt-2 text-white dark:text-black overflow-hidden" disabled={isPending}>
                    {isPending ? <div className="scale-75 -mx-4 flex items-center justify-center"><Loader /></div> : "Sign Up"}
                </Button>
            </div>
        </form>
    );
}

function ForgotPasswordForm({ setView }: { setView: (v: "signin" | "signup" | "forgot") => void }) {
    const [state, formAction] = useActionState(forgotPassword, { success: false, message: "" });

    return (
        <form action={formAction} autoComplete="on" className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Reset Password</h1>
                <p className="text-balance text-sm text-muted-foreground">Enter your email to receive a reset link</p>
            </div>
            <div className="grid gap-4">
                <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" /></div>

                {state.message && (
                    <p className={cn("text-sm text-center font-medium", state.success ? "text-green-500" : "text-red-500")}>
                        {state.message}
                    </p>
                )}

                <Button type="submit" variant="default" className="mt-2 text-white dark:text-black">Send Reset Link</Button>
            </div>

            <div className="text-center text-sm">
                <Button variant="link" className="pl-1 text-foreground" onClick={() => setView("signin")}>
                    Back to login
                </Button>
            </div>
        </form>
    );
}

function AuthFormContainer({ view, setView }: { view: "signin" | "signup" | "forgot"; setView: (v: "signin" | "signup" | "forgot") => void; }) {
    if (view === "forgot") {
        return (
            <div className="mx-auto grid w-[350px] gap-2">
                <ForgotPasswordForm setView={setView} />
            </div>
        );
    }

    const isSignIn = view === "signin";

    return (
        <div className="mx-auto grid w-[350px] gap-2">
            {isSignIn ? <SignInForm setView={setView} /> : <SignUpForm setView={setView} />}
            <div className="text-center text-sm">
                {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
                <Button variant="link" className="pl-1 text-foreground" onClick={() => setView(isSignIn ? "signup" : "signin")}>
                    {isSignIn ? "Sign up" : "Sign in"}
                </Button>
            </div>
            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
            <Button variant="outline" type="button" onClick={() => window.location.href = "/api/auth/google"}>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="mr-2 h-4 w-4" />
                Continue with Google
            </Button>
            <Button variant="outline" type="button" onClick={() => window.location.href = "/api/auth/github"}>
                <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub icon" className="mr-2 h-4 w-4 dark:invert" />
                Continue with GitHub
            </Button>
        </div>
    )
}

interface AuthContentProps {
    image?: {
        src: string;
        alt: string;
    };
    quote?: {
        text: string;
        author: string;
    }
}

interface AuthUIProps {
    signInContent?: AuthContentProps;
    signUpContent?: AuthContentProps;
}

const defaultSignInContent = {
    image: {
        src: "https://i.ibb.co/XrkdGrrv/original-ccdd6d6195fff2386a31b684b7abdd2e-removebg-preview.png",
        alt: "A beautiful interior design for sign-in"
    },
    quote: {
        text: "Welcome Back! The journey continues.",
        author: "PostPipe"
    }
};

const defaultSignUpContent = {
    image: {
        src: "https://i.ibb.co/HTZ6DPsS/original-33b8479c324a5448d6145b3cad7c51e7-removebg-preview.png",
        alt: "A vibrant, modern space for new beginnings"
    },
    quote: {
        text: "Create an account. A new chapter awaits.",
        author: "PostPipe"
    }
};

export function AuthUI({ signInContent = {}, signUpContent = {} }: AuthUIProps) {
    const [view, setView] = useState<"signin" | "signup" | "forgot">("signin");

    const finalSignInContent = {
        image: { ...defaultSignInContent.image, ...signInContent.image },
        quote: { ...defaultSignInContent.quote, ...signInContent.quote },
    };
    const finalSignUpContent = {
        image: { ...defaultSignUpContent.image, ...signUpContent.image },
        quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
    };

    const currentContent = view !== "signup" ? finalSignInContent : finalSignUpContent;

    return (
        <div className="w-full min-h-screen md:grid md:grid-cols-2">
            <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
            <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12 bg-background">
                <AuthFormContainer view={view} setView={setView} />
            </div>

            <BeamsBackground
                className="hidden md:flex items-center justify-center"
                intensity="strong"
            >
                {/* Logos container */}
                <div className="relative z-10 flex items-center justify-center gap-8">
                    <div className="relative w-32 h-32">
                        <Image
                            src="/PostPipe.svg"
                            alt="PostPipe"
                            fill
                            className="object-contain"
                        />
                    </div>

                    <div className="text-4xl font-thin text-white/20">X</div>

                    <div className="relative w-32 h-32">
                        <Image
                            src="/next_js_logo_icon_145038.webp"
                            alt="Next.js"
                            fill
                            className="object-contain invert" // Next.js logo is usually black, invert for dark mode if needed
                        />
                    </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-end p-2 pb-10">
                    <blockquote className="space-y-2 text-center text-white drop-shadow-md">
                        <p className="text-lg font-medium">
                            “<Typewriter
                                key={currentContent.quote.text}
                                text={currentContent.quote.text}
                                speed={60}
                            />”
                        </p>
                        <cite className="block text-sm font-light text-gray-200 not-italic">
                            — {currentContent.quote.author}
                        </cite>
                    </blockquote>
                </div>
            </BeamsBackground>
        </div>
    );
}
