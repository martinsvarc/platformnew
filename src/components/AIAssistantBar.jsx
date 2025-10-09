import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { askAI } from '../api/aiAssistant'

function AIAssistantBar() {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showResponse, setShowResponse] = useState(false)
  const inputRef = useRef(null)
  const responseRef = useRef(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  useEffect(() => {
    if (showResponse && responseRef.current) {
      responseRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [showResponse])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const question = input.trim()
    setIsLoading(true)
    setShowResponse(false)

    try {
      const result = await askAI(user.team_id, question)
      setResponse(result.answer)
      setShowResponse(true)
    } catch (error) {
      setResponse('Sorry, I encountered an error. Please try again.')
      setShowResponse(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setInput('')
    setResponse('')
    setShowResponse(false)
    setIsExpanded(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-4xl px-4 pb-4 pointer-events-auto">
        {/* Response Card */}
        {showResponse && (
          <div 
            ref={responseRef}
            className="mb-3 unified-glass p-4 animate-slideUp max-h-[60vh] flex flex-col"
          >
            <div className="flex items-start justify-between gap-3 mb-2 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h4 className="font-semibold text-gradient-primary">AI Analysis</h4>
              </div>
              <button
                onClick={() => setShowResponse(false)}
                className="text-pearl/50 hover:text-pearl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="text-pearl text-sm whitespace-pre-wrap leading-relaxed overflow-y-auto pr-2 custom-scrollbar">
              {response}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="unified-glass overflow-hidden transition-all duration-300">
          {isExpanded ? (
            <form onSubmit={handleSubmit} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🤖</span>
                <span className="text-sm font-semibold text-pearl">Ask AI About Your Analytics</span>
              </div>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g., If retention improves by 25% and 25% more people reach 2nd payment, how much more revenue?"
                  disabled={isLoading}
                  rows={3}
                  className="w-full bg-obsidian border border-velvet-gray rounded-lg px-4 py-3 text-pearl placeholder-pearl/40 focus:border-neon-orchid focus:shadow-glow-purple outline-none resize-none disabled:opacity-50 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSubmit(e)
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-pearl/50">
                    Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} + Enter to send
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-4 py-2 text-sm text-pearl/70 hover:text-pearl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="px-6 py-2 bg-gradient-to-r from-neon-orchid to-crimson text-white rounded-lg hover:shadow-glow-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-semibold"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Ask AI
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full px-6 py-4 flex items-center justify-center gap-3 hover:bg-velvet-gray/20 transition-all group"
            >
              <span className="text-2xl">🤖</span>
              <span className="text-pearl font-semibold">Ask AI About Your Data</span>
              <span className="text-pearl/50 text-sm">Click to expand</span>
              <div className="ml-auto">
                <svg className="w-5 h-5 text-neon-orchid group-hover:translate-y-[-2px] transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(157, 0, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(157, 0, 255, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(157, 0, 255, 0.7);
        }
      `}</style>
    </div>
  )
}

export default AIAssistantBar

