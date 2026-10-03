export type LintResult = {
  lines: number[];
  messages: string[];
};

export function lintCode(code: string, lang: string): LintResult {
  const linesWithProblems = new Set<number>();
  const messages: string[] = [];

  if (lang === "HTML") {
    const stack: Array<{ name: string; line: number }> = [];
    const voidTags = new Set([
      "area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
      "param", "source", "track", "wbr",
    ]);
    const pattern = /<\s*\/?\s*([A-Za-z0-9:-]+)[^>]*>/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(code))) {
      const raw = match[0];
      if (raw.startsWith("<!--")) continue;
      const name = match[1].toLowerCase();
      const line = code.slice(0, match.index).split("\n").length;

      if (/^<\s*\//.test(raw)) {
        const index = stack.map((item) => item.name).lastIndexOf(name);
        if (index === -1) {
          linesWithProblems.add(line);
          messages.push(`Closing tag </${name}> has no matching opening tag.`);
        } else {
          stack.splice(index, stack.length - index);
        }
      } else if (!voidTags.has(name) && !/\s*\/>$/.test(raw)) {
        stack.push({ name, line });
      }
    }

    stack.forEach((item) => {
      linesWithProblems.add(item.line);
      messages.push(`Tag <${item.name}> is not closed.`);
    });
  }

  if (lang === "JSON") {
    try {
      JSON.parse(code);
    } catch (error) {
      const message = String((error as Error)?.message || "Invalid JSON");
      messages.push(message);
      const positionMatch = message.match(/position\s+(\d+)/i);
      const position = positionMatch ? Number(positionMatch[1]) : 0;
      linesWithProblems.add(code.slice(0, position).split("\n").length || 1);
    }
  }

  if (lang === "JavaScript" || lang === "CSS") {
    const pairs: Array<[string, string]> = [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ];
    const sourceLines = code.split("\n");

    for (const [open, close] of pairs) {
      let balance = 0;
      sourceLines.forEach((line, index) => {
        for (const char of line) {
          if (char === open) balance++;
          if (char === close) balance--;
          if (balance < 0) {
            linesWithProblems.add(index + 1);
            messages.push(`Unexpected ${close}.`);
            balance = 0;
          }
        }
      });
      if (balance > 0) {
        linesWithProblems.add(sourceLines.length);
        messages.push(`Missing ${close}.`);
      }
    }
  }

  return {
    lines: [...linesWithProblems],
    messages: [...new Set(messages)].slice(0, 8),
  };
}
