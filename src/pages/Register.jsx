import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Register() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', username: '', email: '', password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Check if username exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', formData.username)
      .single()

    if (existingUser) {
      setError('Username is already taken. Please choose another.')
      setLoading(false)
      return
    }

    // 2. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 3. Create Profile Record
    if (authData.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: authData.user.id,
          username: formData.username,
          first_name: formData.firstName,
          middle_name: formData.middleName,
          last_name: formData.lastName,
          email: formData.email, // Save email here too for display
          is_premium: false
        }
      ])

      if (profileError) {
        setError('Account created but profile failed: ' + profileError.message)
      } else {
        alert('Registration Successful! Please Login.')
        navigate('/')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-10">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-900">Create Account</h2>
        
        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <input name="firstName" placeholder="First Name" required onChange={handleChange} className="p-2 border rounded" />
             <input name="lastName" placeholder="Last Name" required onChange={handleChange} className="p-2 border rounded" />
          </div>
          <input name="middleName" placeholder="Middle Name (Optional)" onChange={handleChange} className="w-full p-2 border rounded" />
          
          <div className="border-t pt-4">
            <label className="block text-sm font-bold text-gray-700 mb-1">Username (Must be unique)</label>
            <input name="username" placeholder="jdelacruz123" required onChange={handleChange} className="w-full p-2 border rounded" />
          </div>

          <input name="email" type="email" placeholder="Email Address" required onChange={handleChange} className="w-full p-2 border rounded" />
          <input name="password" type="password" placeholder="Password" required onChange={handleChange} className="w-full p-2 border rounded" />

          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700 font-bold">
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account? <Link to="/" className="text-blue-600 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  )
}