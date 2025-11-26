import { useState, useEffect } from 'react'
import { FaLock } from 'react-icons/fa'

const CORRECT_CODE = '549537'

export default function CodeEntry({ onCodeCorrect }) {
  const [enteredCode, setEnteredCode] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  // Check if user is already authenticated
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('biodiversity_portal_authenticated')
    if (isAuthenticated === 'true') {
      onCodeCorrect()
    }
  }, [onCodeCorrect])

  const handleNumberClick = (num) => {
    if (enteredCode.length < 6) {
      setEnteredCode(prev => prev + num)
      setError('')
    }
  }

  const handleDelete = () => {
    setEnteredCode(prev => prev.slice(0, -1))
    setError('')
  }

  const handleClear = () => {
    setEnteredCode('')
    setError('')
  }

  useEffect(() => {
    if (enteredCode.length === 6) {
      if (enteredCode === CORRECT_CODE) {
        // Correct code - authenticate and allow access
        localStorage.setItem('biodiversity_portal_authenticated', 'true')
        onCodeCorrect()
      } else {
        // Wrong code - show error and shake
        setError('Incorrect code. Please try again.')
        setShake(true)
        setTimeout(() => {
          setEnteredCode('')
          setShake(false)
        }, 1000)
      }
    }
  }, [enteredCode, onCodeCorrect])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <div className="w-full max-w-md px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 border border-gray-200">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <FaLock className="text-white text-3xl sm:text-4xl" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-2">
            Biodiversity Portal
          </h1>
          <p className="text-center text-gray-600 text-sm sm:text-base mb-8">
            Enter code to access
          </p>

          {/* Code Display */}
          <div className="mb-8">
            <div className={`flex justify-center space-x-2 sm:space-x-3 mb-4 ${shake ? 'animate-pulse' : ''}`}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 flex items-center justify-center text-xl sm:text-2xl font-bold transition-all duration-200 ${
                    index < enteredCode.length
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-gray-50 text-gray-400'
                  } ${shake ? 'border-red-500 bg-red-50' : ''}`}
                >
                  {index < enteredCode.length ? '●' : ''}
                </div>
              ))}
            </div>
            {error && (
              <p className="text-center text-red-600 text-sm font-medium animate-pulse">
                {error}
              </p>
            )}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="h-14 sm:h-16 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-green-50 hover:to-green-100 border-2 border-gray-200 hover:border-green-400 rounded-xl text-xl sm:text-2xl font-bold text-gray-700 hover:text-green-700 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-14 sm:h-16 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-red-50 hover:to-red-100 border-2 border-gray-200 hover:border-red-400 rounded-xl text-sm sm:text-base font-semibold text-gray-700 hover:text-red-700 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
            >
              Clear
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="h-14 sm:h-16 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-green-50 hover:to-green-100 border-2 border-gray-200 hover:border-green-400 rounded-xl text-xl sm:text-2xl font-bold text-gray-700 hover:text-green-700 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-14 sm:h-16 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-orange-50 hover:to-orange-100 border-2 border-gray-200 hover:border-orange-400 rounded-xl text-sm sm:text-base font-semibold text-gray-700 hover:text-orange-700 transition-all duration-200 active:scale-95 shadow-sm hover:shadow-md flex items-center justify-center"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

