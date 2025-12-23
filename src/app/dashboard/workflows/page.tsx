"use client";

import { Activity, FileText, Server, Bolt, Globe, Database, ArrowRight } from "lucide-react";
import { FeatureComparison } from "@/components/ui/feature-comparison";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const StaticContent = (width: number) => {
  const showDiagram = width > 40;
  const showBenefits = width > 60;

  return (
    <div className="w-full h-full flex flex-col items-center justify-start pt-20 bg-gradient-to-br from-blue-500/5 to-purple-500/5 p-8 overflow-y-auto">
      <div className="flex flex-col items-center text-center space-y-6 max-w-lg transition-all duration-300">
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4 transition-transform duration-300 hover:scale-110">
            <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Static Workflows</h2>
          <p className="text-muted-foreground text-sm max-w-[300px]">
            Frontend directly talks to the database. Secure & Fast.
          </p>
        </div>

        {/* Content Area - Fixed Height to prevent jumping */}
        <div className="w-full h-[200px] flex flex-col items-center justify-center">
          {showBenefits && (
            <div className="grid grid-cols-2 gap-2 w-full text-xs font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 mb-4">
              <div className="bg-background/80 p-2 rounded border flex items-center gap-2 justify-center"><Activity className="h-3 w-3" /> Zero Latency</div>
              <div className="bg-background/80 p-2 rounded border flex items-center gap-2 justify-center"><Server className="h-3 w-3" /> Serverless</div>
            </div>
          )}

          {showDiagram ? (
            <div className="bg-background/50 backdrop-blur-sm border rounded-xl p-4 w-full text-left shadow-sm animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2"><Globe className="h-4 w-4" /> Client</div>
                <div className="flex-1 h-px bg-border border-t border-dashed" />
                <div className="flex items-center gap-2">DB <Server className="h-4 w-4" /></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs p-2 bg-background rounded border">
                  <span className="font-mono">POST /api/submit</span>
                  <Badge variant="secondary" className="text-[10px] h-5">200 OK</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic opacity-50 flex items-center gap-2">
              <ArrowRight className="h-4 w-4 animate-pulse" /> Drag to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DynamicContent = (width: number) => {
  const showCode = width > 40;
  const showConsole = width > 60;

  return (
    <div className="w-full h-full flex flex-col items-center justify-start pt-20 bg-gradient-to-br from-amber-500/5 to-red-500/5 p-8 overflow-y-auto">
      <div className="flex flex-col items-center text-center space-y-6 max-w-lg transition-all duration-300">
        <div className="flex flex-col items-center">
          <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4 transition-transform duration-300 hover:scale-110">
            <Bolt className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Dynamic Workflows</h2>
          <p className="text-muted-foreground text-sm max-w-[300px]">
            Server-side logic. Auth, Payments, AI, & 3rd Party APIs.
          </p>
        </div>

        {/* Content Area - Fixed Height to prevent jumping */}
        <div className="w-full h-[240px] flex flex-col items-center justify-start"> {/* Slightly taller for code */}
          {showCode ? (
            <div className="w-full bg-zinc-950 rounded-lg border shadow-xl overflow-hidden text-left font-mono text-xs animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-zinc-900">
                <div className="ml-auto text-zinc-500 text-[10px]">workflow.ts</div>
              </div>
              <div className="p-3 space-y-1 text-zinc-300 leading-tight">
                <div><span className="text-purple-400">export function</span> <span className="text-blue-400">POST</span>() {"{"}</div>
                <div className="pl-4"><span className="text-pink-400">if</span> (risk) <span className="text-yellow-300">await</span> ai.check();</div>
                <div className="pl-4"><span className="text-yellow-300">await</span> db.save();</div>
                <div>{"}"}</div>
              </div>

              {showConsole && (
                <div className="border-t border-zinc-800 bg-black/50 p-2 font-mono text-[10px] text-green-400 animate-in fade-in duration-500">
                  <div>{">"} Starting...</div>
                  <div>{">"} Done in 24ms</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic opacity-50 flex items-center gap-2 mt-12">
              <ArrowRight className="h-4 w-4 animate-pulse rotate-180" /> Drag to see code
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)]">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          Workflows
        </h1>
        <p className="mt-1 text-muted-foreground">
          Compare and manage your static and dynamic automation strategies.
        </p>
      </div>

      <div className="flex-1 min-h-[500px] w-full">
        <FeatureComparison
          leftContent={StaticContent}
          rightContent={DynamicContent}
          leftBadge="Static Workflow"
          rightBadge="Dynamic Workflow"
          className="h-full shadow-sm"
        />
      </div>
    </div>
  );
}
