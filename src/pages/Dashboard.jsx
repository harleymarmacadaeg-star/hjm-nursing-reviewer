import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [examHistory, setExamHistory] = useState([]) // New State for History
  const [voucherInput, setVoucherInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchHistory() // Fetch history on load
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/')
      return
    }
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      
    setProfile(data)
  }

  const fetchHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!error) setExamHistory(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  const handleRedeem = async () => {
    if (!voucherInput) return
    setLoading(true)

    const { data, error } = await supabase.rpc('redeem_voucher', { 
      code_input: voucherInput 
    })

    if (data === 'Success') {
      alert('Congratulations! You are now a Premium User.')
      setVoucherInput('')
      fetchProfile()
    } else {
      alert('Error: ' + (data || error?.message))
    }
    setLoading(false)
  }

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900">Mabuhay, {profile.first_name}!</h1>
            <p className="text-gray-600">Prepare for greatness today.</p>
          </div>
          <button onClick={handleLogout} className="bg-white border-2 border-red-100 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-50 transition-all">
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 rounded-2xl shadow-lg text-white flex justify-between items-center relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">Study Streak</p>
              <h2 className="text-4xl font-black">{profile.streak_count || 0} Days</h2>
              <p className="text-sm opacity-90 mt-2 font-medium">Keep the flame alive!</p>
            </div>
            <div className="text-6xl filter drop-shadow-md">🔥</div>
          </div>

          <div className={`p-6 rounded-2xl shadow-lg border-2 flex justify-between items-center bg-white ${profile.is_premium ? 'border-green-200' : 'border-blue-100'}`}>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Account Status</p>
              <h2 className={`text-2xl font-black ${profile.is_premium ? 'text-green-600' : 'text-blue-900'}`}>
                {profile.is_premium ? 'PREMIUM ACCESS 🌟' : 'BASIC ACCOUNT'}
              </h2>
            </div>
            <div className="text-4xl">{profile.is_premium ? '✅' : '🎓'}</div>
          </div>
        </div>

        {/* Exam Selection */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Nursing Practice Areas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['NP1', 'NP2', 'NP3', 'NP4', 'NP5'].map((np) => (
              <button 
                key={np} 
                onClick={() => navigate(`/exam/${np}`)}
                className="group p-5 border-2 rounded-2xl text-left transition-all hover:translate-y-[-4px] border-blue-50 border-l-blue-500 bg-white hover:shadow-xl"
              >
                <span className="text-2xl font-black text-gray-800">{np}</span>
                <div className="text-blue-600 font-bold text-sm">Start Simulation →</div>
              </button>
            ))}
          </div>
        </div>

        {/* --- NEW HISTORY SECTION --- */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">Recent Performance</h2>
          </div>

          {examHistory.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 font-bold">Category</th>
                    <th className="px-6 py-4 font-bold">Score</th>
                    <th className="px-6 py-4 font-bold">Percentage</th>
                    <th className="px-6 py-4 font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {examHistory.map((result) => (
                    <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-900">{result.category}</td>
                      <td className="px-6 py-4 text-gray-700">{result.score} / {result.total_items}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${ (result.score/result.total_items) >= 0.75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' }`}>
                          {((result.score / result.total_items) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {new Date(result.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
              <p className="text-gray-400">No exams taken yet. Start your first review above!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}