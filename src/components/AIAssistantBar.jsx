import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { askAI } from '../api/aiAssistant'

function AIAssistantBar() {
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState([]) // Array of {role: 'user'|'assistant', content: string}
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef(null)
  const conversationEndRef = useRef(null)

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  useEffect(() => {
    if (conversation.length > 0 && conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [conversation])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const question = input.trim()
    
    // Add user message to conversation
    const newConversation = [...conversation, { role: 'user', content: question }]
    setConversation(newConversation)
    setInput('')
    setIsLoading(true)

    try {
      const result = await askAI(user.team_id, question)
      // Add AI response to conversation
      setConversation([...newConversation, { role: 'assistant', content: result.answer, error: result.error }])
    } catch (error) {
      setConversation([...newConversation, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', error: true }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setInput('')
    setConversation([])
    setIsExpanded(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="w-full max-w-4xl px-4 pb-4 pointer-events-auto">
        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="mb-3 unified-glass p-4 max-h-[60vh] flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h4 className="font-semibold text-gradient-primary">AI Conversation</h4>
              </div>
              <button
                onClick={() => setConversation([])}
                className="text-pearl/50 hover:text-pearl transition-colors"
                title="Clear conversation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {conversation.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-2 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white'
                        : msg.error
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-velvet-gray/60 text-pearl'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={conversationEndRef} />
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
                    {conversation.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setConversation([])}
                        className="px-4 py-2 text-sm text-pearl/50 hover:text-pearl/70 transition-colors"
                        title="Clear conversation"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="px-4 py-2 text-sm text-pearl/70 hover:text-pearl transition-colors"
                    >
                      Collapse
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

