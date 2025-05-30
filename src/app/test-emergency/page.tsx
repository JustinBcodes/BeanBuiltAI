'use client'

import { useEffect, useState } from 'react'

export default function EmergencyTestPage() {
  const [clickCount, setClickCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    console.log('🔥 Emergency test page mounted')
    setMounted(true)
    
    // Check if there are any global JavaScript errors
    window.addEventListener('error', (e) => {
      console.error('🚨 GLOBAL JS ERROR:', e.error)
    })
    
    // Test if basic DOM events work
    const testDiv = document.createElement('div')
    testDiv.addEventListener('click', () => {
      console.log('✅ Basic DOM event listener works')
    })
    
    return () => {
      window.removeEventListener('error', () => {})
    }
  }, [])
  
  console.log('🔥 Emergency test page rendering, mounted:', mounted, 'clickCount:', clickCount)
  
  const handleClick = () => {
    console.log('🚨 CLICK HANDLER CALLED!')
    setClickCount(prev => prev + 1)
    alert(`Click #${clickCount + 1} detected!`)
  }
  
  return (
    <div style={{ padding: '20px', backgroundColor: 'red', color: 'white' }}>
      <h1>EMERGENCY CLICK TEST</h1>
      <p>Mounted: {mounted ? 'YES' : 'NO'}</p>
      <p>Click count: {clickCount}</p>
      
      <button 
        style={{ 
          padding: '20px', 
          fontSize: '20px', 
          backgroundColor: 'yellow', 
          color: 'black',
          border: '3px solid blue',
          cursor: 'pointer',
          display: 'block',
          margin: '10px 0'
        }}
        onMouseEnter={() => console.log('🐭 Mouse entered button')}
        onMouseLeave={() => console.log('🐭 Mouse left button')}
        onClick={handleClick}
      >
        EMERGENCY CLICK TEST (Count: {clickCount})
      </button>
      
      <button
        style={{ 
          padding: '20px', 
          fontSize: '20px', 
          backgroundColor: 'green', 
          color: 'white',
          border: '3px solid black',
          cursor: 'pointer',
          display: 'block',
          margin: '10px 0'
        }}
        onClick={() => {
          console.log('🟢 INLINE CLICK WORKS!')
          alert('INLINE CLICK WORKS!')
        }}
      >
        INLINE CLICK TEST
      </button>
      
      <div 
        style={{
          marginTop: '20px',
          padding: '20px',
          backgroundColor: 'blue',
          color: 'white',
          cursor: 'pointer',
          border: '3px solid white'
        }}
        onClick={() => {
          console.log('🚨 DIV CLICK WORKS!')
          alert('DIV CLICK WORKS!')
        }}
      >
        CLICK THIS DIV TOO
      </div>
    </div>
  )
} 