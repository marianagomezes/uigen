"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocationData {
  toolName: string;
  args: any;
  state: string;
  result?: any;
}

interface ToolInvocationProps {
  toolInvocation: ToolInvocationData;
}

function basename(path: string): string {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}

export function getToolInvocationLabel(
  toolName: string,
  args: any,
  isComplete: boolean
): string {
  const command = args?.command;
  const name = args?.path ? basename(args.path) : "file";

  if (toolName === "str_replace_editor") {
    switch (command) {
      case "create":
        return isComplete ? `Created ${name}` : `Creating ${name}`;
      case "str_replace":
      case "insert":
        return isComplete ? `Edited ${name}` : `Editing ${name}`;
      case "view":
        return isComplete ? `Viewed ${name}` : `Viewing ${name}`;
      case "undo_edit":
        return isComplete
          ? `Reverted changes in ${name}`
          : `Reverting changes in ${name}`;
      default:
        return isComplete ? `Updated ${name}` : `Updating ${name}`;
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename": {
        const newName = args?.new_path ? basename(args.new_path) : null;
        if (newName) {
          return isComplete
            ? `Renamed ${name} to ${newName}`
            : `Renaming ${name} to ${newName}`;
        }
        return isComplete ? `Renamed ${name}` : `Renaming ${name}`;
      }
      case "delete":
        return isComplete ? `Deleted ${name}` : `Deleting ${name}`;
      default:
        return isComplete ? `Updated ${name}` : `Updating ${name}`;
    }
  }

  return toolName;
}

export function ToolInvocation({ toolInvocation }: ToolInvocationProps) {
  const { toolName, args, state, result } = toolInvocation;
  const isComplete = state === "result" && result != null;
  const label = getToolInvocationLabel(toolName, args, isComplete);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
