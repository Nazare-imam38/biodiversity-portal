import { FaHome, FaMap, FaDatabase, FaBook, FaFileAlt, FaShieldAlt, FaCreativeCommons, FaHeadset } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white mt-auto pt-4 sm:pt-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Column 1: Government of Pakistan */}
          <div className="sm:col-span-2 md:col-span-1">
            <h3 className="text-base sm:text-lg font-bold text-white mb-2">Government of Pakistan</h3>
            <p className="text-xs sm:text-sm text-white opacity-90 mb-2 sm:mb-3">
              Ministry of Climate Change & Environmental Coordination
            </p>
            {/* Collaboration text */}
            <p className="text-xs text-white opacity-80 mb-3 sm:mb-4 italic">
              In collaboration with UNDP Pakistan and Ministry of Climate Change & Environmental Coordination
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-white opacity-90 hover:text-white hover:opacity-100 transition-colors flex items-center space-x-2">
                  <FaHome className="text-xs" />
                  <span>Home</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white opacity-90 hover:text-white hover:opacity-100 transition-colors flex items-center space-x-2">
                  <FaMap className="text-xs" />
                  <span>GIS Portal</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white opacity-90 hover:text-white hover:opacity-100 transition-colors flex items-center space-x-2">
                  <FaDatabase className="text-xs" />
                  <span>Data Catalog</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white opacity-90 hover:text-white hover:opacity-100 transition-colors flex items-center space-x-2">
                  <FaBook className="text-xs" />
                  <span>Story Maps</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-white opacity-90 hover:text-white hover:opacity-100 transition-colors flex items-center space-x-2">
                  <FaFileAlt className="text-xs" />
                  <span>Documentation & SOPs</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white opacity-90 hover:text-white hover:opacity-100 transition-colors flex items-center space-x-2">
                  <FaShieldAlt className="text-xs" />
                  <span>Privacy Policy</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white opacity-90 hover:text-white hover:opacity-100 transition-colors flex items-center space-x-2">
                  <FaCreativeCommons className="text-xs" />
                  <span>Open Data License</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-white opacity-90 hover:text-white hover:opacity-100 transition-colors flex items-center space-x-2">
                  <FaHeadset className="text-xs" />
                  <span>Contact / Helpdesk</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-green-500 border-opacity-30 my-6"></div>

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-white opacity-90 px-2">
            © 2025 National Biodiversity & Forest Information Portal. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

