import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";
import { ToolInvocationBadge } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

describe("ToolInvocationBadge", () => {
  describe("str_replace_editor tool", () => {
    it("displays 'Creating {file}' for create command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "create", path: "/App.jsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Creating App.jsx")).toBeDefined();
    });

    it("displays 'Editing {file}' for str_replace command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "str_replace", path: "/components/Card.tsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Editing Card.tsx")).toBeDefined();
    });

    it("displays 'Editing {file}' for insert command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "insert", path: "/utils/helper.ts" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Editing helper.ts")).toBeDefined();
    });

    it("displays 'Viewing {file}' for view command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "view", path: "/config.json" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Viewing config.json")).toBeDefined();
    });

    it("handles missing path gracefully", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "create" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("File operation")).toBeDefined();
    });

    it("handles missing command gracefully", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { path: "/App.jsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("File operation")).toBeDefined();
    });

    it("extracts filename from full path correctly", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "create", path: "/src/components/ui/Button.tsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Creating Button.tsx")).toBeDefined();
    });

    it("shows loading state (spinning icon) when state is 'call'", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "create", path: "/App.jsx" },
            state: "call",
          }}
        />
      );

      expect(screen.getByText("Creating App.jsx")).toBeDefined();
      expect(container.querySelector(".animate-spin")).toBeDefined();
    });

    it("shows completed state (green dot) when state is 'result'", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "create", path: "/App.jsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Creating App.jsx")).toBeDefined();
      expect(container.querySelector(".bg-emerald-500")).toBeDefined();
      expect(container.querySelector(".animate-spin")).toBeNull();
    });
  });

  describe("file_manager tool", () => {
    it("displays 'Renaming {old} to {new}' for rename command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "file_manager",
            args: {
              command: "rename",
              path: "/OldComponent.tsx",
              new_path: "/NewComponent.tsx",
            },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(
        screen.getByText("Renaming OldComponent.tsx to NewComponent.tsx")
      ).toBeDefined();
    });

    it("displays 'Deleting {file}' for delete command", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "file_manager",
            args: { command: "delete", path: "/TempFile.tsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Deleting TempFile.tsx")).toBeDefined();
    });

    it("handles missing paths gracefully", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "file_manager",
            args: { command: "delete" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("File operation")).toBeDefined();
    });

    it("handles missing new_path for rename gracefully", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "file_manager",
            args: { command: "rename", path: "/OldFile.tsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Renaming OldFile.tsx")).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("handles unknown tool name gracefully", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "unknown_tool",
            args: { command: "some_command", path: "/file.tsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(container.textContent).toContain("File operation");
    });

    it("handles missing args object", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(container.textContent).toContain("File operation");
    });

    it("handles long filenames with truncation", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: {
              command: "create",
              path: "/VeryLongComponentNameThatShouldBeTruncated.tsx",
            },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(container.textContent).toContain("Creating");
      expect(container.textContent).toContain("...");
      expect(container.textContent).toContain(".tsx");
    });

    it("preserves file extensions", () => {
      render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "create", path: "/Component.tsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      expect(screen.getByText("Creating Component.tsx")).toBeDefined();
    });
  });

  describe("accessibility", () => {
    it("loading state has appropriate aria-label", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "create", path: "/App.jsx" },
            state: "call",
          }}
        />
      );

      const badge = container.querySelector('[aria-label]');
      expect(badge?.getAttribute("aria-label")).toBe("Creating App.jsx - in progress");
    });

    it("completed state has appropriate aria-label", () => {
      const { container } = render(
        <ToolInvocationBadge
          toolInvocation={{
            toolName: "str_replace_editor",
            args: { command: "create", path: "/App.jsx" },
            state: "result",
            result: { success: true },
          }}
        />
      );

      const badge = container.querySelector('[aria-label]');
      expect(badge?.getAttribute("aria-label")).toBe("Creating App.jsx - completed");
    });
  });
});
