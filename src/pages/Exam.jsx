import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Exam() {
  const { category } = useParams() // Gets "NP1", "NP2" from the URL
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  
  // Interaction State
  const [selectedAnswer, setSelectedAnswer] = useState(null) // 'A', 'B', 'C', 'D'
  const [isAnswered, setIsAnswered] = useState(false) // Has user clicked "Final Answer"?

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    // 1. Check if user is premium
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
    
    const limit = profile?.is_premium ? 100 : 20

    // 2. Call the Randomizer Function we just created
    const { data, error } = await supabase.rpc('get_random_questions', { 
      exam_category: category, 
      question_limit: limit 
    })

    if (error) alert('Error fetching questions: ' + error.message)
    else if (data.length === 0) alert('No questions found for this category yet! Ask Admin to add some.')
    else setQuestions(data)
    
    setLoading(false)
  }

  const handleFinalAnswer = () => {
    setIsAnswered(true)
    const currentQ = questions[currentIndex]
    if (selectedAnswer === currentQ.correct_answer) {
      setScore(score + 1)
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1)
      setSelectedAnswer(null)
      setIsAnswered(false)
    } else {
      setFinished(true)
      saveResult()
    }
  }

  const saveResult = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('exam_results').insert([
      { user_id: user.id, category: category, score: score, total_items: questions.length }
    ])
  }

  if (loading) return <div className="p-10 text-center">Loading Exam...</div>

  if (finished) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded shadow-lg text-center max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4">Exam Complete!</h1>
        <div className="text-6xl font-bold text-blue-600 mb-4">{score} / {questions.length}</div>
        <p className="text-xl mb-6">{(score/questions.length * 100).toFixed(0)}% Score</p>
        <button onClick={() => navigate('/dashboard')} className="bg-gray-800 text-white px-6 py-3 rounded hover:bg-black">
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  const q = questions[currentIndex]

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
          <span className="font-bold text-lg">{category} Exam</span>
          <span>Question {currentIndex + 1} of {questions.length}</span>
        </div>

        {/* Question Body */}
        <div className="p-6">
          <p className="text-lg font-medium mb-6 text-gray-800">{q.question_text}</p>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option) => (
              <button
                key={option}
                onClick={() => !isAnswered && setSelectedAnswer(option)}
                className={`w-full text-left p-4 rounded border-2 transition-all
                  ${selectedAnswer === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
                  ${isAnswered && option === q.correct_answer ? 'bg-green-100 border-green-500' : ''}
                  ${isAnswered && selectedAnswer === option && option !== q.correct_answer ? 'bg-red-100 border-red-500' : ''}
                `}
              >
                <span className="font-bold mr-2">{option}.</span> 
                {option === 'A' ? q.choice_a : option === 'B' ? q.choice_b : option === 'C' ? q.choice_c : q.choice_d}
              </button>
            ))}
          </div>

          {/* Explanation Section (Only shows after answering) */}
          {isAnswered && (
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-gray-700">
              <p className="font-bold mb-1">Explanation:</p>
              <p>{q.explanation}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          {!isAnswered ? (
            <button 
              onClick={handleFinalAnswer} 
              disabled={!selectedAnswer}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              Final Answer
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
            >
              {currentIndex + 1 === questions.length ? 'Finish Exam' : 'Next Question'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}