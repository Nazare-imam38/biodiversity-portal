import { FaSpinner } from 'react-icons/fa'

export default function LoadingSpinner() {
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="text-center">
        <FaSpinner className="inline-block animate-spin text-6xl text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Biodiversity Portal</h2>
        <p className="text-gray-600">Preparing your GIS dashboard...</p>
      </div>
    </div>
  )
}

