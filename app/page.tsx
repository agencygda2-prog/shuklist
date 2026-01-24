import Link from 'next/link';
import { ShoppingCart, TrendingDown, Users, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-primary mb-4">
              🛒 ShukList
            </h1>
            <p className="text-2xl text-gray-600 font-medium">
              The Waze of Shopping
            </p>
          </div>

          {/* Tagline */}
          <p className="text-xl text-gray-700 mb-12 leading-relaxed">
            Compare real supermarket prices in your area, discover the best deals, 
            and save money on groceries with community-powered price tracking.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              href="/auth/signup" 
              className="btn-primary text-lg px-8 py-4 inline-block"
            >
              Get Started Free
            </Link>
            <Link 
              href="/auth/login" 
              className="btn-secondary text-lg px-8 py-4 inline-block"
            >
              Sign In
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
            <FeatureCard 
              icon={<TrendingDown className="w-12 h-12 text-primary" />}
              title="Save Money"
              description="Find the cheapest prices for your shopping list across all local supermarkets"
            />
            <FeatureCard 
              icon={<Users className="w-12 h-12 text-primary" />}
              title="Community Powered"
              description="Real prices from real shoppers, updated in real-time by your neighbors"
            />
            <FeatureCard 
              icon={<MapPin className="w-12 h-12 text-primary" />}
              title="Local Focus"
              description="Prices specific to your town and the stores you actually visit"
            />
            <FeatureCard 
              icon={<ShoppingCart className="w-12 h-12 text-primary" />}
              title="Smart Shopping"
              description="Get recommendations on where to shop or how to split purchases for maximum savings"
            />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            How ShukList Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard 
              number="1"
              title="Build Your List"
              description="Add the items you need to buy. Use barcode scanning for quick entry."
            />
            <StepCard 
              number="2"
              title="Compare Prices"
              description="See real prices from local stores, including current promotions and deals."
            />
            <StepCard 
              number="3"
              title="Save Money"
              description="Shop at the cheapest store or split your list for maximum savings."
            />
          </div>
        </div>
      </div>

      {/* Coverage Area */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">
            Currently Serving
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Grottaminarda • Villanova del Battista • Ariano Irpino
          </p>
          <p className="text-gray-600">
            Covering PAM, Eurospin, MD, Conad, GranRisparmio, and more stores being added by the community.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2026 ShukList - Community-powered grocery savings
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="card text-center">
      <div className="flex justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
