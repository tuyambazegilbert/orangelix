import StructuredData, { SchemaGenerators } from '@/components/seo/StructuredData';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumbs provides SEO Structured Data without cluttering the visual UI.
 */
export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const cleanItems = items.filter((item) => item.url !== '/' && item.name.toLowerCase() !== 'home');
  const fullItems = [{ name: 'Home', url: '/' }, ...cleanItems];

  return (
    <StructuredData
      id="breadcrumbs-jsonld"
      data={SchemaGenerators.breadcrumbs(fullItems)}
    />
  );
}
