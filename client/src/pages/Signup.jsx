import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash } from 'react-icons/fa'

export default function Signup() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    if (!agreeToTerms) {
      alert('Please agree to the terms and conditions')
      return
    }
    // Handle signup logic here
    console.log('Signup submitted:', formData)
    // Navigate to dashboard after successful signup
    // navigate('/dashboard')
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative"
      style={{
        backgroundImage: 'url(/ass/log-si.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* MOCC Logo - Top Left */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
        <a 
          href="https://mocc.gov.pk/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          title="Ministry of Climate Change & Environmental Coordination"
        >
          <img 
            src="/mocc.png" 
            alt="Ministry of Climate Change & Environmental Coordination" 
            className="h-12 sm:h-16 w-auto object-contain drop-shadow-lg cursor-pointer"
          />
        </a>
      </div>

      {/* UNDP and GEF Logos - Top Right */}
      <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-20 flex items-center gap-3 sm:gap-4">
        <a 
          href="https://www.thegef.org/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          title="Global Environment Facility"
        >
          <img 
            src="/Assets/gef.png" 
            alt="Global Environment Facility" 
            className="h-10 sm:h-14 w-auto object-contain drop-shadow-lg cursor-pointer"
          />
        </a>
        <a 
          href="https://www.undp.org/pakistan" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          title="UNDP Pakistan"
        >
          <img 
            src="/Assets/UNDP A.png" 
            alt="UNDP Pakistan" 
            className="h-10 sm:h-14 w-auto object-contain drop-shadow-lg cursor-pointer"
          />
        </a>
      </div>

      {/* Signup Form */}
      <div className="relative z-10 w-full mx-auto mt-20 sm:mt-24 mb-8" style={{ maxWidth: '400px', width: '90%' }}>
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8 border border-white/30">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-5 md:mb-6 text-center drop-shadow-md">Create Account</h2>
          
          <form className="flex flex-col gap-3 sm:gap-3.5" onSubmit={handleSubmit}>
            {/* Name Field */}
            <div className="flex flex-col">
              <label className="text-[#159f48] font-semibold mb-1 text-sm sm:text-base drop-shadow-md">Full Name</label>
              <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg h-11 sm:h-12 flex items-center px-3 transition-all duration-200 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-white/30">
                <svg 
                  height={20} 
                  viewBox="0 0 448 512" 
                  width={20} 
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#159f48]"
                >
                  <path 
                    d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z" 
                    fill="currentColor"
                  />
                </svg>
                <input
                  type="text"
                  name="name"
                  className="ml-3 border-none outline-none flex-1 text-gray-900 placeholder-gray-500 bg-transparent"
                  placeholder="Enter your Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col">
              <label className="text-[#159f48] font-semibold mb-1 text-sm sm:text-base drop-shadow-md">Email</label>
              <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg h-11 sm:h-12 flex items-center px-3 transition-all duration-200 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-white/30">
                <svg 
                  height={20} 
                  viewBox="0 0 32 32" 
                  width={20} 
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#159f48]"
                >
                  <g id="Layer_3" data-name="Layer 3">
                    <path 
                      d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" 
                      fill="currentColor"
                    />
                  </g>
                </svg>
                <input
                  type="email"
                  name="email"
                  className="ml-3 border-none outline-none flex-1 text-gray-900 placeholder-gray-500 bg-transparent"
                  placeholder="Enter your Email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col">
              <label className="text-[#159f48] font-semibold mb-1 text-sm sm:text-base drop-shadow-md">Password</label>
              <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg h-11 sm:h-12 flex items-center px-3 transition-all duration-200 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-white/30">
                <svg 
                  height={20} 
                  viewBox="-64 0 512 512" 
                  width={20} 
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#159f48]"
                >
                  <path 
                    d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" 
                    fill="currentColor"
                  />
                  <path 
                    d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" 
                    fill="currentColor"
                  />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="ml-3 border-none outline-none flex-1 text-gray-900 placeholder-gray-500 bg-transparent"
                  placeholder="Enter your Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 p-1 text-white/80 hover:text-white transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col">
              <label className="text-[#159f48] font-semibold mb-1 text-sm sm:text-base drop-shadow-md">Confirm Password</label>
              <div className="bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg h-11 sm:h-12 flex items-center px-3 transition-all duration-200 focus-within:border-white/60 focus-within:ring-2 focus-within:ring-white/30">
                <svg 
                  height={20} 
                  viewBox="-64 0 512 512" 
                  width={20} 
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[#159f48]"
                >
                  <path 
                    d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" 
                    fill="currentColor"
                  />
                  <path 
                    d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" 
                    fill="currentColor"
                  />
                </svg>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="ml-3 border-none outline-none flex-1 text-gray-900 placeholder-gray-500 bg-transparent"
                  placeholder="Confirm your Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="ml-2 p-1 text-white/80 hover:text-white transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 text-[#159f48] border-gray-300 rounded focus:ring-[#159f48]"
              />
              <label htmlFor="terms" className="text-sm text-white font-normal cursor-pointer drop-shadow-md">
                I agree to the{' '}
                <button
                  type="button"
                  className="text-white font-medium hover:text-white/80 transition-colors underline"
                >
                  Terms and Conditions
                </button>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              className="mt-4 sm:mt-5 bg-[#159f48] hover:bg-[#22c55e] text-white font-medium rounded-lg h-11 sm:h-12 w-full transition-colors duration-200 shadow-md hover:shadow-lg text-sm sm:text-base"
            >
              Sign Up
            </button>

            {/* Sign In Link */}
            <p className="text-center text-sm text-white mt-2 drop-shadow-md">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-white font-medium hover:text-white/80 transition-colors cursor-pointer underline"
              >
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

