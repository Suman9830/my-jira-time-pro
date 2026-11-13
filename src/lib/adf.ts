/** Minimal plain-text <-> Atlassian Document Format helpers (Jira Cloud API v3). */

export function toAdf(text: string) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length);
  return {
    type: "doc",
    version: 1,
    content: paragraphs.map((p) => ({
      type: "paragraph",
      content: p.split("\n").flatMap((line, i) => [
        ...(i > 0 ? [{ type: "hardBreak" }] : []),
        ...(line ? [{ type: "text", text: line }] : []),
      ]),
    })),
  };
}

export function fromAdf(node: any): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  const inner = (node.content ?? []).map(fromAdf);
  switch (node.type) {
    case "doc":
      return inner.join("").trim();
    case "paragraph":
    case "heading":
    case "codeBlock":
    case "blockquote":
      return inner.join("") + "\n\n";
    case "listItem":
      return "- " + inner.join("").trim() + "\n";
    default:
      return inner.join("");
  }
}
