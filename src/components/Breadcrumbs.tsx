import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import StructuredData, { SchemaGenerators } from '@/components/seo/StructuredData';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Filter out duplicate 'Home' root if passed by caller
  const cleanItems = items.filter((item) => item.url !== '/' && item.name.toLowerCase() !== 'home');
  const fullItems = [{ name: 'Home', url: '/' }, ...cleanItems];

  return (
    <>
      <StructuredData
        id="breadcrumbs-jsonld"
        data={SchemaGenerators.breadcrumbs(fullItems)}
      />
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
        <Link
          to="/"
          className="flex items-center gap-1 text-slate-400 transition hover:text-orange-400"
        >
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>

        {cleanItems.map((item, idx) => {
          const isLast = idx === cleanItems.length - 1;
          return (
            <div key={item.url} className="flex items-center gap-1.5">
              <ChevronRight className="h-3 w-3 text-slate-600" />
              {isLast ? (
                <span className="font-medium text-slate-200 line-clamp-1">{item.name}</span>
              ) : (
                <Link
                  to={item.url}
                  className="text-slate-400 transition hover:text-orange-400 line-clamp-1"
                >
                  {item.name}
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}

