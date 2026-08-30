import { useEffect } from 'react';

export interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show' | 'article' | 'profile';
  canonicalUrl?: string;
  keywords?: string;
  author?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export default function SEOHead({
  title,
  description = 'Discover films, binge-worthy series, official soundtracks, and tailored cinema recommendations on OrangeFlix.',
  image = 'https://orangeflixx.vercel.app/android-chrome-512x512.png',
  url,
  type = 'website',
  canonicalUrl,
  keywords = 'OrangeFlix, Gilbert Tuyambaze, African cinema streaming, Kigali web developer, Rwanda movies, Wakaliwood, Nollywood, Bongo movie, watch series online, free streaming cinema',
  author = 'Gilbert Tuyambaze',
  noindex = false,
  jsonLd,
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Page Title
    const siteTitle = 'OrangeFlix';
    const formattedTitle = title ? `${title} | ${siteTitle}` : 'OrangeFlix — Stream African & Global Cinema, Movies & Series';
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
    setMeta('keywords', keywords);
    setMeta('author', author);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    setMeta('googlebot', noindex ? 'noindex, nofollow' : 'index, follow');

    // 3. OpenGraph Tags
    setMeta('og:title', formattedTitle, true);
    setMeta('og:description', description, true);
    setMeta('og:image', image, true);
    setMeta('og:type', type, true);
    setMeta('og:url', url || window.location.href, true);
    setMeta('og:site_name', 'OrangeFlix', true);

    // 4. Twitter Card Tags
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:site', '@Gilbert_01_TZ');
    setMeta('twitter:creator', '@Gilbert_01_TZ');
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

    // 6. JSON-LD Structured Data
    if (jsonLd) {
      let scriptTag = document.querySelector('script#seo-jsonld') as HTMLScriptElement | null;
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('id', 'seo-jsonld');
        scriptTag.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, image, url, type, canonicalUrl, keywords, author, noindex, jsonLd]);

  return null;
}


