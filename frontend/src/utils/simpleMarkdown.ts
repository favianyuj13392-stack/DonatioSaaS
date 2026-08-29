/**
 * Lightweight markdown-to-HTML converter for campaign story narratives.
 * Handles: bold, italic, headings (h3-h4), links, unordered lists, line breaks.
 * NOT a full markdown parser — covers the 80% case for editorial content.
 */
export function renderSimpleMarkdown(md: string): string {
  if (!md) return '';
  
  let html = md
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headings (### and ####)
    .replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold text-slate-900 mt-4 mb-1">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-slate-900 mt-6 mb-2">$1</h3>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[var(--tenant-primary)] underline hover:opacity-80">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-slate-600">$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul class="space-y-1 my-3">$1</ul>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="text-slate-600 leading-relaxed">')
    // Single newlines to <br>
    .replace(/\n/g, '<br />');

  // Wrap in paragraph if not starting with a block element
  if (!html.startsWith('<h') && !html.startsWith('<ul')) {
    html = `<p class="text-slate-600 leading-relaxed">${html}</p>`;
  }

  return html;
}
