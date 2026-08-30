import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import toast from 'react-hot-toast'
import { useLoginMutation } from '../store/api'
import { setCredentials } from '../store/slices/authSlice'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { validators } from '../utils/validators'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [errors, setErrors] = useState({})
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const emailError = validators.email(form.email)
    const passwordError = form.password ? null : 'Password is required'
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError })
      return
    }

    try {
      const result = await login({ email: form.email, password: form.password }).unwrap()
      dispatch(setCredentials({
        user: result.user,
        token: result.token,
        rememberMe: form.rememberMe,
      }))
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err?.data?.message || 'Login failed. Check your credentials.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🧠 DevDrops</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Sign in to your account</p>
        </div>

        <Card padding="lg">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
                className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              Remember me
            </label>
            <Button type="submit" fullWidth loading={isLoading}>
              Sign In
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
