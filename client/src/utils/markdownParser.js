import { highlightCode } from './syntaxHighlight'

const MARKDOWN_RULES = [
  { pattern: /^### (.*$)/gm, replacement: '<h3>$1</h3>' },
  { pattern: /^## (.*$)/gm, replacement: '<h2>$1</h2>' },
  { pattern: /^# (.*$)/gm, replacement: '<h1>$1</h1>' },
  { pattern: /\*\*(.+?)\*\*/g, replacement: '<strong>$1</strong>' },
  { pattern: /__(.+?)__/g, replacement: '<strong>$1</strong>' },
  { pattern: /\*(.+?)\*/g, replacement: '<em>$1</em>' },
  { pattern: /_(.+?)_/g, replacement: '<em>$1</em>' },
  { pattern: /`([^`]+)`/g, replacement: '<code class="inline-code">$1</code>' },
  { pattern: /```(\w+)?\n([\s\S]*?)```/g, replacement: (match, lang, code) => 
    `<pre class="code-block"><code class="language-${lang || 'plaintext'}">${highlightCode(code.trim(), lang)}</code></pre>`
  },
  { pattern: /^> (.*$)/gm, replacement: '<blockquote>$1</blockquote>' },
  { pattern: /^\- (.*$)/gm, replacement: '<li>$1</li>' },
  { pattern: /^\* (.*$)/gm, replacement: '<li>$1</li>' },
  { pattern: /^\d+\. (.*$)/gm, replacement: '<li>$1</li>' },
  { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>' },
  { pattern: /(https?:\/\/[^\s]+)/g, replacement: '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>' },
  { pattern: /\n\n/g, replacement: '</p><p>' },
  { pattern: /\n/g, replacement: '<br>' },
]

function escapeHtml(text) {
  const map = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

export function parseMarkdown(text) {
  if (!text) return ''

  let html = text

  for (const rule of MARKDOWN_RULES) {
    if (typeof rule.replacement === 'function') {
      html = html.replace(rule.pattern, rule.replacement)
    } else {
      html = html.replace(rule.pattern, rule.replacement)
    }
  }

  html = `<p>${html}</p>`
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[1-3]>)/g, '$1')
  html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1')
  html = html.replace(/<p>(<pre>)/g, '$1')
  html = html.replace(/(<\/pre>)<\/p>/g, '$1')
  html = html.replace(/<p>(<blockquote>)/g, '$1')
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1')
  html = html.replace(/<p>(<li>)/g, '<ul>$1')
  html = html.replace(/(<\/li>)<\/p>/g, '$1</ul>')
  html = html.replace(/<\/ul><ul>/g, '')

  return html
}

export function parseInlineMarkdown(text) {
  if (!text) return ''

  let html = escapeHtml(text)
  
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  return html
}
