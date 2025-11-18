import { useNavigate } from 'react-router-dom'
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

export default function Home() {
  const navigate = useNavigate()

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left: Main Image */}
            <div className="lg:col-span-1 flex flex-col items-center lg:items-start">
              <div className="relative mb-4">
                <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full overflow-hidden border-4 border-white shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400&h=400&fit=crop" 
                    alt="Waterbuck" 
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Biodiversity Collage */}
                <div className="absolute -right-8 top-8 hidden lg:flex flex-col space-y-2">
                  {[
                    'https://images.unsplash.com/photo-1519003722824-194d4455a60e?w=100',
                    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100',
                    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=100',
                    'https://images.unsplash.com/photo-1601042879365-fe391e9f1a89?w=100',
                    'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=100',
                    'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=100'
                  ].map((url, idx) => (
                    <div key={idx} className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
                      <img src={url} alt={`Biodiversity ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Title and Description */}
            <div className="lg:col-span-2 text-center lg:text-left">
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
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
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
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* What This Portal Does */}
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-lg mb-4 mx-auto">
                <FaDatabase className="text-3xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">What This Portal Does</h3>
              <p className="text-gray-600 text-center">
                Integrates biodiversity, forest, land degradation, drought, and ecosystem data from national and global sources into one accessible platform.
              </p>
            </div>

            {/* Why It Matters */}
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4 mx-auto">
                <FaBullseye className="text-3xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">Why It Matters</h3>
              <p className="text-gray-600 text-center">
                Supports NBSAP Implementation, GBF Indicators, national reporting (CBD, UNCCD, MRV), and strategic conservation planning.
              </p>
            </div>

            {/* Who It Serves */}
            <div className="bg-white rounded-xl p-6 lg:p-8 shadow-lg hover:shadow-xl transition-shadow">
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
      <section className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
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
              <div key={idx} className="bg-white rounded-xl p-6 border-2 border-gray-100 hover:border-green-300 hover:shadow-lg transition-all">
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
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
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
                className="relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 cursor-pointer group"
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

