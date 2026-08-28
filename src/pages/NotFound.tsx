import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-950 p-6 text-center text-white">
      <div className="space-y-6 max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 mb-2 group">
          <img
            src="/android-chrome-192x192.png"
            alt="OrangeFlix logo"
            className="h-14 w-14 object-contain drop-shadow-[0_2px_12px_rgba(249,115,22,0.5)] group-hover:scale-105 transition-transform"
          />
        </Link>
        <div className="space-y-3">
          <h1 className="text-7xl font-extrabold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-white">Page Not Found</h2>
          <p className="text-gray-400 text-sm">
            The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
