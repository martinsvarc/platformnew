import { useEffect } from 'react'

function Analyze() {
  useEffect(() => {
    window.location.replace('https://tracking-chatters.vercel.app/chats')
  }, [])
  return null
}

export default Analyze


