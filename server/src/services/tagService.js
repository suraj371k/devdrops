const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me', 'him', 'us', 'them',
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'now', 'then', 'here', 'there', 'also', 'back', 'even', 'still',
  'get', 'got', 'go', 'going', 'goes', 'came', 'come', 'comes', 'make', 'made',
  'makes', 'let', 'lets', 'put', 'puts', 'take', 'took', 'takes', 'see', 'saw',
  'seen', 'sees', 'know', 'knew', 'known', 'knows', 'think', 'thought', 'thinks',
  'use', 'used', 'using', 'find', 'found', 'finds', 'give', 'gave', 'given', 'gives',
  'tell', 'told', 'tells', 'ask', 'asked', 'asks', 'work', 'worked', 'works',
  'call', 'called', 'calls', 'try', 'tried', 'tries', 'need', 'needed', 'needs',
  'want', 'wanted', 'wants', 'mean', 'meant', 'means', 'help', 'helped', 'helps',
  'like', 'liked', 'likes', 'look', 'looked', 'looks', 'come', 'came', 'comes',
])

const CODE_KEYWORDS = new Set([
  'function', 'class', 'const', 'let', 'var', 'return', 'import', 'export',
  'async', 'await', 'if', 'else', 'for', 'while', 'switch', 'case', 'try', 'catch',
  'def', 'import', 'from', 'class', 'self', 'elif', 'pass', 'lambda', 'yield',
  'public', 'private', 'protected', 'static', 'void', 'interface', 'extends',
  'func', 'package', 'struct', 'enum', 'impl', 'trait', 'match', 'mod',
  'fn', 'let', 'mut', 'use', 'type', 'as', 'where', 'async', 'await',
])

const COMMAND_KEYWORDS = new Set([
  'sudo', 'apt', 'npm', 'yarn', 'pip', 'docker', 'git', 'kubectl', 'terraform',
  'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'find', 'chmod', 'chown',
  'vim', 'nano', 'code', 'brew', 'cargo', 'go', 'make', 'cmake',
])

function extractTags(content, type) {
  if (!content) return []

  const words = content.toLowerCase()
    .replace(/[^\w\s\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && w.length < 20)

  const wordFreq = {}
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue
    wordFreq[word] = (wordFreq[word] || 0) + 1
  }

  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)

  const tags = []
  for (const word of sortedWords) {
    if (tags.length >= 5) break
    tags.push(word)
  }

  if (type === 'code' || type === 'command') {
    const keywords = type === 'code' ? CODE_KEYWORDS : COMMAND_KEYWORDS
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword) && !tags.includes(keyword) && tags.length < 5) {
        tags.push(keyword)
      }
    }
  }

  return tags.slice(0, 5)
}

function extractKeywords(text, maxKeywords = 10) {
  if (!text) return []

  const words = text.toLowerCase()
    .replace(/[^\w\s\-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && w.length < 25 && !STOP_WORDS.has(w))

  const wordFreq = {}
  for (const word of words) {
    wordFreq[word] = (wordFreq[word] || 0) + 1
  }

  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

export default {
  extractTags,
  extractKeywords,
  STOP_WORDS,
}