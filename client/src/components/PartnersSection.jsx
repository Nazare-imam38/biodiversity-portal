export default function PartnersSection() {
  return (
    <section className="bg-white py-4">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-center text-base sm:text-lg font-semibold text-gray-800 mb-3">
          Our Valued Partners
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          {/* UNDP Logo */}
          <div className="flex items-center justify-center" style={{ width: '180px', height: '100px' }}>
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
                style={{ maxWidth: '160px', maxHeight: '90px', width: 'auto', height: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </a>
          </div>
          
          {/* GEF Logo - Center */}
          <div className="flex items-center justify-center" style={{ width: '180px', height: '100px' }}>
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
                style={{ maxWidth: '160px', maxHeight: '90px', width: 'auto', height: 'auto' }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </a>
          </div>
          
          {/* Ministry Logo */}
          <div className="flex items-center justify-center" style={{ width: '180px', height: '100px' }}>
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
                style={{ maxWidth: '160px', maxHeight: '90px', width: 'auto', height: 'auto' }}
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

