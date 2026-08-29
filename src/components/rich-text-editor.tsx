"use client";

import { useEffect, useRef } from "react";
import { Color } from "@tiptap/extension-color";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  COLUMN_TEXT_COLORS,
  plainTextToRichDocument,
  type RichTextDocument,
} from "@/lib/rich-text";

export function RichTextEditor({
  value,
  plainText,
  onChange,
}: {
  value: RichTextDocument | null;
  plainText: string;
  onChange: (document: RichTextDocument, plainText: string) => void;
}) {
  const lastEmittedValue = useRef<RichTextDocument | null>(value);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        link: false,
        strike: false,
      }),
      TextStyle,
      Color,
      Placeholder.configure({
        placeholder: "칼럼 내용을 입력하거나 설교 초록으로 생성해 주세요.",
      }),
    ],
    content: value ?? plainTextToRichDocument(plainText),
    editorProps: {
      attributes: {
        id: "column-content-editor",
        class:
          "min-h-64 px-4 py-4 text-sm leading-7 text-[var(--page-muted)] outline-none [&_p]:mb-3 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6",
        role: "textbox",
        "aria-label": "칼럼 내용",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const document = currentEditor.getJSON() as RichTextDocument;
      lastEmittedValue.current = document;
      onChange(
        document,
        currentEditor.getText({ blockSeparator: "\n\n" }),
      );
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastEmittedValue.current) return;
    const nextContent = value ?? plainTextToRichDocument(plainText);
    lastEmittedValue.current = value;
    editor.commands.setContent(nextContent, { emitUpdate: false });
  }, [editor, plainText, value]);

  if (!editor) {
    return <div className="min-h-64 animate-pulse rounded-[1.5rem] bg-black/5" />;
  }

  const buttonClass = (active = false) =>
    `h-10 shrink-0 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${
      active
        ? "border-[#3f9fe8] bg-[#eaf7ff] text-[#075f9b]"
        : "border-black/10 bg-white text-[var(--page-deep)] hover:border-black/25"
    }`;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-white focus-within:border-[var(--page-accent-strong)]">
      <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto border-b border-black/10 bg-[#f8fafb] px-3 py-2.5 sm:flex-wrap sm:overflow-visible">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive("bold"))} aria-label="굵게" aria-pressed={editor.isActive("bold")}>
          <strong>가</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive("italic"))} aria-label="기울임" aria-pressed={editor.isActive("italic")}>
          <em>가</em>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={buttonClass(editor.isActive("underline"))} aria-label="밑줄" aria-pressed={editor.isActive("underline")}>
          <span className="underline">가</span>
        </button>
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-black/10" />
        {COLUMN_TEXT_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => editor.chain().focus().setColor(color.value).run()}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-white transition ${editor.isActive("textStyle", { color: color.value }) ? "border-[#3f9fe8]" : "border-black/10 hover:border-black/25"}`}
            aria-label={`${color.label} 글자색`}
            aria-pressed={editor.isActive("textStyle", { color: color.value })}
            title={`${color.label} 글자색`}
          >
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: color.value }}
            />
          </button>
        ))}
        <span aria-hidden="true" className="mx-1 h-5 w-px bg-black/10" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive("bulletList"))} aria-pressed={editor.isActive("bulletList")}>
          • 목록
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={buttonClass(editor.isActive("orderedList"))} aria-pressed={editor.isActive("orderedList")}>
          1. 목록
        </button>
        <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className={buttonClass()}>
          서식 지우기
        </button>
        <div className="ml-auto flex shrink-0 gap-1">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={buttonClass()} aria-label="실행 취소">↶</button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={buttonClass()} aria-label="다시 실행">↷</button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
