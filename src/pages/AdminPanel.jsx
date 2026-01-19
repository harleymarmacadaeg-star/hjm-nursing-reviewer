import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AdminPanel() {
  const [qData, setQData] = useState({
    category: 'NP1', question_text: '', choice_a: '', choice_b: '', choice_c: '', choice_d: '', correct_answer: 'A', explanation: ''
  })
  const [voucherCode, setVoucherCode] = useState('')
  const [loading, setLoading] = useState(false)

  // 1. Function to Add a Question
  const handleAddQuestion = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.from('questions').insert([qData])
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Question Added Successfully!')
      // Reset form
      setQData({ ...qData, question_text: '', choice_a: '', choice_b: '', choice_c: '', choice_d: '', explanation: '' })
    }
    setLoading(false)
  }

  // 2. Function to Generate a Voucher
  const generateVoucher = async () => {
    // Generates a random code like "HJM-8821"
    const code = 'HJM-' + Math.floor(1000 + Math.random() * 9000)
    
    const { error } = await supabase.from('vouchers').insert([{ code }])
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setVoucherCode(code)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-900">Admin Command Center</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        
        {/* LEFT CARD: Add Question Form */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Add New Question</h2>
          <form onSubmit={handleAddQuestion} className="space-y-3">
            <select 
              className="w-full p-2 border rounded"
              value={qData.category}
              onChange={e => setQData({...qData, category: e.target.value})}
            >
              <option value="NP1">NP1 - Fundamentals</option>
              <option value="NP2">NP2 - Maternal/Child</option>
              <option value="NP3">NP3 - Med/Surg</option>
              <option value="NP4">NP4 - Psych</option>
              <option value="NP5">NP5 - Leadership/Res</option>
            </select>
            
            <textarea 
              placeholder="Question Text" 
              className="w-full p-2 border rounded h-24"
              value={qData.question_text}
              onChange={e => setQData({...qData, question_text: e.target.value})}
              required
            />
            
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Choice A" className="p-2 border rounded" value={qData.choice_a} onChange={e => setQData({...qData, choice_a: e.target.value})} required />
              <input placeholder="Choice B" className="p-2 border rounded" value={qData.choice_b} onChange={e => setQData({...qData, choice_b: e.target.value})} required />
              <input placeholder="Choice C" className="p-2 border rounded" value={qData.choice_c} onChange={e => setQData({...qData, choice_c: e.target.value})} required />
              <input placeholder="Choice D" className="p-2 border rounded" value={qData.choice_d} onChange={e => setQData({...qData, choice_d: e.target.value})} required />
            </div>

            <div className="flex items-center gap-4">
              <label className="font-bold">Correct Answer:</label>
              <select 
                className="p-2 border rounded"
                value={qData.correct_answer}
                onChange={e => setQData({...qData, correct_answer: e.target.value})}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </div>

            <textarea 
              placeholder="Explanation (Why is this correct?)" 
              className="w-full p-2 border rounded h-20"
              value={qData.explanation}
              onChange={e => setQData({...qData, explanation: e.target.value})}
              required
            />

            <button disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 font-bold">
              {loading ? 'Saving...' : 'Save Question'}
            </button>
          </form>
        </div>

        {/* RIGHT CARD: Voucher Manager */}
        <div className="bg-white p-6 rounded shadow h-fit">
          <h2 className="text-xl font-bold mb-4">Generate Premium Voucher</h2>
          <p className="text-gray-600 mb-4">Click to create a unique code. Give this code to a student to unlock 100 questions.</p>
          
          <button onClick={generateVoucher} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-bold w-full">
            Generate New Code
          </button>

          {voucherCode && (
            <div className="mt-6 p-4 bg-yellow-100 border-2 border-yellow-400 text-center rounded">
              <p className="text-sm text-gray-700">Generated Code:</p>
              <p className="text-3xl font-mono font-bold tracking-widest text-black">{voucherCode}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}