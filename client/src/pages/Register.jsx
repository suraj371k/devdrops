import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { useRegisterMutation } from '../store/api'
import { setCredentials } from '../store/slices/authSlice'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { validators } from '../utils/validators'

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()

  const strength = validators.getPasswordStrength(form.password)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {
      username: validators.username(form.username),
      email: validators.email(form.email),
      password: validators.password(form.password),
      confirmPassword: validators.confirmPassword(form.confirmPassword, form.password),
    }
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors)
      return
    }

    try {
      const result = await register({
        username: form.username,
        email: form.email,
        password: form.password,
      }).unwrap()
      dispatch(setCredentials({ user: result.user, token: result.token, rememberMe: true }))
      toast.success('Account created!')
      navigate('/')
    } catch (err) {
      toast.error(err?.data?.message || 'Registration failed. Try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🧠 DevDrops</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Create your account</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="devuser"
            />
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
            />
            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="••••••••"
              />
              {form.password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{ width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{strength.label}</span>
                </div>
              )}
            </div>
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="••••••••"
            />
            <Button type="submit" fullWidth loading={isLoading}>
              Create Account
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
