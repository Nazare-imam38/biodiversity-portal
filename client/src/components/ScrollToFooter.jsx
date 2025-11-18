import { useState, useEffect } from 'react'
import { FaArrowDown, FaArrowUp } from 'react-icons/fa'

export default function ScrollToFooter() {
  const [showScrollDown, setShowScrollDown] = useState(false)
  const [showScrollUp, setShowScrollUp] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollPercentage = (window.scrollY / (documentHeight - window.innerHeight)) * 100

      // Show scroll down button if not near bottom
      setShowScrollDown(scrollPercentage < 80)
      
      // Show scroll up button if scrolled down
      setShowScrollUp(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check on mount

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToFooter = () => {
    const footer = document.querySelector('footer')
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* Scroll to Footer Button */}
      {showScrollDown && (
        <button
          onClick={scrollToFooter}
          className="fixed bottom-20 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center"
          aria-label="Scroll to footer"
        >
          <FaArrowDown className="text-lg" />
        </button>
      )}

      {/* Scroll to Top Button */}
      {showScrollUp && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <FaArrowUp className="text-lg" />
        </button>
      )}
    </>
  )
}

