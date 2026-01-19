import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [voucherInput, setVoucherInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) navigate('/')
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    setProfile(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleRedeem = async () => {
    if (!voucherInput) return
    setLoading(true)

    // Call the SQL function we just created
    const { data, error } = await supabase.rpc('redeem_voucher', { 
      code_input: voucherInput 
    })

    if (data === 'Success') {
      alert('Congratulations! You are now a Premium User.')
      setVoucherInput('')
      fetchProfile() // Refresh to show Premium status
    } else {
      alert('Error: ' + (data || error?.message))
    }
    setLoading(false)
  }

  if (!profile) return <div className="p-8">Loading Profile...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with Logout */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome, {profile.first_name}</h1>
            <p className="text-gray-600">
              Status: <span className={`font-bold ${profile.is_premium ? 'text-green-600' : 'text-gray-500'}`}>
                {profile.is_premium ? 'PREMIUM MEMBER 🌟' : 'Free Account'}
              </span>
            </p>
          </div>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Logout
          </button>
        </div>

        {/* Premium Upgrade Section (Only visible if NOT premium) */}
        {!profile.is_premium && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-yellow-800">Unlock Premium Access</h3>
              <p className="text-sm text-yellow-700">Get 100 questions per exam instead of 20.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input 
                placeholder="Enter Voucher Code" 
                className="p-2 border rounded w-full md:w-64"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
              />
              <button 
                onClick={handleRedeem}
                disabled={loading}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 font-bold whitespace-nowrap"
              >
                {loading ? 'Checking...' : 'Upgrade'}
              </button>
            </div>
          </div>
        )}
        
        {/* Exam Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Select a Nursing Practice Area</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['NP1', 'NP2', 'NP3', 'NP4', 'NP5'].map((np) => (
              <button 
                key={np} 
                onClick={() => navigate(`/exam/${np}`)}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md
                  ${profile.is_premium ? 'border-green-100 hover:bg-green-50' : 'border-blue-100 hover:bg-blue-50'}
                `}
              >
                <div className="flex justify-between items-center">
                  <span className={`font-bold block ${profile.is_premium ? 'text-green-700' : 'text-blue-600'}`}>
                    {np}
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">
                    {profile.is_premium ? '100 Items' : '20 Items'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">Start Review Exam</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}