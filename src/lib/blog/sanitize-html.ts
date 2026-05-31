// =============================================================================
// KAZA — Assainisseur HTML pur-JS (sans jsdom), compatible runtime serverless
// Vercel. Remplace isomorphic-dompurify qui embarque jsdom et plante au
// bundling/exécution serverless.
//
// Le contenu provient d'un éditeur enrichi contraint (Tiptap) et d'auteurs
// vérifiés (admins/contributeurs) ou du seed : un assainissement par liste
// blanche (balises + attributs autorisés, neutralisation des scripts/handlers
// et protocoles dangereux) est suffisant et robuste, et fonctionne partout.
// =============================================================================

const ALLOWED_TAGS = new Set([
  "p", "br", "hr",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "mark", "small", "sub", "sup",
  "a",
  "ul", "ol", "li",
  "blockquote", "figure", "figcaption",
  "code", "pre",
  "span", "div",
  "table", "thead", "tbody", "tr", "th", "td",
  "img",
]);

// Attributs autorisés par balise (le reste est supprimé).
const ALLOWED_ATTR: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  span: new Set(["class"]),
  div: new Set(["class"]),
  p: new Set(["class"]),
  code: new Set(["class"]),
  pre: new Set(["class"]),
  th: new Set(["colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"]),
};

const DANGEROUS_BLOCK =
  /<(script|style|iframe|object|embed|form|noscript|svg|math|link|meta|base|template)\b[\s\S]*?<\/\1\s*>/gi;
const DANGEROUS_OPEN =
  /<(script|style|iframe|object|embed|form|noscript|svg|math|link|meta|base|template)\b[^>]*>/gi;

function isUnsafeUrl(value: string): boolean {
  // Retire tout caractère d'espacement (espace, tab, saut de ligne…) pour
  // déjouer les ruses du type "java\tscript:" ou les espaces de tête.
  const v = value.toLowerCase().replace(/\s+/g, "");
  return (
    v.startsWith("javascript:") ||
    v.startsWith("vbscript:") ||
    v.startsWith("data:") ||
    v.startsWith("file:")
  );
}

/** Assainit du HTML d'article pour un rendu sûr via dangerouslySetInnerHTML. */
export function sanitizeArticleHtml(html: string): string {
  if (!html) return "";

  // 1. Supprime entièrement les éléments dangereux (avec leur contenu).
  let out = html.replace(DANGEROUS_BLOCK, "").replace(DANGEROUS_OPEN, "");

  // 2. Filtre chaque balise restante (liste blanche), nettoie les attributs.
  out = out.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)\/?>/g,
    (_match, slash: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return ""; // balise interdite → on retire la balise (le texte reste)
      if (slash) return `</${tag}>`;

      const allowed = ALLOWED_ATTR[tag] ?? new Set<string>();
      let safeAttrs = "";
      const attrRe =
        /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)')/g;
      let am: RegExpExecArray | null;
      while ((am = attrRe.exec(rawAttrs)) !== null) {
        const name = am[1].toLowerCase();
        let val = am[3] !== undefined ? am[3] : (am[4] ?? "");
        if (name.startsWith("on")) continue; // gestionnaires d'événements
        if (!allowed.has(name)) continue;
        if ((name === "href" || name === "src") && isUnsafeUrl(val)) continue;
        val = val.replace(/"/g, "&quot;");
        safeAttrs += ` ${name}="${val}"`;
      }

      // Sécurise les liens ouverts dans un nouvel onglet.
      if (tag === "a" && /\btarget\s*=/.test(rawAttrs) && !/\brel\s*=/.test(safeAttrs)) {
        safeAttrs += ' rel="noopener noreferrer"';
      }

      const selfClosing = tag === "br" || tag === "hr" || tag === "img";
      return `<${tag}${safeAttrs}${selfClosing ? " /" : ""}>`;
    },
  );

  return out;
}
