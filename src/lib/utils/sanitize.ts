import sanitizeHtml from "sanitize-html";

/**
 * Server-side sanitisation for rich-text (HTML) content before it is
 * persisted. Strips scripts, event handlers, javascript: URLs and any
 * disallowed markup, closing a whole class of stored-XSS vectors.
 */
export function sanitizeHtmlContent(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p", "br", "hr", "h1", "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "u", "s", "sub", "sup", "blockquote", "code", "pre",
      "ul", "ol", "li", "a", "img", "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "figure", "figcaption",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
      "*": ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

/** Strip every tag, leaving plain text (for plain-text fields that render as HTML). */
export function stripAllHtml(dirty: string): string {
  return sanitizeHtml(dirty, { allowedTags: [], allowedAttributes: {} });
}
