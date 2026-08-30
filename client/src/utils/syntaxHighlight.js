function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const LANGUAGE_KEYWORDS = {
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue', 'class', 'extends', 'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'instanceof', 'this', 'super', 'null', 'undefined', 'true', 'false'],
  typescript: ['interface', 'type', 'enum', 'namespace', 'readonly', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'implements', 'import', 'export', 'async', 'await', 'public', 'private', 'protected', 'true', 'false'],
  python: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'pass', 'break', 'continue', 'lambda', 'yield', 'async', 'await', 'None', 'True', 'False', 'and', 'or', 'not', 'in', 'is', 'self'],
  java: ['public', 'private', 'protected', 'static', 'void', 'class', 'interface', 'extends', 'implements', 'new', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'finally', 'import', 'package', 'this', 'super', 'null', 'true', 'false'],
  go: ['func', 'package', 'import', 'var', 'const', 'go', 'defer', 'chan', 'select', 'return', 'if', 'else', 'for', 'range', 'struct', 'interface', 'map', 'type', 'true', 'false'],
  rust: ['fn', 'let', 'mut', 'struct', 'enum', 'impl', 'trait', 'match', 'use', 'mod', 'pub', 'return', 'if', 'else', 'for', 'while', 'loop', 'true', 'false'],
  cpp: ['include', 'class', 'namespace', 'template', 'public', 'private', 'protected', 'return', 'if', 'else', 'for', 'while', 'int', 'float', 'double', 'char', 'void', 'const', 'static', 'new', 'delete'],
  c: ['include', 'int', 'main', 'return', 'if', 'else', 'for', 'while', 'void', 'char', 'const', 'static', 'struct'],
  sql: ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'JOIN', 'CREATE', 'TABLE', 'AND', 'OR', 'NOT', 'NULL', 'ORDER', 'BY', 'GROUP', 'INTO', 'VALUES', 'SET'],
  bash: ['echo', 'cd', 'ls', 'grep', 'awk', 'sed', 'cat', 'chmod', 'sudo', 'apt', 'yum', 'if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while'],
}

const COMMENT_DEFS = {
  javascript: [{ start: '//', end: null }, { start: '/*', end: '*/' }],
  typescript: [{ start: '//', end: null }, { start: '/*', end: '*/' }],
  java: [{ start: '//', end: null }, { start: '/*', end: '*/' }],
  go: [{ start: '//', end: null }, { start: '/*', end: '*/' }],
  rust: [{ start: '//', end: null }, { start: '/*', end: '*/' }],
  cpp: [{ start: '//', end: null }, { start: '/*', end: '*/' }],
  c: [{ start: '//', end: null }, { start: '/*', end: '*/' }],
  python: [{ start: '#', end: null }],
  bash: [{ start: '#', end: null }],
  sql: [{ start: '--', end: null }],
}

export function highlightCode(code, language) {
  const text = code || ''

  if (!language || !LANGUAGE_KEYWORDS[language]) {
    return escapeHtml(text)
  }

  const keywordPattern = LANGUAGE_KEYWORDS[language].join('|')
  const commentDefs = COMMENT_DEFS[language] || []

  const commentAlternatives = commentDefs.map(c => {
    const start = escapeRegExp(c.start)
    if (c.end) {
      return `${start}[\\s\\S]*?${escapeRegExp(c.end)}`
    }
    return `${start}.*`
  })

  const patternDefs = [
    ...commentAlternatives.map(regex => ({ type: 'comment', regex })),
    { type: 'string', regex: `"(?:\\\\.|[^"\\\\])*"|'(?:\\\\.|[^'\\\\])*'|\`(?:\\\\.|[^\`\\\\])*\`` },
    { type: 'keyword', regex: `\\b(?:${keywordPattern})\\b` },
    { type: 'number', regex: `\\b\\d+(?:\\.\\d+)?\\b` },
    { type: 'function', regex: `\\b[a-zA-Z_][\\w]*(?=\\()` },
  ]

  const combined = new RegExp(patternDefs.map(p => `(${p.regex})`).join('|'), 'gm')

  let result = ''
  let lastIndex = 0
  let match = combined.exec(text)

  while (match !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index))

    const groupIndex = match.slice(1).findIndex(g => g !== undefined)
    const type = patternDefs[groupIndex].type

    result += `<span class="token-${type}">${escapeHtml(match[0])}</span>`
    lastIndex = combined.lastIndex

    if (match.index === combined.lastIndex) {
      combined.lastIndex += 1
    }
    match = combined.exec(text)
  }

  result += escapeHtml(text.slice(lastIndex))
  return result
}

export default { highlightCode }
