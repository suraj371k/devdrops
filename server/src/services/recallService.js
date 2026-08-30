const FIBONACCI_CACHE = [1, 1]

function fibonacci(n) {
  if (n <= 0) return 1
  if (n < FIBONACCI_CACHE.length) return FIBONACCI_CACHE[n]

  for (let i = FIBONACCI_CACHE.length; i <= n; i++) {
    FIBONACCI_CACHE[i] = FIBONACCI_CACHE[i - 1] + FIBONACCI_CACHE[i - 2]
  }
  return FIBONACCI_CACHE[n]
}

function calculateNextRecallDate(baseDate, recallCount) {
  const fibIndex = recallCount
  const hours = fibonacci(fibIndex)
  const nextDate = new Date(baseDate)
  nextDate.setHours(nextDate.getHours() + hours)
  return nextDate
}

function detectType(content) {
  if (!content) return 'note'

  const codePatterns = [
    /```[\s\S]*```/,
    /`[^`]+`/,
    /\b(function|class|const|let|var|import|export|return|if|else|for|while|switch|case|try|catch|finally|async|await|=>)\b/,
    /\b(def|class|import|from|return|if|elif|else|for|while|try|except|finally|async|await|lambda)\b/,
    /\b(public|private|protected|static|void|int|string|bool|class|interface|enum)\b/,
  ]

  for (const pattern of codePatterns) {
    if (pattern.test(content)) return 'code'
  }

  const commandPatterns = [
    /^[\$#>]\s/m,
    /\b(sudo|apt|yum|dnf|pacman|brew|npm|yarn|pnpm|pip|pip3|composer|gem|cargo|go|docker|kubectl|terraform|ansible)\b/,
    /\b(git|cd|ls|mkdir|rm|cp|mv|cat|grep|find|chmod|chown|ps|kill|top|htop|vim|nano|code)\b/,
  ]

  for (const pattern of commandPatterns) {
    if (pattern.test(content)) return 'command'
  }

  if (/https?:\/\//.test(content)) return 'link'

  return 'note'
}

function getLanguageFromContent(content, type) {
  if (type !== 'code') return null

  const languagePatterns = {
    javascript: /\b(const|let|var|function|=>|console\.log|import|export|async|await)\b/,
    typescript: /\b(interface|type|enum|namespace|readonly|as const)\b/,
    python: /\b(def|import|from|class|self|elif|pass|lambda|yield)\b/,
    java: /\b(public|private|protected|static|void|class|interface|extends|implements)\b/,
    go: /\b(func|package|import|var|const|go|defer|chan|select)\b/,
    rust: /\b(fn|let|mut|struct|enum|impl|trait|match|use|mod)\b/,
    cpp: /\b(#include|std::|class|namespace|template|vector|map|string)\b/,
    c: /\b(#include|int main|printf|scanf|malloc|free|struct)\b/,
    html: /<[^>]+>/,
    css: /\b(color|margin|padding|display|flex|grid|@media)\b/,
    sql: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|TABLE)\b/i,
    bash: /\b(echo|cd|ls|grep|awk|sed|cat|chmod|sudo|apt|yum)\b/,
  }

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(content)) return lang
  }

  return null
}

function getRecallIntervals(recallCount) {
  const intervals = []
  for (let i = 0; i <= recallCount + 1; i++) {
    intervals.push(fibonacci(i))
  }
  return intervals
}

export default {
  fibonacci,
  calculateNextRecallDate,
  detectType,
  getLanguageFromContent,
  getRecallIntervals,
}
