export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO() {
  return toISODate(new Date())
}

export function dateDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toISODate(date)
}

export function dateMonthsAgo(months) {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return toISODate(date)
}

export function formatDate(value) {
  if (!value) return '—'
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export const AVATAR_TONES = [
  'avatar-blue',
  'avatar-teal',
  'avatar-violet',
  'avatar-amber',
  'avatar-rose',
  'avatar-cyan',
]

export function avatarTone(seed = '') {
  const total = String(seed)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return AVATAR_TONES[total % AVATAR_TONES.length]
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function percent(value, total) {
  if (!total) return 0
  return Math.round((value / total) * 100)
}
