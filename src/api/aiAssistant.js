// Call the serverless AI function (works with both Netlify and Vercel)
export async function askAI(teamId, question) {
  try {
    const apiUrl = import.meta.env.PROD 
      ? '/api/ai-ask'  // Vercel in production
      : '/.netlify/functions/ai-ask'  // Netlify Dev locally
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        teamId,
        question
      })
    })

    if (!response.ok) {
      // If 404, function doesn't exist
      if (response.status === 404) {
        throw new Error('AI_NOT_CONFIGURED')
      }
      
      const text = await response.text()
      try {
        const error = text ? JSON.parse(text) : {}
        throw new Error(error.error || 'AI request failed')
      } catch (e) {
        if (e.message === 'AI request failed' || e.message.startsWith('AI_')) {
          throw e
        }
        throw new Error('AI_NOT_CONFIGURED')
      }
    }

    // Parse successful response
    const text = await response.text()
    let data
    try {
      data = text ? JSON.parse(text) : {}
    } catch (e) {
      console.error('Failed to parse AI response:', text)
      throw new Error('Invalid response from AI service')
    }

    return {
      answer: data.answer,
      context: data.context,
      error: false
    }
  } catch (error) {
    console.error('Error in askAI:', error)
    
    if (error.message === 'AI_NOT_CONFIGURED') {
      return {
        answer: `🚀 **AI Assistant Setup Required**

To use the AI assistant, you need to run the app with Netlify Dev:

**Quick Setup:**
1. Install Netlify CLI: \`npm install -g netlify-cli\`
2. Create \`.env\` file with your API key:
   \`\`\`
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   VITE_DATABASE_URL=your-neon-db-url
   \`\`\`
3. Run: \`netlify dev\`
4. Open: http://localhost:8888

**Why?** The AI assistant uses serverless functions to keep your API keys secure and avoid CORS issues.

See AI_ASSISTANT_SETUP.md for detailed instructions.`,
        error: true
      }
    }
    
    return {
      answer: `Error: ${error.message}\n\nIf you're running with 'npm run dev', please use 'netlify dev' instead to enable the AI assistant.`,
      error: true
    }
  }
}
