"use client";

import * as React from "react";
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
  PauseCircle,
  PlayCircle,
  CopyPlus
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Form = {
  id: string;
  name: string;
  targetDb: string;
  submissions: number;
  lastSubmission: string;
  status: "Live" | "Paused";
};

const INITIAL_FORMS: Form[] = [
  {
    id: "f1",
    name: "Contact Us",
    targetDb: "PostPipe Auth (MongoDB)",
    submissions: 45,
    lastSubmission: "10 mins ago",
    status: "Live",
  },
  {
    id: "f2",
    name: "Waitlist Signup",
    targetDb: "E-commerce V1 (Postgres)",
    submissions: 1203,
    lastSubmission: "1 min ago",
    status: "Live",
  },
  {
    id: "f3",
    name: "Customer Feedback",
    targetDb: "Legacy Blog (MongoDB)",
    submissions: 12,
    lastSubmission: "3 days ago",
    status: "Paused",
  },
];

export default function FormsPage() {
  const [forms, setForms] = React.useState<Form[]>(INITIAL_FORMS);

  const toggleStatus = (id: string) => {
    setForms(prev => prev.map(f => {
      if (f.id === id) {
        const newStatus = f.status === 'Live' ? 'Paused' : 'Live';
        toast({ description: `Form ${newStatus === 'Live' ? 'resumed' : 'paused'}` });
        return { ...f, status: newStatus };
      }
      return f;
    }));
  };

  const copyEmbed = (id: string) => {
    navigator.clipboard.writeText(`<iframe src="https://forms.postpipe.dev/embed/${id}" width="100%" height="500" frameborder="0"></iframe>`);
    toast({ title: "Embed Code Copied", description: "Paste this into your website HTML." });
  };

  const copyEndpoint = (id: string) => {
    navigator.clipboard.writeText(`https://api.postpipe.dev/v1/forms/${id}/submit`);
    toast({ title: "Endpoint URL Copied", description: "Use this for custom frontend submissions." });
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
        <RainbowButton className="h-9 px-4 text-xs text-white">
          <Plus className="mr-2 h-3.5 w-3.5" />
          <span className="whitespace-pre-wrap text-center font-medium leading-none tracking-tight">
            New Form
          </span>
        </RainbowButton>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Form Name</TableHead>
              <TableHead>Target Database</TableHead>
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
                <TableCell className="text-muted-foreground">{form.targetDb}</TableCell>
                <TableCell className="text-right">{form.submissions.toLocaleString()}</TableCell>
                <TableCell className="text-muted-foreground">{form.lastSubmission}</TableCell>
                <TableCell>
                  <Badge variant={form.status === 'Live' ? 'default' : 'secondary'} className={cn(form.status === 'Live' && "bg-green-500 hover:bg-green-600")}>
                    {form.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Form Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => toast({ description: "Opening submissions table..." })}>
                        <Eye className="mr-2 h-4 w-4" /> View Submissions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => copyEmbed(form.id)}>
                        <Code className="mr-2 h-4 w-4" /> Copy Embed HTML
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyEndpoint(form.id)}>
                        <Copy className="mr-2 h-4 w-4" /> Copy Endpoint URL
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ description: "Form duplicated" })}>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
