"use client";

import Link from "next/link";
import { ArrowLeft, Database, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mock Data
const SUBMISSIONS = [
    { id: "sub_1", submittedAt: "Oct 24, 2024, 10:23 AM", data: { email: "alice@example.com", message: "Interested in the enterprise plan." } },
    { id: "sub_2", submittedAt: "Oct 24, 2024, 09:15 AM", data: { email: "bob@test.com", message: "Help with integration." } },
    { id: "sub_3", submittedAt: "Oct 23, 2024, 4:45 PM", data: { email: "charlie@domain.org", message: "Reporting a bug." } },
];

export default function SubmissionsPage({ params }: { params: { id: string } }) {
    return (
        <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/forms">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Form Submissions</h1>
                    <p className="text-muted-foreground text-sm">Viewing recent activity for Form ID: <span className="font-mono">{params.id}</span></p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                </div>
            </div>

            <Alert variant="default" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                <Database className="h-4 w-4" />
                <AlertTitle>Data Source Info</AlertTitle>
                <AlertDescription>
                    This is a convenience view cache. Your connected database is the single source of truth for all data.
                </AlertDescription>
            </Alert>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Submission ID</TableHead>
                            <TableHead className="w-[220px]">Timestamp</TableHead>
                            <TableHead>Payload Data</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {SUBMISSIONS.map((sub) => (
                            <TableRow key={sub.id}>
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                    {sub.id}
                                </TableCell>
                                <TableCell className="text-sm">
                                    {sub.submittedAt}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(sub.data).map(([key, value]) => (
                                            <Badge key={key} variant="secondary" className="font-normal">
                                                <span className="font-semibold mr-1 opacity-70">{key}:</span> {value}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {SUBMISSIONS.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No submissions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
