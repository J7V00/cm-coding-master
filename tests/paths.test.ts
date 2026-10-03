import { describe, expect, it } from "vitest";
import { baseName, extension, language, normalizePath, parentFolder } from "../src/shared/paths";
import { lintCode } from "../src/shared/lint";

describe("paths", () => {
  it("normalizes windows and relative paths", () => {
    expect(normalizePath(".\\src\\app.ts")).toBe("src/app.ts");
    expect(normalizePath("/foo/bar")).toBe("foo/bar");
  });

  it("reads names and extensions", () => {
    expect(baseName("src/index.html")).toBe("index.html");
    expect(extension("app.tsx")).toBe("tsx");
    expect(parentFolder("src/lib/a.ts")).toBe("src/lib");
    expect(language("main.js")).toBe("JavaScript");
    expect(language("page.html")).toBe("HTML");
  });
});

describe("lint", () => {
  it("flags unclosed html tags", () => {
    const result = lintCode("<div><span>hi", "HTML");
    expect(result.messages.length).toBeGreaterThan(0);
  });

  it("accepts valid json", () => {
    expect(lintCode('{"ok":true}', "JSON").messages).toEqual([]);
  });
});
