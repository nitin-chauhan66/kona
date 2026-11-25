import { escapeHtml } from './html.js';

const SV_KEYWORDS = new Set([
  'module', 'endmodule', 'input', 'output', 'inout', 'logic', 'wire', 'reg',
  'localparam', 'parameter', 'assign', 'always_ff', 'always_comb', 'posedge',
  'negedge', 'begin', 'end', 'if', 'else'
]);

/**
 * Lightweight SystemVerilog syntax highlighter that preserves exact textContent.
 */
export function highlightSystemVerilog(code: string): string {
  return code
    .split('\n')
    .map(line => {
      const commentIdx = line.indexOf('//');
      const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
      const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

      let highlighted = '';
      if (codePart.trimStart().startsWith('`')) {
        highlighted = `<span class="sv-directive">${escapeHtml(codePart)}</span>`;
      } else {
        const tokenRegex = /([a-zA-Z_][a-zA-Z0-9_]*|\d+'[bhdoBHDO][0-9a-fA-F_xXzZ]+|\d+)/g;
        let lastIdx = 0;
        let match: RegExpExecArray | null;
        while ((match = tokenRegex.exec(codePart)) !== null) {
          if (match.index > lastIdx) {
            highlighted += escapeHtml(codePart.slice(lastIdx, match.index));
          }
          const tok = match[0];
          if (SV_KEYWORDS.has(tok)) {
            highlighted += `<span class="sv-kw">${escapeHtml(tok)}</span>`;
          } else if (/^\d/.test(tok)) {
            highlighted += `<span class="sv-num">${escapeHtml(tok)}</span>`;
          } else {
            highlighted += escapeHtml(tok);
          }
          lastIdx = tokenRegex.lastIndex;
        }
        if (lastIdx < codePart.length) {
          highlighted += escapeHtml(codePart.slice(lastIdx));
        }
      }

      if (commentPart) {
        highlighted += `<span class="sv-comment">${escapeHtml(commentPart)}</span>`;
      }
      return highlighted;
    })
    .join('\n');
}
