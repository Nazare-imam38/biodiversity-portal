export default function PartnersSection() {
  return (
    <section className="bg-white py-2 sm:py-4 lg:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-2 sm:mb-4 lg:mb-6">
          Our Valued Partners
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          {/* UNDP Logo */}
          <div className="flex items-center justify-center" style={{ width: '100px', height: '60px' }}>
            <a 
              href="https://www.undp.org/pakistan" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity flex items-center justify-center"
              title="United Nations Development Programme"
            >
              <img 
                src="/Assets/UNDP%20A.png" 
                alt="United Nations Development Programme" 
                className="object-contain cursor-pointer"
                style={{ maxWidth: '80px', maxHeight: '50px', width: 'auto', height: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </a>
          </div>
          
          {/* GEF Logo - Center */}
          <div className="flex items-center justify-center" style={{ width: '100px', height: '60px' }}>
            <a 
              href="https://www.thegef.org/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity flex items-center justify-center"
              title="Global Environment Facility"
            >
              <img 
                src="/Assets/gef.png" 
                alt="Global Environment Facility" 
                className="object-contain cursor-pointer"
                style={{ maxWidth: '80px', maxHeight: '50px', width: 'auto', height: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </a>
          </div>
          
          {/* Ministry Logo */}
          <div className="flex items-center justify-center" style={{ width: '100px', height: '60px' }}>
            <a 
              href="https://mocc.gov.pk/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity flex items-center justify-center"
              title="Ministry of Climate Change & Environmental Coordination"
            >
              <img 
                src="/Assets/mocc.png" 
                alt="Ministry of Climate Change & Environmental Coordination" 
                className="object-contain cursor-pointer"
                style={{ maxWidth: '80px', maxHeight: '50px', width: 'auto', height: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

