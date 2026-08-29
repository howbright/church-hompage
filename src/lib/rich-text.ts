export const COLUMN_TEXT_COLORS = [
  { label: "기본", value: "#666666" },
  { label: "파랑", value: "#075f9b" },
  { label: "빨강", value: "#b42318" },
  { label: "초록", value: "#2f6f44" },
] as const;

export const MAX_COLUMN_LENGTH = 30_000;

export type RichTextMark = {
  type: "bold" | "italic" | "underline" | "textStyle";
  attrs?: { color?: string };
};

export type RichTextNode = {
  type:
    | "doc"
    | "paragraph"
    | "bulletList"
    | "orderedList"
    | "listItem"
    | "text"
    | "hardBreak";
  text?: string;
  marks?: RichTextMark[];
  content?: RichTextNode[];
};

export type RichTextDocument = RichTextNode & { type: "doc" };

const allowedNodeTypes = new Set([
  "doc",
  "paragraph",
  "bulletList",
  "orderedList",
  "listItem",
  "text",
  "hardBreak",
]);

const allowedMarkTypes = new Set(["bold", "italic", "underline", "textStyle"]);
const allowedColors = new Set<string>(COLUMN_TEXT_COLORS.map((color) => color.value));

function sanitizeMark(value: unknown): RichTextMark | null {
  if (!value || typeof value !== "object") return null;
  const mark = value as { type?: unknown; attrs?: unknown };
  if (typeof mark.type !== "string" || !allowedMarkTypes.has(mark.type)) {
    return null;
  }

  if (mark.type === "textStyle") {
    const attrs = mark.attrs as { color?: unknown } | undefined;
    if (typeof attrs?.color !== "string" || !allowedColors.has(attrs.color)) {
      return null;
    }
    return { type: "textStyle", attrs: { color: attrs.color } };
  }

  return { type: mark.type as "bold" | "italic" | "underline" };
}

function sanitizeNode(value: unknown): RichTextNode | null {
  if (!value || typeof value !== "object") return null;
  const node = value as {
    type?: unknown;
    text?: unknown;
    marks?: unknown;
    content?: unknown;
  };
  if (typeof node.type !== "string" || !allowedNodeTypes.has(node.type)) {
    return null;
  }

  if (node.type === "text") {
    if (typeof node.text !== "string") return null;
    const marks = Array.isArray(node.marks)
      ? node.marks.map(sanitizeMark).filter((mark): mark is RichTextMark => Boolean(mark))
      : undefined;
    return { type: "text", text: node.text, ...(marks?.length ? { marks } : {}) };
  }

  if (node.type === "hardBreak") return { type: "hardBreak" };

  const content = Array.isArray(node.content)
    ? node.content.map(sanitizeNode).filter((child): child is RichTextNode => Boolean(child))
    : [];

  return {
    type: node.type as Exclude<RichTextNode["type"], "text" | "hardBreak">,
    content,
  };
}

export function sanitizeRichText(value: unknown): RichTextDocument | null {
  if (!value || typeof value !== "object") return null;
  const rawDocument = value as { type?: unknown; content?: unknown };
  if (rawDocument.type !== "doc" || !Array.isArray(rawDocument.content)) {
    return null;
  }

  const content = rawDocument.content.flatMap((rawNode) => {
    const nodeType =
      rawNode && typeof rawNode === "object"
        ? (rawNode as { type?: unknown }).type
        : null;
    if (
      nodeType === "paragraph" ||
      nodeType === "bulletList" ||
      nodeType === "orderedList"
    ) {
      const node = sanitizeNode(rawNode);
      return node ? [node] : [];
    }

    const fallbackText = unknownNodeText(rawNode).trim();
    return fallbackText
      ? [
          {
            type: "paragraph" as const,
            content: [{ type: "text" as const, text: fallbackText }],
          },
        ]
      : [];
  });

  return { type: "doc", content };
}

function unknownNodeText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const node = value as { type?: unknown; text?: unknown; content?: unknown };
  if (typeof node.text === "string") return node.text;
  const separator =
    node.type === "paragraph" || node.type === "heading" ? "" : "\n";
  return Array.isArray(node.content)
    ? node.content.map(unknownNodeText).filter(Boolean).join(separator)
    : "";
}

export function plainTextToRichDocument(text: string): RichTextDocument {
  const paragraphs = text.split(/\n\s*\n/g);
  return {
    type: "doc",
    content: paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: paragraph.split("\n").flatMap((line, index) => [
        ...(index ? [{ type: "hardBreak" as const }] : []),
        ...(line ? [{ type: "text" as const, text: line }] : []),
      ]),
    })),
  };
}

function nodeText(node: RichTextNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  const separator =
    node.type === "doc"
      ? "\n\n"
      : node.type === "bulletList" || node.type === "orderedList"
        ? "\n"
        : "";
  return (node.content ?? []).map(nodeText).join(separator);
}

export function richTextToPlainText(document: RichTextDocument): string {
  return nodeText(document).trim();
}

export function getRichTextBlocks(document: RichTextDocument): RichTextNode[] {
  return document.content ?? [];
}

export function richTextDocumentFromBlocks(blocks: RichTextNode[]): RichTextDocument {
  return { type: "doc", content: blocks };
}

function splitParagraph(block: RichTextNode, charLimit: number): RichTextNode[] {
  const chunks: RichTextNode[][] = [];
  let current: RichTextNode[] = [];
  let currentLength = 0;

  const flush = () => {
    if (current.length) chunks.push(current);
    current = [];
    currentLength = 0;
  };

  for (const node of block.content ?? []) {
    if (node.type === "hardBreak") {
      if (currentLength >= charLimit) flush();
      current.push(node);
      currentLength += 1;
      continue;
    }

    if (node.type !== "text") continue;
    let offset = 0;
    const text = node.text ?? "";
    while (offset < text.length) {
      if (currentLength >= charLimit) flush();
      const available = Math.max(charLimit - currentLength, 1);
      const piece = text.slice(offset, offset + available);
      current.push({ ...node, text: piece });
      currentLength += piece.length;
      offset += piece.length;
    }
  }

  flush();
  return (chunks.length ? chunks : [[]]).map((content) => ({
    type: "paragraph",
    content,
  }));
}

function splitList(block: RichTextNode, charLimit: number): RichTextNode[] {
  const expandedItems = (block.content ?? []).flatMap((item) => {
    const itemLength = richTextToPlainText(
      richTextDocumentFromBlocks([item]),
    ).length;
    if (itemLength <= charLimit) return [item];

    return (item.content ?? []).flatMap((child) =>
      splitRichTextBlock(child, charLimit).map((part) => ({
        type: "listItem" as const,
        content: [part],
      })),
    );
  });

  const groups: RichTextNode[][] = [];
  let current: RichTextNode[] = [];
  let currentLength = 0;

  for (const item of expandedItems) {
    const itemLength = richTextToPlainText(
      richTextDocumentFromBlocks([item]),
    ).length;
    if (current.length && currentLength + itemLength > charLimit) {
      groups.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(item);
    currentLength += itemLength;
  }
  if (current.length) groups.push(current);

  return groups.map((content) => ({ type: block.type, content }));
}

export function splitRichTextBlock(
  block: RichTextNode,
  charLimit: number,
): RichTextNode[] {
  if (charLimit < 1) return [block];
  if (block.type === "paragraph") return splitParagraph(block, charLimit);
  if (block.type === "bulletList" || block.type === "orderedList") {
    return splitList(block, charLimit);
  }
  return [block];
}
