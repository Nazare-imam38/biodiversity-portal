import { useState, useEffect } from 'react'
import { FaLeaf, FaBars, FaSearch, FaBell, FaUserCircle, FaTimes } from 'react-icons/fa'

export default function Header() {
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [undpLogoError, setUndpLogoError] = useState(false)
  const [ministryLogoError, setMinistryLogoError] = useState(false)
  const [activePage, setActivePage] = useState('Dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      setCurrentDate(now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }))
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }))
    }

    // Update immediately
    updateDateTime()

    // Update every second
    const interval = setInterval(updateDateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <header className="bg-white shadow-md z-50">
      {/* Top Navigation Bar */}
      <div className="border-b border-gray-200">
        <div className="px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="bg-green-600 p-1.5 sm:p-2 rounded-lg">
              <FaLeaf className="text-white text-lg sm:text-xl" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-800">Biodiversity</h1>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-green-600 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                setActivePage('Home')
              }}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activePage === 'Home'
                  ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Home
            </a>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                setActivePage('Dashboard')
              }}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activePage === 'Dashboard'
                  ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Dashboard
            </a>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                setActivePage('Data Visualization')
              }}
              className={`px-2 lg:px-4 py-2 rounded-lg transition-all duration-300 text-sm lg:text-base ${
                activePage === 'Data Visualization'
                  ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span className="hidden lg:inline">Data Visualization</span>
              <span className="lg:hidden">Visualization</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                setActivePage('Data Management')
              }}
              className={`px-2 lg:px-4 py-2 rounded-lg transition-all duration-300 text-sm lg:text-base ${
                activePage === 'Data Management'
                  ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span className="hidden lg:inline">Data Management</span>
              <span className="lg:hidden">Management</span>
            </a>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                setActivePage('Tools')
              }}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activePage === 'Tools'
                  ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Tools
            </a>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault()
                setActivePage('Contact')
              }}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activePage === 'Contact'
                  ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              Contact
            </a>
          </nav>
        </div>

      </div>

      {/* Collaboration Banner */}
      <div className="bg-green-600 text-white px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm">
        <div className="text-center mb-2 sm:mb-3 text-xs sm:text-sm px-2">
          In collaboration with UNDP Pakistan and Ministry of Climate Change & Environmental Coordination
        </div>
        <div className="flex items-center justify-center space-x-3 sm:space-x-6">
          {!undpLogoError ? (
            <img 
              src="/undp.png" 
              alt="UNDP Logo" 
              className="h-12 sm:h-16 object-contain"
              style={{ maxWidth: '150px' }}
              onError={() => setUndpLogoError(true)}
            />
          ) : (
            <span className="text-xs sm:text-sm font-semibold">UNDP</span>
          )}
          {!ministryLogoError ? (
            <img 
              src="/mocc.png" 
              alt="Ministry of Climate Change & Environmental Coordination Logo" 
              className="h-12 w-12 sm:h-16 sm:w-16 object-contain"
              onError={() => setMinistryLogoError(true)}
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-full"></div>
          )}
        </div>
      </div>

      {/* Date, Time, and User Bar */}
      <div className="bg-gray-100 px-3 sm:px-6 py-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-600">
          <span className="hidden sm:inline">{currentDate}</span>
          <span className="sm:hidden">{currentDate.split(',')[0]}</span>
          <span>{currentTime}</span>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative hidden sm:block">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm w-48"
            />
          </div>
          <button className="p-1.5 sm:p-2 text-gray-600 hover:text-green-600 transition-colors relative">
            <FaBell className="text-base sm:text-lg" />
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></span>
          </button>
          <button className="p-1.5 sm:p-2 text-gray-600 hover:text-green-600 transition-colors">
            <FaUserCircle className="text-xl sm:text-2xl" />
          </button>
        </div>
      </div>

      {/* Mobile Side Drawer */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-64 sm:w-72 bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out flex flex-col ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-green-600 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1.5 rounded-lg">
              <FaLeaf className="text-green-600 text-lg" />
            </div>
            <h2 className="text-lg font-bold text-white">Biodiversity</h2>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-white hover:bg-green-700 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Drawer Navigation */}
        <nav className="flex flex-col p-4 space-y-2 overflow-y-auto flex-1">
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault()
              setActivePage('Home')
              setMobileMenuOpen(false)
            }}
            className={`px-4 py-3 rounded-lg transition-all ${
              activePage === 'Home'
                ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            Home
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault()
              setActivePage('Dashboard')
              setMobileMenuOpen(false)
            }}
            className={`px-4 py-3 rounded-lg transition-all ${
              activePage === 'Dashboard'
                ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            Dashboard
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault()
              setActivePage('Data Visualization')
              setMobileMenuOpen(false)
            }}
            className={`px-4 py-3 rounded-lg transition-all ${
              activePage === 'Data Visualization'
                ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            Data Visualization
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault()
              setActivePage('Data Management')
              setMobileMenuOpen(false)
            }}
            className={`px-4 py-3 rounded-lg transition-all ${
              activePage === 'Data Management'
                ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            Data Management
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault()
              setActivePage('Tools')
              setMobileMenuOpen(false)
            }}
            className={`px-4 py-3 rounded-lg transition-all ${
              activePage === 'Tools'
                ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            Tools
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault()
              setActivePage('Contact')
              setMobileMenuOpen(false)
            }}
            className={`px-4 py-3 rounded-lg transition-all ${
              activePage === 'Contact'
                ? 'text-green-600 font-semibold bg-green-50 border-2 border-green-600'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
          >
            Contact
          </a>
        </nav>

        {/* Collaboration Section in Drawer */}
        <div className="bg-green-600 text-white p-4 border-t border-green-700 flex-shrink-0">
          <div className="text-center mb-3 text-xs px-2">
            In collaboration with UNDP Pakistan and Ministry of Climate Change & Environmental Coordination
          </div>
          <div className="flex items-center justify-center space-x-4">
            {!undpLogoError ? (
              <img 
                src="/undp.png" 
                alt="UNDP Logo" 
                className="h-12 object-contain"
                style={{ maxWidth: '120px' }}
                onError={() => setUndpLogoError(true)}
              />
            ) : (
              <span className="text-xs font-semibold">UNDP</span>
            )}
            {!ministryLogoError ? (
              <img 
                src="/mocc.png" 
                alt="Ministry of Climate Change & Environmental Coordination Logo" 
                className="h-12 w-12 object-contain"
                onError={() => setMinistryLogoError(true)}
              />
            ) : (
              <div className="w-12 h-12 bg-white rounded-full"></div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </header>
  )
}
