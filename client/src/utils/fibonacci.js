const FIBONACCI_CACHE = [1, 1]

export function fibonacci(n) {
  if (n <= 0) return 1
  if (n < FIBONACCI_CACHE.length) return FIBONACCI_CACHE[n]

  for (let i = FIBONACCI_CACHE.length; i <= n; i++) {
    FIBONACCI_CACHE[i] = FIBONACCI_CACHE[i - 1] + FIBONACCI_CACHE[i - 2]
  }
  return FIBONACCI_CACHE[n]
}

export function calculateNextRecallDate(baseDate, recallCount) {
  const hours = fibonacci(recallCount + 1)
  const date = new Date(baseDate)
  date.setHours(date.getHours() + hours)
  return date
}

export function getRecallIntervals(count) {
  const intervals = []
  for (let i = 1; i <= count + 2; i++) {
    intervals.push(fibonacci(i))
  }
  return intervals
}

export function formatInterval(hours) {
  if (hours < 24) return `${hours}h`
  if (hours < 168) return `${Math.round(hours / 24)}d`
  return `${Math.round(hours / 168)}w`
}

export function getNextIntervalLabel(recallCount) {
  const hours = fibonacci(recallCount + 2)
  return formatInterval(hours)
}