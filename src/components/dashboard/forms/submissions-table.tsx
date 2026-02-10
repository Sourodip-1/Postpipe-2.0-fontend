import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formSubmissions } from "@/lib/data";
import { formatDistanceToNow } from "date-fns";

export function SubmissionsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Form Submissions</CardTitle>
        <CardDescription>
          A read-only overview of the latest submissions to your forms.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto w-full max-w-[85vw] md:max-w-full">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.id}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(submission.submittedAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell>
                    <pre className="text-xs font-code bg-muted p-2 rounded-md">
                      {JSON.stringify(submission.data, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
          <span>Showing 1 to {formSubmissions.length} of {formSubmissions.length} entries</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled>
              Previous
            </Button>
            <Button size="sm" variant="outline" disabled>
              Next
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
