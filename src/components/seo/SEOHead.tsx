import { useEffect } from 'react';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'article' | 'profile';
  canonicalUrl?: string;
  noindex?: boolean;
}

export default function SEOHead({
  title,
  description = 'Discover films, binge-worthy series, official soundtracks, and tailored cinema recommendations on OrangeFlix.',
  image = 'https://orangeflixx.vercel.app/android-chrome-512x512.png',
  url,
  type = 'website',
  canonicalUrl,
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Page Title
    const siteTitle = 'OrangeFlix';
    const formattedTitle = title ? `${title} | ${siteTitle}` : 'OrangeFlix — Stream Movies & Discover Cinema';
    document.title = formattedTitle;

    // Helper to set or update meta tag
    const setMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // 2. Standard Meta Tags
    setMeta('description', description);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 3. OpenGraph Tags
    setMeta('og:title', formattedTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:type', type, true);
    setMeta('og:url', url || window.location.href, true);
    setMeta('og:site_name', 'OrangeFlix', true);

    // 4. Twitter Card Tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', formattedTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    // 5. Canonical Link
    const targetCanonical = canonicalUrl || url || window.location.href.split('?')[0];
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', targetCanonical);
  }, [title, description, image, url, type, canonicalUrl, noindex]);

  return null;
}

