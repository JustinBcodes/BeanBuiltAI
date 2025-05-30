'use client'

import { useState } from 'react'

export default function TestClicksPage() {
  const [clickCount, setClickCount] = useState(0)
  
  const handleClick = () => {
    console.log('🔥 Basic click handler triggered!');
    setClickCount(prev => prev + 1);
    alert(`Click #${clickCount + 1} detected!`);
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Click Test Page</h1>
      <p className="mb-4">Click count: {clickCount}</p>
      
      <div className="space-y-4">
        <button 
          onClick={handleClick}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Test Basic Button Click
        </button>
        
        <div 
          onClick={handleClick}
          className="bg-green-500 text-white p-4 rounded cursor-pointer hover:bg-green-600"
        >
          Test Div Click
        </div>
        
        <div 
          className="bg-yellow-500 text-black p-4 rounded cursor-pointer hover:bg-yellow-600"
          onClick={(e) => {
            console.log('🔥 Direct inline handler triggered!');
            setClickCount(prev => prev + 1);
            alert(`Inline click #${clickCount + 1}!`);
          }}
        >
          Test Inline Click Handler
        </div>
      </div>
    </div>
  )
} 