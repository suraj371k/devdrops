export const validators = {
  email: (value) => {
    if (!value) return 'Email is required'
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(value)) return 'Invalid email format'
    return null
  },

  username: (value) => {
    if (!value) return 'Username is required'
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 30) return 'Username must be 30 characters or less'
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores'
    return null
  },

  password: (value) => {
    if (!value) return 'Password is required'
    if (value.length < 6) return 'Password must be at least 6 characters'
    if (value.length > 128) return 'Password must be 128 characters or less'
    return null
  },

  confirmPassword: (value, password) => {
    if (!value) return 'Please confirm your password'
    if (value !== password) return 'Passwords do not match'
    return null
  },

  title: (value) => {
    if (!value || !value.trim()) return 'Title is required'
    if (value.length > 100) return 'Title must be 100 characters or less'
    return null
  },

  content: (value) => {
    if (!value || !value.trim()) return 'Content is required'
    return null
  },

  collectionName: (value) => {
    if (!value || !value.trim()) return 'Collection name is required'
    if (value.length > 50) return 'Collection name must be 50 characters or less'
    return null
  },

  description: (value) => {
    if (value && value.length > 200) return 'Description must be 200 characters or less'
    return null
  },

  color: (value) => {
    if (value && !/^#[0-9A-Fa-f]{6}$/.test(value)) return 'Invalid color format (use #RRGGBB)'
    return null
  },

  getPasswordStrength: (password) => {
    if (!password) return { score: 0, label: '', color: '' }
    
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e']

    return {
      score: Math.min(score, 5),
      label: labels[Math.min(score, 4)],
      color: colors[Math.min(score, 4)],
    }
  },
}