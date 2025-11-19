import { useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { 
  FaDatabase, 
  FaBullseye, 
  FaUsers, 
  FaChartBar, 
  FaLayerGroup, 
  FaTree, 
  FaMountain, 
  FaShieldAlt, 
  FaDownload 
} from 'react-icons/fa'

// Custom hook for scroll animations
function useScrollAnimation(options = {}) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Optionally disconnect after first animation
          if (options.once !== false) {
            observer.disconnect()
          }
        } else if (options.once === false) {
          setIsVisible(false)
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px'
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [options.threshold, options.rootMargin, options.once])

  return [ref, isVisible]
}

export default function Home() {
  const navigate = useNavigate()
  
  // Animation refs for each section
  const [dataHubRef, dataHubVisible] = useScrollAnimation()
  const [whatWhyWhoRef, whatWhyWhoVisible] = useScrollAnimation()
  const [featuresRef, featuresVisible] = useScrollAnimation()
  const [datasetsRef, datasetsVisible] = useScrollAnimation()

  // Hero section images for rotation
  const heroImages = [
    { url: 'https://images.pexels.com/photos/14681717/pexels-photo-14681717.jpeg', alt: 'Biodiversity Image 1' },
    { url: 'https://images.pexels.com/photos/1000057/pexels-photo-1000057.jpeg', alt: 'Biodiversity Image 2' },
    { url: 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg', alt: 'Biodiversity Image 3' },
    { url: 'https://images.pexels.com/photos/26586553/pexels-photo-26586553.jpeg', alt: 'Biodiversity Image 4' },
    { url: 'https://images.pexels.com/photos/4055789/pexels-photo-4055789.jpeg', alt: 'Biodiversity Image 5' },
    { url: 'https://images.pexels.com/photos/17811/pexels-photo.jpg', alt: 'Biodiversity Image 6' }
  ]

  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Rotate images every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [heroImages.length])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-green-900 text-white overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920)',
          filter: 'blur(2px)'
        }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Main Image with Animation */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                {/* Large Animated Circle */}
                <div className="w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-gray-200 relative">
                  <img 
                    key={currentImageIndex}
                    src={heroImages[currentImageIndex].url} 
                    alt={heroImages[currentImageIndex].alt} 
                    className="w-full h-full object-cover object-center animate-fadeIn"
                    style={{ 
                      animation: 'fadeIn 0.8s ease-in-out',
                      objectPosition: 'center center'
                    }}
                    onError={(e) => {
                      // Fallback to next image if current fails
                      const nextIndex = (currentImageIndex + 1) % heroImages.length
                      e.target.src = heroImages[nextIndex].url
                    }}
                  />
                </div>
                
                {/* Cascading Chain of Smaller Circles (Right Side) */}
                <div className="absolute left-full top-0 ml-4 lg:ml-8 hidden lg:flex flex-col -space-y-3">
                  {heroImages.map((item, idx) => {
                    // Create cascading chain pattern: 
                    // 1st: aligned left (0), 2nd: slightly right (16px), 3rd: more right (32px),
                    // 4th: tilting back left (24px), 5th: more left (8px), 6th: aligned with first (0px)
                    const horizontalOffsets = [0, 16, 32, 24, 8, 0] // pixels to shift right from base position
                    const offset = horizontalOffsets[idx] || 0
                    
                    return (
                    <div 
                      key={idx} 
                      className={`w-20 h-20 lg:w-24 lg:h-24 rounded-full overflow-hidden shadow-lg bg-gray-200 transition-all duration-300 ${
                        idx === currentImageIndex 
                            ? 'border-green-400 ring-4 ring-green-400 ring-opacity-50' 
                          : 'border-white'
                      }`}
                      style={{ 
                        borderWidth: idx === currentImageIndex ? '3px' : '2px',
                          zIndex: heroImages.length - idx,
                          transform: `translateX(${offset}px) ${idx === currentImageIndex ? 'scale(1.1)' : 'scale(1)'}`
                      }}
                    >
                      <img 
                        src={item.url} 
                        alt={item.alt} 
                        className="w-full h-full object-cover object-center"
                        style={{ objectPosition: 'center center' }}
                        loading="lazy"
                        onError={(e) => {
                          // Fallback to a solid color if image fails to load
                          e.target.style.display = 'none'
                          e.target.parentElement.style.backgroundColor = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#10b981'][idx] || '#22c55e'
                        }}
                      />
                    </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right: Title and Description */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                Pakistan's Integrated Biodiversity Information Platform
              </h1>
              <p className="text-lg sm:text-xl text-green-100 mb-8 max-w-2xl">
                A unified system for biodiversity and forest data to guide national reporting and policy.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Let's Explore
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* National Data Hub Section */}
      <section ref={dataHubRef} className={`py-12 sm:py-16 lg:py-20 bg-white transition-all duration-1000 ease-out ${
        dataHubVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-green-800 mb-4">
            A National Data Hub for Environmental Stewardship
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Centralizing critical data to empower decision-making for a sustainable future.
          </p>
        </div>
      </section>

      {/* What/Why/Who Section */}
      <section ref={whatWhyWhoRef} className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* What This Portal Does */}
            <div className={`bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-700 ease-out ${
              whatWhyWhoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: whatWhyWhoVisible ? '0ms' : '0ms' }}>
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4 mx-auto">
                <FaDatabase className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">What This Portal Does</h3>
              <p className="text-gray-600 text-center">
                Integrates biodiversity, forest, land degradation, drought, and ecosystem data from national and global sources into one accessible platform.
              </p>
            </div>

            {/* Why It Matters */}
            <div className={`bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-700 ease-out ${
              whatWhyWhoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: whatWhyWhoVisible ? '150ms' : '0ms' }}>
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 mx-auto">
                <FaBullseye className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Why It Matters</h3>
              <p className="text-gray-600 text-center">
                Supports NBSAP Implementation, GBF Indicators, national reporting (CBD, UNCCD, MRV), and strategic conservation planning.
              </p>
            </div>

            {/* Who It Serves */}
            <div className={`bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-700 ease-out ${
              whatWhyWhoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`} style={{ transitionDelay: whatWhyWhoVisible ? '300ms' : '0ms' }}>
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4 mx-auto">
                <FaUsers className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Who It Serves</h3>
              <p className="text-gray-600 text-center">
                Policymakers, researchers, provincial departments, conservation NGOs, students, and the general public.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features & Capabilities */}
      <section ref={featuresRef} className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 ease-out ${
            featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-green-800 mb-4">
              Platform Features & Capabilities
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Explore a suite of powerful tools designed for comprehensive environmental analysis and reporting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: FaChartBar, title: 'Interactive GIS Dashboard', desc: 'Visualize complex datasets on a dynamic map interface.' },
              { icon: FaLayerGroup, title: 'Biodiversity Layers', desc: 'Access data on species, ecosystems, and protected areas.' },
              { icon: FaTree, title: 'Forest Monitoring (NFMS)', desc: 'Track forest cover, change, and biomass over time.' },
              { icon: FaMountain, title: 'Land Degradation Indicators', desc: 'Analyze drought risk and land productivity dynamics.' },
              { icon: FaShieldAlt, title: 'Protected Areas & Corridors', desc: 'Map and explore the national conservation network.' },
              { icon: FaDownload, title: 'Data Download Center', desc: 'Freely access datasets with comprehensive metadata.' }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className={`bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-green-300 hover:shadow-lg transition-all duration-700 ease-out ${
                  featuresVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: featuresVisible ? `${idx * 100}ms` : '0ms' }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <feature.icon className="text-2xl text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{feature.title}</h3>
                </div>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Datasets & Key Statistics */}
      <section ref={datasetsRef} className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`text-center mb-12 transition-all duration-1000 ease-out ${
            datasetsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}>
            <h2 className="text-3xl sm:text-4xl font-bold text-green-800 mb-4">
              Explore Datasets & Key Statistics
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Dive into our core data themes and see the latest national figures at a glance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { 
                title: 'Biodiversity Data', 
                subtitle: 'Species, KBAs, Wetlands, PAs',
                image: 'https://images.unsplash.com/photo-1551969014-7d2c4cddf0b6?w=800&h=600&fit=crop',
                gradient: 'from-green-600 to-green-800'
              },
              { 
                title: 'Forests & Land Cover', 
                subtitle: 'Cover, Change, Biomass, Fires',
                image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
                gradient: 'from-green-700 to-green-900'
              },
              { 
                title: 'Land Degradation', 
                subtitle: 'Drought, Soil Health, Erosion',
                image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&h=600&fit=crop',
                gradient: 'from-amber-600 to-amber-800'
              }
            ].map((dataset, idx) => (
              <div 
                key={idx} 
                className={`relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-700 ease-out transform hover:scale-105 cursor-pointer group ${
                  datasetsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: datasetsVisible ? `${idx * 150}ms` : '0ms' }}
                onClick={() => navigate('/dashboard')}
              >
                <div className="relative h-64 sm:h-80">
                  <img 
                    src={dataset.image} 
                    alt={dataset.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${dataset.gradient} opacity-80 group-hover:opacity-90 transition-opacity`}></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">{dataset.title}</h3>
                    <p className="text-green-100">{dataset.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

