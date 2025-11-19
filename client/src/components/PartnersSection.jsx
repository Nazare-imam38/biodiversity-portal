export default function PartnersSection() {
  return (
    <section className="bg-white py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">
          Our Valued Partners & Data Sources
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 lg:gap-10">
          {/* UNDP Logo */}
          <div className="flex items-center justify-center">
            <img 
              src="/Assets/undp.png" 
              alt="United Nations Development Programme" 
              className="h-16 sm:h-20 lg:h-24 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          
          {/* Ministry Logo */}
          <div className="flex items-center justify-center">
            <img 
              src="/Assets/mocc.png" 
              alt="Ministry of Climate Change & Environmental Coordination" 
              className="h-16 sm:h-20 lg:h-24 w-auto object-contain"
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

