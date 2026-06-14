import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import {
  ToolInvocation,
  getToolInvocationLabel,
} from "../ToolInvocation";

afterEach(() => {
  cleanup();
});

const editorArgs = (command: string, path = "/components/Card.jsx") => ({
  command,
  path,
});

test("str_replace_editor create labels", () => {
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("create"), false)
  ).toBe("Creating Card.jsx");
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("create"), true)
  ).toBe("Created Card.jsx");
});

test("str_replace_editor str_replace and insert label as editing", () => {
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("str_replace"), false)
  ).toBe("Editing Card.jsx");
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("str_replace"), true)
  ).toBe("Edited Card.jsx");
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("insert"), false)
  ).toBe("Editing Card.jsx");
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("insert"), true)
  ).toBe("Edited Card.jsx");
});

test("str_replace_editor view labels", () => {
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("view"), false)
  ).toBe("Viewing Card.jsx");
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("view"), true)
  ).toBe("Viewed Card.jsx");
});

test("str_replace_editor undo_edit labels", () => {
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("undo_edit"), false)
  ).toBe("Reverting changes in Card.jsx");
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("undo_edit"), true)
  ).toBe("Reverted changes in Card.jsx");
});

test("str_replace_editor unknown command falls back to updating", () => {
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("whoknows"), false)
  ).toBe("Updating Card.jsx");
  expect(
    getToolInvocationLabel("str_replace_editor", editorArgs("whoknows"), true)
  ).toBe("Updated Card.jsx");
});

test("file_manager rename with new_path includes both names", () => {
  const args = {
    command: "rename",
    path: "/components/Card.jsx",
    new_path: "/components/ProductCard.jsx",
  };
  expect(getToolInvocationLabel("file_manager", args, false)).toBe(
    "Renaming Card.jsx to ProductCard.jsx"
  );
  expect(getToolInvocationLabel("file_manager", args, true)).toBe(
    "Renamed Card.jsx to ProductCard.jsx"
  );
});

test("file_manager rename without new_path omits target", () => {
  const args = { command: "rename", path: "/components/Card.jsx" };
  expect(getToolInvocationLabel("file_manager", args, false)).toBe(
    "Renaming Card.jsx"
  );
  expect(getToolInvocationLabel("file_manager", args, true)).toBe(
    "Renamed Card.jsx"
  );
});

test("file_manager delete labels", () => {
  const args = { command: "delete", path: "/components/Button.jsx" };
  expect(getToolInvocationLabel("file_manager", args, false)).toBe(
    "Deleting Button.jsx"
  );
  expect(getToolInvocationLabel("file_manager", args, true)).toBe(
    "Deleted Button.jsx"
  );
});

test("basename is extracted from nested paths", () => {
  expect(
    getToolInvocationLabel(
      "str_replace_editor",
      editorArgs("create", "/components/ui/forms/Button.jsx"),
      true
    )
  ).toBe("Created Button.jsx");
});

test("missing path falls back to the word 'file'", () => {
  expect(
    getToolInvocationLabel("str_replace_editor", { command: "create" }, false)
  ).toBe("Creating file");
  expect(getToolInvocationLabel("str_replace_editor", {}, false)).toBe(
    "Updating file"
  );
});

test("unknown tool falls back to the raw tool name", () => {
  expect(getToolInvocationLabel("some_other_tool", { command: "x" }, true)).toBe(
    "some_other_tool"
  );
});

test("renders in-progress state with spinner and present-tense label", () => {
  const { container } = render(
    <ToolInvocation
      toolInvocation={{
        toolName: "str_replace_editor",
        args: editorArgs("create"),
        state: "call",
      }}
    />
  );

  expect(screen.getByText("Creating Card.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("renders complete state with green dot and past-tense label", () => {
  const { container } = render(
    <ToolInvocation
      toolInvocation={{
        toolName: "str_replace_editor",
        args: editorArgs("create"),
        state: "result",
        result: "Success",
      }}
    />
  );

  expect(screen.getByText("Created Card.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});
