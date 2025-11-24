export default function PartnersSection() {
  return (
    <section className="bg-white py-2 sm:py-4 lg:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-2 sm:mb-4 lg:mb-6">
          Our Valued Partners
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          {/* UNDP Logo */}
          <div className="flex items-center justify-center" style={{ width: '140px', height: '80px' }}>
            <img 
              src="/Assets/UNDP%20A.png" 
              alt="United Nations Development Programme" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          
          {/* GEF Logo - Center */}
          <div className="flex items-center justify-center" style={{ width: '140px', height: '80px' }}>
            <img 
              src="/Assets/gef.png" 
              alt="Global Environment Facility" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          
          {/* Ministry Logo */}
          <div className="flex items-center justify-center" style={{ width: '140px', height: '80px' }}>
            <img 
              src="/Assets/mocc.png" 
              alt="Ministry of Climate Change & Environmental Coordination" 
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

