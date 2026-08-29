import type { ReactNode } from "react";
import type { RichTextMark, RichTextNode } from "@/lib/rich-text";

function applyMarks(content: ReactNode, marks: RichTextMark[] = []) {
  return marks.reduce<ReactNode>((result, mark, index) => {
    if (mark.type === "bold") return <strong key={index}>{result}</strong>;
    if (mark.type === "italic") return <em key={index}>{result}</em>;
    if (mark.type === "underline") return <u key={index}>{result}</u>;
    if (mark.type === "textStyle" && mark.attrs?.color) {
      return <span key={index} style={{ color: mark.attrs.color }}>{result}</span>;
    }
    return result;
  }, content);
}

function renderNode(node: RichTextNode, key: number | string): ReactNode {
  if (node.type === "text") return <span key={key}>{applyMarks(node.text, node.marks)}</span>;
  if (node.type === "hardBreak") return <br key={key} />;

  const children = (node.content ?? []).map((child, index) => renderNode(child, index));
  if (node.type === "paragraph") return <p key={key}>{children.length ? children : <br />}</p>;
  if (node.type === "bulletList") return <ul key={key} className="list-disc space-y-1 pl-5">{children}</ul>;
  if (node.type === "orderedList") return <ol key={key} className="list-decimal space-y-1 pl-5">{children}</ol>;
  if (node.type === "listItem") return <li key={key}>{children}</li>;
  return <div key={key}>{children}</div>;
}

export function BulletinRichText({ content }: { content: RichTextNode }) {
  return (
    <div className="space-y-4 text-[15px] leading-8 text-[var(--page-muted)]">
      {(content.content ?? []).map((node, index) => renderNode(node, index))}
    </div>
  );
}
