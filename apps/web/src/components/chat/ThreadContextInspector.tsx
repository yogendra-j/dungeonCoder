import { memo, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PanelRightCloseIcon,
  WrenchIcon,
  ServerIcon,
  SparklesIcon,
  BotIcon,
  PlugIcon,
  TerminalIcon,
  TagIcon,
  InfoIcon,
  DollarSignIcon,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "~/lib/utils";
import type { ThreadContext, UsageSummary } from "../../session-logic";

const TOOL_GROUPS: Record<string, string[]> = {
  "File Operations": ["Read", "Write", "Edit", "Glob", "NotebookEdit"],
  Search: ["Grep", "WebSearch", "WebFetch"],
  Execution: ["Bash", "Agent", "Skill"],
  Other: [],
};

function groupTools(tools: string[]): Array<{ group: string; items: string[] }> {
  const assigned = new Set<string>();
  const result: Array<{ group: string; items: string[] }> = [];

  for (const [group, groupTools] of Object.entries(TOOL_GROUPS)) {
    if (group === "Other") continue;
    const items = tools.filter((t) => groupTools.includes(t));
    if (items.length > 0) {
      result.push({ group, items });
      for (const item of items) assigned.add(item);
    }
  }

  const remaining = tools.filter((t) => !assigned.has(t));
  if (remaining.length > 0) {
    result.push({ group: "Other", items: remaining });
  }

  return result;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function InspectorSection({
  title,
  icon,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-1">
      <button
        type="button"
        className="group flex w-full items-center gap-1.5 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? (
          <ChevronDownIcon className="size-3 shrink-0 text-muted-foreground/40 transition-transform" />
        ) : (
          <ChevronRightIcon className="size-3 shrink-0 text-muted-foreground/40 transition-transform" />
        )}
        <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase group-hover:text-muted-foreground/70">
          {icon}
          {title}
        </span>
        {count !== undefined && count > 0 ? (
          <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[9px]">
            {count}
          </Badge>
        ) : null}
      </button>
      {open ? <div className="pl-4.5 pt-1">{children}</div> : null}
    </div>
  );
}

interface ThreadContextInspectorProps {
  context: ThreadContext;
  usage: UsageSummary;
  onClose: () => void;
}

export const ThreadContextInspector = memo(function ThreadContextInspector({
  context,
  usage,
  onClose,
}: ThreadContextInspectorProps) {
  const hasUsageData = usage.totalCost > 0 || usage.totalTokens > 0;

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-l border-border/70 bg-card/50">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border/60 px-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="rounded-md bg-violet-500/10 px-1.5 py-0 text-[10px] font-semibold tracking-wide text-violet-400 uppercase"
          >
            Context
          </Badge>
          {context.claudeCodeVersion ? (
            <span className="text-[11px] text-muted-foreground/50">
              v{context.claudeCodeVersion}
            </span>
          ) : null}
        </div>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={onClose}
          aria-label="Close context inspector"
          className="text-muted-foreground/50 hover:text-foreground/70"
        >
          <PanelRightCloseIcon className="size-3.5" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-3">
          {/* Session Info */}
          <InspectorSection
            title="Session"
            icon={<InfoIcon className="size-3" />}
            defaultOpen
          >
            <div className="space-y-1.5 text-[12px]">
              {context.model ? (
                <KeyValue label="Model" value={context.model} />
              ) : null}
              {context.cwd ? (
                <KeyValue label="CWD" value={context.cwd} truncate />
              ) : null}
              {context.permissionMode ? (
                <KeyValue label="Permissions" value={context.permissionMode} />
              ) : null}
              {context.outputStyle ? (
                <KeyValue label="Output Style" value={context.outputStyle} />
              ) : null}
              {context.apiKeySource ? (
                <KeyValue label="API Key" value={context.apiKeySource} />
              ) : null}
              {context.fastModeState ? (
                <KeyValue label="Fast Mode" value={context.fastModeState} />
              ) : null}
              {context.sessionId ? (
                <KeyValue
                  label="Session ID"
                  value={context.sessionId.slice(0, 12) + "..."}
                  title={context.sessionId}
                />
              ) : null}
            </div>
          </InspectorSection>

          {/* Usage & Cost */}
          {hasUsageData ? (
            <InspectorSection
              title="Usage"
              icon={<DollarSignIcon className="size-3" />}
              defaultOpen
            >
              <div className="space-y-1.5 text-[12px]">
                {usage.totalCost > 0 ? (
                  <KeyValue label="Total Cost" value={`$${usage.totalCost.toFixed(4)}`} />
                ) : null}
                {usage.totalTokens > 0 ? (
                  <KeyValue label="Total Tokens" value={formatTokens(usage.totalTokens)} />
                ) : null}
                {usage.inputTokens > 0 ? (
                  <KeyValue label="Input" value={formatTokens(usage.inputTokens)} />
                ) : null}
                {usage.outputTokens > 0 ? (
                  <KeyValue label="Output" value={formatTokens(usage.outputTokens)} />
                ) : null}
                {usage.cacheReadTokens > 0 ? (
                  <KeyValue label="Cache Read" value={formatTokens(usage.cacheReadTokens)} />
                ) : null}
                {usage.cacheCreationTokens > 0 ? (
                  <KeyValue label="Cache Created" value={formatTokens(usage.cacheCreationTokens)} />
                ) : null}
              </div>
            </InspectorSection>
          ) : null}

          {/* Tools */}
          {context.tools.length > 0 ? (
            <InspectorSection
              title="Tools"
              icon={<WrenchIcon className="size-3" />}
              count={context.tools.length}
              defaultOpen
            >
              <div className="space-y-2">
                {groupTools(context.tools).map(({ group, items }) => (
                  <div key={group}>
                    <p className="mb-1 text-[10px] font-medium text-muted-foreground/40">
                      {group}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {items.map((tool) => (
                        <Badge
                          key={tool}
                          variant="outline"
                          className="px-1.5 py-0 text-[10px] font-normal"
                        >
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </InspectorSection>
          ) : null}

          {/* MCP Servers */}
          {context.mcpServers.length > 0 ? (
            <InspectorSection
              title="MCP Servers"
              icon={<ServerIcon className="size-3" />}
              count={context.mcpServers.length}
              defaultOpen
            >
              <div className="space-y-1">
                {context.mcpServers.map((server) => (
                  <div
                    key={server.name}
                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1 text-[12px]"
                  >
                    <span className="truncate">{server.name}</span>
                    <Badge
                      variant={server.status === "connected" ? "default" : "outline"}
                      className={cn(
                        "shrink-0 px-1.5 py-0 text-[9px]",
                        server.status === "connected"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : server.status === "error"
                            ? "bg-red-500/15 text-red-500"
                            : "text-muted-foreground/60",
                      )}
                    >
                      {server.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </InspectorSection>
          ) : null}

          {/* Skills */}
          {context.skills.length > 0 ? (
            <InspectorSection
              title="Skills"
              icon={<SparklesIcon className="size-3" />}
              count={context.skills.length}
            >
              <div className="flex flex-wrap gap-1">
                {context.skills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </InspectorSection>
          ) : null}

          {/* Agents */}
          {context.agents.length > 0 ? (
            <InspectorSection
              title="Agents"
              icon={<BotIcon className="size-3" />}
              count={context.agents.length}
            >
              <div className="flex flex-wrap gap-1">
                {context.agents.map((agent) => (
                  <Badge
                    key={agent}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-normal"
                  >
                    {agent}
                  </Badge>
                ))}
              </div>
            </InspectorSection>
          ) : null}

          {/* Plugins */}
          {context.plugins.length > 0 ? (
            <InspectorSection
              title="Plugins"
              icon={<PlugIcon className="size-3" />}
              count={context.plugins.length}
            >
              <div className="space-y-1">
                {context.plugins.map((plugin) => (
                  <div key={plugin.name} className="text-[12px]">
                    <span className="font-medium">{plugin.name}</span>
                    {plugin.path ? (
                      <span className="ml-1 text-muted-foreground/50" title={plugin.path}>
                        {plugin.path.length > 30
                          ? `...${plugin.path.slice(-30)}`
                          : plugin.path}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </InspectorSection>
          ) : null}

          {/* Slash Commands */}
          {context.slashCommands.length > 0 ? (
            <InspectorSection
              title="Slash Commands"
              icon={<TerminalIcon className="size-3" />}
              count={context.slashCommands.length}
            >
              <div className="flex flex-wrap gap-1">
                {context.slashCommands.map((cmd) => (
                  <Badge
                    key={cmd}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-mono font-normal"
                  >
                    /{cmd}
                  </Badge>
                ))}
              </div>
            </InspectorSection>
          ) : null}

          {/* Betas */}
          {context.betas.length > 0 ? (
            <InspectorSection
              title="Betas"
              icon={<TagIcon className="size-3" />}
              count={context.betas.length}
            >
              <div className="flex flex-wrap gap-1">
                {context.betas.map((beta) => (
                  <Badge
                    key={beta}
                    variant="outline"
                    className="px-1.5 py-0 text-[10px] font-mono font-normal text-amber-500/80"
                  >
                    {beta}
                  </Badge>
                ))}
              </div>
            </InspectorSection>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
});

function KeyValue({
  label,
  value,
  truncate,
  title,
}: {
  label: string;
  value: string;
  truncate?: boolean;
  title?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="shrink-0 text-muted-foreground/50">{label}</span>
      <span
        className={cn(
          "text-right font-mono text-foreground/80",
          truncate && "max-w-[180px] truncate",
        )}
        title={title ?? (truncate ? value : undefined)}
      >
        {value}
      </span>
    </div>
  );
}

export type { ThreadContextInspectorProps };
