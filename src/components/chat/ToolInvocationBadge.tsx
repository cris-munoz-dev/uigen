import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolInvocationBadgeProps {
  toolInvocation: {
    toolName: string;
    args?: any;
    state: "call" | "result";
    result?: any;
  };
  className?: string;
}

function extractFilename(path: string | undefined): string {
  if (!path) return "";
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  const parts = normalized.split("/");
  return parts[parts.length - 1];
}

function truncateFilename(filename: string, maxLength: number = 30): string {
  if (filename.length <= maxLength) return filename;

  const extension = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
  const nameWithoutExt = filename.slice(0, filename.lastIndexOf("."));
  const availableLength = maxLength - extension.length - 3; // 3 for "..."

  if (availableLength <= 0) return filename.slice(0, maxLength - 3) + "...";

  return nameWithoutExt.slice(0, availableLength) + "..." + extension;
}

function generateMessage(toolName: string, args: any): string {
  if (!args) return "File operation";

  if (toolName === "str_replace_editor") {
    const command = args.command;
    const path = args.path;
    const filename = extractFilename(path);

    if (!filename) return "File operation";

    switch (command) {
      case "create":
        return `Creating ${truncateFilename(filename)}`;
      case "str_replace":
        return `Editing ${truncateFilename(filename)}`;
      case "insert":
        return `Editing ${truncateFilename(filename)}`;
      case "view":
        return `Viewing ${truncateFilename(filename)}`;
      default:
        return command ? `Modifying ${truncateFilename(filename)}` : "File operation";
    }
  }

  if (toolName === "file_manager") {
    const command = args.command;
    const path = args.path;
    const newPath = args.new_path;
    const filename = extractFilename(path);

    if (!filename) return "File operation";

    switch (command) {
      case "rename":
        const newFilename = extractFilename(newPath);
        if (newFilename) {
          return `Renaming ${truncateFilename(filename)} to ${truncateFilename(newFilename)}`;
        }
        return `Renaming ${truncateFilename(filename)}`;
      case "delete":
        return `Deleting ${truncateFilename(filename)}`;
      default:
        return "File operation";
    }
  }

  return "File operation";
}

export function ToolInvocationBadge({ toolInvocation, className }: ToolInvocationBadgeProps) {
  const message = generateMessage(toolInvocation.toolName, toolInvocation.args);
  const isLoading = toolInvocation.state === "call";
  const isCompleted = toolInvocation.state === "result" && toolInvocation.result;

  const ariaLabel = isLoading
    ? `${message} - in progress`
    : `${message} - completed`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200",
        className
      )}
      aria-label={ariaLabel}
    >
      {isCompleted ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true"></div>
          <span className="text-neutral-700">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" aria-hidden="true" />
          <span className="text-neutral-700">{message}</span>
        </>
      )}
    </div>
  );
}
