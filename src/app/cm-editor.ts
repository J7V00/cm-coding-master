import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { extension } from "../shared/paths";

function languageExtension(file: string) {
  const ext = extension(file);
  if (ext === "css") return css();
  if (["js", "jsx", "mjs", "cjs"].includes(ext)) return javascript();
  if (["ts", "tsx"].includes(ext)) return javascript({ typescript: true });
  if (ext === "json") return json();
  if (ext === "md") return markdown();
  return html();
}

export type CmEditor = {
  view: EditorView;
  getValue: () => string;
  setValue: (value: string) => void;
  setFile: (file: string, value: string) => void;
  focus: () => void;
  destroy: () => void;
};

export function createCmEditor(
  parent: HTMLElement,
  options: {
    file: string;
    value: string;
    onChange: (value: string) => void;
    onCursor: () => void;
  },
): CmEditor {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) options.onChange(update.state.doc.toString());
    if (update.selectionSet || update.docChanged) options.onCursor();
  });

  let view = new EditorView({
    parent,
    state: EditorState.create({
      doc: options.value,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
        oneDark,
        languageExtension(options.file),
        updateListener,
        EditorView.theme({
          "&": { height: "100%", fontSize: "13px" },
          ".cm-scroller": { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", overflow: "auto" },
        }),
      ],
    }),
  });

  return {
    view,
    getValue: () => view.state.doc.toString(),
    setValue(value) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
    },
    setFile(file, value) {
      const parentEl = view.dom.parentElement!;
      view.destroy();
      view = new EditorView({
        parent: parentEl,
        state: EditorState.create({
          doc: value,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            history(),
            keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
            oneDark,
            languageExtension(file),
            updateListener,
            EditorView.theme({
              "&": { height: "100%", fontSize: "13px" },
              ".cm-scroller": {
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                overflow: "auto",
              },
            }),
          ],
        }),
      });
    },
    focus: () => view.focus(),
    destroy: () => view.destroy(),
  };
}
