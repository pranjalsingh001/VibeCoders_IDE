// LoginPage.tsx
// -------------------------------
// Provides user login form (email & password)
// Calls authStore.login() to authenticate and redirect

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  // Local state for form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password) // Call auth store login
      navigate('/dashboard', { replace: true }) // Redirect on success
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">Sign In</h1>
        <p className="text-sm text-gray-600 mb-6">Access your VibeCoders IDE account</p>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Error message */}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Submit button */}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          No account?{' '}
          <Link to="/signup" className="text-primary-600 hover:underline">
            Create one
          </Link>
        </p>
      </Card>
    </div>
  )
}

export default LoginPage
