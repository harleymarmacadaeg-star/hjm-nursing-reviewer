import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion' // <--- Added AnimatePresence
import { Trophy, Mail, Facebook, ArrowRight, Linkedin } from 'lucide-react'

// --- IMAGES ---
import appIcon from '../img/appicon.jpg' 
import img1 from '../img/img1.jpg'
import img2 from '../img/img2.jpg'
import img3 from '../img/img3.jpg'

const SLIDES = [img1, img2, img3] // Array for the slideshow

export default function Welcome() {
  const [topScorers, setTopScorers] = useState([])
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  
  // Slideshow State
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    fetchLeaderboard()
    
    // Timer for Slideshow (Changes every 4 seconds)
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [])

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('leaderboard').select('*')
    if (data) setTopScorers(data)
  }

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    const { error } = await supabase.from('contact_messages').insert([contactForm])
    if (error) alert('Error sending message.')
    else {
      alert('Message sent!')
      setContactForm({ name: '', email: '', message: '' })
    }
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* 1. COMPACT NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={appIcon} alt="Logo" className="w-8 h-8 rounded shadow-sm" />
            <span className="text-lg font-bold text-blue-900 tracking-tight">HJM Reviewer</span>
          </div>
          <div className="flex gap-4 items-center">
            <a href="#contact" className="hidden md:block text-sm font-medium text-gray-600 hover:text-blue-600">Contact</a>
            <Link to="/login" className="text-sm font-bold bg-blue-50 text-blue-600 px-4 py-2 rounded-full hover:bg-blue-100 transition">Login</Link>
          </div>
        </div>
      </nav>

      {/* 2. SPLIT HERO SECTION */}
      <header className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden pb-12">
        <div className="max-w-7xl mx-auto px-4 pt-12 md:pt-20 flex flex-col lg:flex-row gap-12 relative z-10">
          
          {/* LEFT: Main Text */}
          <div className="flex-1 text-center lg:text-left pt-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <span className="inline-block py-1 px-3 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-100 text-xs font-bold mb-4 uppercase tracking-wider">
                #1 NLE Reviewer
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                Master the <span className="text-yellow-400">Nursing Boards</span>
              </h1>
              <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto lg:mx-0">
                Join elite students. Practice with 500+ dynamic questions across all 5 Nursing Practice areas.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link to="/register" className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-full font-bold hover:bg-yellow-300 transition shadow-lg flex items-center justify-center gap-2">
                  Start Reviewing <ArrowRight size={18} />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Immediate Hall of Fame */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.4 }}
            className="w-full lg:w-96 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
              <Trophy className="text-yellow-400 w-5 h-5" />
              <h2 className="font-bold text-lg">Top 5 Scorers</h2>
            </div>
            
            <div className="space-y-3">
              {topScorers.length === 0 ? (
                <p className="text-sm text-blue-200 text-center py-4">No records yet. Be the first!</p>
              ) : (
                topScorers.map((scorer, index) => (
                  <div key={index} className="flex items-center justify-between bg-black/20 p-2 rounded hover:bg-black/30 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-400 text-blue-900' : 'bg-blue-800 text-white'}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium truncate w-32">{scorer.first_name} {scorer.last_name}</span>
                    </div>
                    <span className="text-sm font-bold text-yellow-400">{scorer.total_score} pts</span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </header>

      {/* 3. ANIMATED SLIDESHOW SECTION (Updated) */}
      <section className="bg-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative w-full h-80 md:h-96 bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-white">
            
            {/* The AnimatePresence allows components to animate OUT when they are removed */}
            <AnimatePresence mode='wait'>
              <motion.img 
                key={currentSlide} // Key changes force React to treat this as a new image, triggering animation
                src={SLIDES[currentSlide]} 
                
                // Animation Settings
                initial={{ opacity: 0, scale: 1.1 }} // Start slightly zoomed in and invisible
                animate={{ opacity: 1, scale: 1 }}   // Fade in and zoom to normal
                exit={{ opacity: 0 }}                // Fade out when leaving
                transition={{ duration: 0.8 }}       // Speed of animation
                
                alt="Reviewer Highlights" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            {/* Optional: Text Overlay on the Slideshow */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
              <h3 className="text-2xl font-bold">Comprehensive Review Materials</h3>
              <p className="text-sm opacity-90">Study anytime, anywhere with our mobile-friendly platform.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CONTACT SECTION */}
      <section id="contact" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600 mb-6">Need a Premium Voucher? Contact me.</p>
            <div className="space-y-4">
              <a href="https://mail.google.com/mail/?view=cm&fs=1&to=harleymarmacadaeg@gmail.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition border border-gray-100">
                <div className="bg-red-100 p-2 rounded"><Mail className="text-red-600 w-5 h-5" /></div>
                <span className="font-medium text-gray-700">Send Email</span>
              </a>
              <a href="https://www.messenger.com/t/harleymar.macadaeg" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition border border-gray-100">
                <div className="bg-blue-100 p-2 rounded"><Facebook className="text-blue-600 w-5 h-5" /></div>
                <span className="font-medium text-gray-700">Chat on Messenger</span>
              </a>
              <a href="https://www.linkedin.com/in/harleymar-macadaeg-lpt-9a4340129/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition border border-gray-100">
                <div className="bg-blue-800 p-2 rounded"><Linkedin className="text-white w-5 h-5" /></div>
                <span className="font-medium text-gray-700">LinkedIn Profile</span>
              </a>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="font-bold text-lg mb-4">Quick Message</h3>
            <form onSubmit={handleContactSubmit} className="space-y-3">
              <input required className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} placeholder="Name" />
              <input required type="email" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} placeholder="Email" />
              <textarea required rows="3" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})} placeholder="Message..." />
              <button disabled={sending} className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>

        </div>
      </section>

      <footer className="bg-gray-900 text-gray-500 py-6 text-center text-sm border-t border-gray-800">
        © 2026 HJM Reviewer. Built with React & Supabase.
      </footer>
    </div>
  )
}