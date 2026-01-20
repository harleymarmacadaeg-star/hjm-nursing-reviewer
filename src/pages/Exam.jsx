import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Exam() {
  const { category } = useParams()
  const navigate = useNavigate()
  
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [userAnswers, setUserAnswers] = useState([]) 
  
  // Track scores by TOS Topic
  const [topicScores, setTopicScores] = useState({})
  
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [streakMilestone, setStreakMilestone] = useState(null)
  
  const hasFetched = useRef(false);
  const hasResumed = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchQuestions();
      hasFetched.current = true;
    }
  }, []);

  useEffect(() => {
    if (!isTimerRunning || finished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, finished]);

  useEffect(() => {
    if (questions.length > 0 && !hasResumed.current) {
      checkResumeProgress();
      hasResumed.current = true;
    }
  }, [questions]);

  useEffect(() => {
    if (questions.length > 0 && !finished && isTimerRunning) {
      saveProgress()
    }
  }, [currentIndex, score, timeLeft])

  const fetchQuestions = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single()
    const isPremium = profile?.is_premium;
    const limit = isPremium ? 100 : 20
    const { data: qData, error: qError } = await supabase.rpc('get_random_questions', { 
      exam_category: category, 
      question_limit: limit 
    })
    if (qError) console.error(qError)
    else {
        setQuestions(qData)
        const initialTime = isPremium ? 7200 : (20 * 72); 
        setTimeLeft(initialTime)
        setIsTimerRunning(true)
    }
    setLoading(false)
  }

  const checkResumeProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: progress } = await supabase.from('user_progress').select('*').eq('user_id', user.id).eq('module_id', category).maybeSingle()
    if (progress) {
      setTimeout(() => {
        const resume = window.confirm("Resume your session?")
        if (resume) {
          setCurrentIndex(progress.current_question_index || 0)
          setScore(progress.score || 0)
          setUserAnswers(progress.answers || [])
          setTimeLeft(progress.time_left) 
        }
      }, 100);
    }
  }

  const saveProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('user_progress').upsert({
      user_id: user.id,
      module_id: category,
      current_question_index: currentIndex,
      score: score,
      answers: userAnswers,
      time_left: timeLeft,
      updated_at: new Date()
    }, { onConflict: 'user_id, module_id' })
  }

  const handleAutoSubmit = () => {
    finalizeExam();
  }

  const updateStreak = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('streak_count, last_streak_date').eq('id', user.id).single();
    const today = new Date().toISOString().split('T')[0];
    const lastDate = profile.last_streak_date;
    let newStreak = 1;
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (lastDate === yesterdayStr) newStreak = (profile.streak_count || 0) + 1;
      else if (lastDate === today) newStreak = profile.streak_count || 1;
    }
    await supabase.from('profiles').update({ streak_count: newStreak, last_streak_date: today }).eq('id', user.id);
    if ([7, 30, 100].includes(newStreak)) setStreakMilestone(newStreak);
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleFinalAnswer = () => {
    setIsAnswered(true)
    const currentQ = questions[currentIndex]
    const topic = currentQ.topic || "General Nursing"; 
    
    const isCorrect = selectedAnswer === currentQ.correct_answer;
    
    setTopicScores(prev => ({
      ...prev,
      [topic]: {
        correct: (prev[topic]?.correct || 0) + (isCorrect ? 1 : 0),
        total: (prev[topic]?.total || 0) + 1
      }
    }));

    const existingAnswerIdx = userAnswers.findIndex(a => a.question_id === currentQ.id);
    let newAnswers = [...userAnswers];
    
    if (existingAnswerIdx > -1) {
        newAnswers[existingAnswerIdx] = { question_id: currentQ.id, choice: selectedAnswer };
    } else {
        newAnswers.push({ question_id: currentQ.id, choice: selectedAnswer });
        if (isCorrect) setScore(prev => prev + 1);
    }
    setUserAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      jumpToQuestion(currentIndex + 1);
    } else {
      setShowReviewModal(true);
    }
  }

  const jumpToQuestion = (index) => {
    setCurrentIndex(index);
    const targetQ = questions[index];
    const previousAnswer = userAnswers.find(a => a.question_id === targetQ.id);
    
    if (previousAnswer) {
        setSelectedAnswer(previousAnswer.choice);
        setIsAnswered(true);
    } else {
        setSelectedAnswer(null);
        setIsAnswered(false);
    }
    setShowReviewModal(false);
  }

  const finalizeExam = async () => {
    setFinished(true);
    await updateStreak();
    saveResult();
    clearProgress();
  }

  const clearProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('user_progress').delete().eq('user_id', user.id).eq('module_id', category)
  }

  const saveResult = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('exam_results').insert([{ user_id: user.id, category: category, score: score, total_items: questions.length }])
  }

  if (loading) return <div className="p-10 text-center">Loading Exam...</div>

  if (finished) return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-2xl w-full animate-in fade-in zoom-in duration-500">
        
        {/* MILESTONE POPUP (STREAKS) */}
        {streakMilestone && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center animate-bounce">
              <div className="text-6xl mb-4">🔥</div>
              <h2 className="text-2xl font-bold text-orange-600 uppercase">Streak Milestone!</h2>
              <p className="text-gray-600 mb-6">You've studied for {streakMilestone} days in a row!</p>
              <button onClick={() => setStreakMilestone(null)} className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold">Awesome!</button>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-black text-blue-900 mb-2 tracking-tight">Performance Summary</h1>
        <div className="text-7xl font-black text-blue-600 mb-6 drop-shadow-sm">{score} / {questions.length}</div>
        
        {/* CLINICAL READINESS GAUGE (SUBJECT 4 ONLY) */}
        {topicScores["Medical-Surgical Nursing"] && (
          <div className="mb-8 p-6 bg-blue-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="relative z-10 text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-300 mb-4 flex items-center gap-2">
                🩺 Subject 4: Clinical Readiness Gauge
              </h3>
              <div className="flex items-end gap-4 mb-2">
                <span className="text-5xl font-black">
                  {Math.round((topicScores["Medical-Surgical Nursing"].correct / topicScores["Medical-Surgical Nursing"].total) * 100)}%
                </span>
                <span className="text-blue-300 text-sm font-bold mb-1 uppercase tracking-tighter">
                   Ready for Hospital Rotation
                </span>
              </div>
              <div className="w-full bg-blue-800 h-4 rounded-full border border-blue-700 overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 via-green-400 to-green-500 transition-all duration-1000 ease-out"
                  style={{ width: `${(topicScores["Medical-Surgical Nursing"].correct / topicScores["Medical-Surgical Nursing"].total) * 100}%` }}
                ></div>
              </div>
              <p className="mt-4 text-[10px] text-blue-200 leading-tight italic opacity-70">
                *TOS Weight: Cardiovascular, Respiratory, Perioperative, and Critical Care competencies.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-9xl opacity-10 rotate-12">🩺</div>
          </div>
        )}

        {/* TOPIC BREAKDOWN SECTION */}
        <div className="mb-8 text-left bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h3 className="font-bold text-gray-500 mb-4 uppercase text-[10px] tracking-widest border-b pb-2">Full TOS Breakdown (2025 PNLE)</h3>
          <div className="space-y-5">
            {Object.entries(topicScores).map(([topic, data]) => {
              const percent = Math.round((data.correct / data.total) * 100);
              return (
                <div key={topic}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold text-gray-700">{topic}</span>
                    <span className={`font-black ${percent >= 75 ? 'text-green-600' : 'text-red-500'}`}>
                      {percent}% {percent >= 75 ? 'PASSED' : 'BELOW TARGET'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out ${percent >= 75 ? 'bg-green-500' : 'bg-red-400'}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button 
          onClick={() => navigate('/dashboard')} 
          className="w-full bg-blue-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-black transition-all shadow-lg active:scale-95"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )

  const q = questions[currentIndex];
  const unansweredIndices = questions
    .map((item, i) => (userAnswers.find(a => a.question_id === item.id) ? null : i))
    .filter(i => i !== null);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col md:flex-row gap-6 justify-center">
      {/* REVIEW SUMMARY MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b bg-blue-50">
              <h2 className="text-2xl font-bold text-blue-900">Exam Summary</h2>
              <p className="text-gray-600">Check your status before final submission.</p>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100">
                  <div className="text-3xl font-bold text-green-600">{userAnswers.length}</div>
                  <div className="text-xs text-green-700 font-bold uppercase tracking-wider">Answered</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center border border-red-100">
                  <div className="text-3xl font-bold text-red-500">{unansweredIndices.length}</div>
                  <div className="text-xs text-red-700 font-bold uppercase tracking-wider">Unanswered</div>
                </div>
              </div>
              {unansweredIndices.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Click to go back and answer:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {unansweredIndices.map(idx => (
                      <button key={idx} onClick={() => jumpToQuestion(idx)} className="w-10 h-10 bg-white border-2 border-red-200 text-red-600 rounded font-bold hover:bg-red-500 hover:text-white transition-all">{idx + 1}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t bg-gray-50 flex gap-4">
              <button onClick={() => setShowReviewModal(false)} className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg font-bold text-gray-600">Back</button>
              <button onClick={finalizeExam} className="flex-1 px-6 py-3 bg-blue-600 rounded-lg font-bold text-white shadow-md active:scale-95">Submit Exam</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDE: QUESTION CARD */}
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-fit">
        <div className="w-full bg-gray-200 h-2">
          <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(userAnswers.length / questions.length) * 100}%` }}></div>
        </div>
        <div className="bg-blue-900 text-white p-4 flex justify-between items-center">
          <div>
            <span className="font-bold text-lg block">{category} Exam</span>
            <span className="text-sm opacity-80">Item {currentIndex + 1} of {questions.length}</span>
          </div>
          <div className={`px-4 py-2 rounded-lg font-mono text-xl font-bold ${timeLeft < 300 ? 'bg-red-600 animate-pulse' : 'bg-blue-800'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="p-6">
          <p className="text-lg font-medium mb-6 text-gray-800 leading-relaxed">{q?.question_text}</p>
          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((opt) => (
              <button
                key={opt}
                onClick={() => !isAnswered && setSelectedAnswer(opt)}
                className={`w-full text-left p-4 rounded border-2 transition-all
                  ${selectedAnswer === opt ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
                  ${isAnswered && opt === q?.correct_answer ? 'bg-green-100 border-green-500' : ''}
                  ${isAnswered && selectedAnswer === opt && opt !== q?.correct_answer ? 'bg-red-100 border-red-500' : ''}
                `}
              >
                <span className="font-bold mr-2">{opt}.</span> 
                {opt === 'A' ? q?.choice_a : opt === 'B' ? q?.choice_b : opt === 'C' ? q?.choice_c : q?.choice_d}
              </button>
            ))}
          </div>
          {isAnswered && (
            <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-gray-700 italic rounded-r-lg">
              <strong>Rationale:</strong> {q?.explanation}
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-between">
          <button onClick={() => currentIndex > 0 && jumpToQuestion(currentIndex - 1)} disabled={currentIndex === 0} className="text-gray-600 font-semibold disabled:opacity-30">Previous</button>
          {!isAnswered ? (
            <button onClick={handleFinalAnswer} disabled={!selectedAnswer} className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:bg-gray-300 active:scale-95">Final Answer</button>
          ) : (
            <button onClick={handleNext} className="bg-green-600 text-white px-6 py-2 rounded-lg active:scale-95">
               {currentIndex + 1 === questions.length ? 'Review & Finish' : 'Next Question'}
            </button>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: NAVIGATION GRID */}
      <div className="w-full md:w-64 bg-white rounded-lg shadow-lg p-4 h-fit">
        <h3 className="font-bold text-gray-700 mb-4 border-b pb-2 text-center uppercase text-sm tracking-widest">Question Grid</h3>
        <div className="grid grid-cols-5 gap-2">
          {questions.map((_, idx) => {
            const isQAnswered = userAnswers.find(a => a.question_id === questions[idx].id);
            return (
              <button key={idx} onClick={() => jumpToQuestion(idx)} className={`h-10 w-10 text-xs font-bold rounded flex items-center justify-center transition-all ${currentIndex === idx ? 'ring-4 ring-blue-300 scale-110' : ''} ${isQAnswered ? 'bg-green-500 text-white shadow-sm' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                {idx + 1}
              </button>
            )
          })}
        </div>
        <button onClick={() => setShowReviewModal(true)} className="w-full mt-6 bg-blue-100 text-blue-700 py-3 rounded-lg font-bold uppercase text-xs tracking-widest shadow-sm">Review Summary</button>
      </div>
    </div>
  )
}