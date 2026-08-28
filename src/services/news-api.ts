/**
 * OrangeFlix Entertainment News Adapter
 * Curated cinema, streaming, and trailer news with external attribution and movie entity links.
 */

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: 'Movies' | 'TV' | 'Streaming' | 'Trailers' | 'Awards' | 'Industry';
  imageUrl: string;
  source: string;
  sourceUrl?: string;
  publishedAt: string;
  readTime: string;
  author: string;
  relatedMovieId?: string;
  relatedMovieTitle?: string;
  tags: string[];
}

export interface EntityNewsContext {
  title: string;
  tmdbId?: number;
  mediaType?: 'movie' | 'tv' | string;
  genres?: string[];
  overview?: string;
  backdropUrl?: string;
  posterUrl?: string;
  releaseYear?: number | string;
  cast?: Array<{ name: string; character?: string }>;
}

const ARTICLES_DATABASE: NewsArticle[] = [
  {
    id: 'news-1',
    slug: 'dune-part-three-messiah-filming-updates',
    title: 'Denis Villeneuve Confirms Script Progress for Dune: Messiah',
    summary: 'Director Denis Villeneuve shares insights into the climatic third chapter of the Arrakis saga and its thematic evolution.',
    content: `Denis Villeneuve has officially announced that work on the script for Dune: Messiah is moving swiftly, with production eyeing early 2026 for principal photography. 

Following the massive critical and commercial success of Dune: Part Two, Warner Bros. and Legendary Entertainment gave the green light for the cinematic conclusion of Paul Atreides' journey.

"Messiah will be a different experience altogether," Villeneuve stated in a recent interview. "While Part Two was an epic triumph of destiny and rebellion, Messiah deconstructs the danger of hero worship. It is the story Frank Herbert always intended to be told."

The film will see Timothée Chalamet, Zendaya, and Florence Pugh reprise their roles, alongside several exciting new cast additions to portray the galactic conspiracy unfolding on Arrakis.`,
    category: 'Movies',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    source: 'OrangeFlix Cinema Editorial',
    publishedAt: '2026-08-27T14:30:00Z',
    readTime: '3 min read',
    author: 'Elena Vance',
    relatedMovieId: 'movie-693134',
    relatedMovieTitle: 'Dune: Part Two',
    tags: ['Dune', 'Sci-Fi', 'Denis Villeneuve', 'Timothée Chalamet'],
  },
  {
    id: 'news-2',
    slug: 'christopher-nolan-next-epic-imax-feature',
    title: 'Christopher Nolan Sets Sights on Groundbreaking Next Film Project',
    summary: 'Following Oppenheimer’s Oscar triumph, Christopher Nolan prepares a brand new original screenplay featuring next-gen IMAX cinematography.',
    content: `Fresh off sweeping the Academy Awards with Oppenheimer, Christopher Nolan is currently finalizing his next cinematic venture. Universal Pictures has secured distribution for the mysterious new project, which promises to push large-format IMAX technology into unprecedented territories.

Sources close to production confirm that the filmmaker has designed custom IMAX cameras specifically developed for low-light cinematic photography. While plot details remain closely guarded under standard Nolan secrecy, the film is described as an emotionally charged narrative wrapped in high-concept spectacle.

Release is scheduled for summer 2027, continuing Nolan's storied tradition of revitalizing the theatrical blockbuster season.`,
    category: 'Industry',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80',
    source: 'OrangeFlix Industry Wire',
    publishedAt: '2026-08-25T11:00:00Z',
    readTime: '4 min read',
    author: 'Marcus Sterling',
    tags: ['Christopher Nolan', 'IMAX', 'Cinema', 'Directing'],
  },
  {
    id: 'news-3',
    slug: 'stranger-things-final-season-trailer-breakdown',
    title: 'Stranger Things Final Season: Everything Revealed in the New Teaser',
    summary: 'The battle for Hawkins reaches its boiling point as the Duffer Brothers reveal secrets behind the epic multi-episode finale.',
    content: `The Duffer Brothers have finally unveiled key insights into the final season of Stranger Things. Season 5 picks up immediately after the cataclysmic events of the Upside Down encroaching upon Hawkins.

According to showrunners, every episode of the upcoming season will function with the runtime and scale of a feature film, concluding character arcs that began nearly a decade ago. 

"We are treating every single sequence with the utmost reverence," Matt Duffer noted. "Fans will get the answers they have waited years for, especially regarding the true nature of the Upside Down realm."`,
    category: 'TV',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    source: 'OrangeFlix Series Desk',
    publishedAt: '2026-08-24T09:15:00Z',
    readTime: '5 min read',
    author: 'Chloe Simmons',
    relatedMovieId: 'tv-66732',
    relatedMovieTitle: 'Stranger Things',
    tags: ['Stranger Things', 'TV Series', 'Duffer Brothers', 'Netflix'],
  },
  {
    id: 'news-4',
    slug: 'future-of-4k-uhd-streaming-cinema-trends',
    title: 'The Evolution of High-Bitrate Cinema Streaming in 2026',
    summary: 'How OrangeFlix and modern streaming platforms are bridging the quality gap between theatrical projection and home cinema.',
    content: `As home entertainment setups increasingly feature OLED displays and multi-channel Dolby Atmos systems, streaming delivery standards have undergone a monumental shift.

OrangeFlix has implemented adaptive bitrate streams utilizing the latest AV1 and HEVC codecs, providing visual fidelity that rivals physical 4K UHD Blu-ray discs with near-zero latency.

From enhanced dynamic color grading to uncompressed multi-channel spatial audio, streaming cinema in 2026 is no longer a compromise—it is the modern theatrical experience brought home.`,
    category: 'Streaming',
    imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=800&auto=format&fit=crop&q=80',
    source: 'OrangeFlix Tech & Cinema',
    publishedAt: '2026-08-20T16:45:00Z',
    readTime: '3 min read',
    author: 'Gilbert Tuyambaze',
    tags: ['Streaming', '4K UHD', 'Dolby Atmos', 'Home Theater'],
  },
  {
    id: 'news-5',
    slug: 'academy-awards-2026-early-contenders',
    title: 'Oscars 2026: Early Frontrunners in Best Picture and Cinematography',
    summary: 'A deep look into the festival favorites and international masterworks commanding early awards season conversation.',
    content: `Following standout premieres across Cannes, Venice, and Toronto, film historians and critics have begun identifying the standout contenders for the upcoming 98th Academy Awards.

With an unusually strong year for international cinema and science fiction epics, voting members are faced with an embarrassment of cinematic riches. We break down the performances, visual achievements, and directorial triumphs leading the race.`,
    category: 'Awards',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
    source: 'OrangeFlix Awards Watch',
    publishedAt: '2026-08-18T10:00:00Z',
    readTime: '4 min read',
    author: 'Julian Thorne',
    tags: ['Oscars', 'Academy Awards', 'Best Picture', 'Cinema'],
  },
];

// In-memory cache for dynamically generated entity-specific articles
const dynamicArticlesMap = new Map<string, NewsArticle>();

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function generateDynamicArticles(ctx: EntityNewsContext): NewsArticle[] {
  const isTv = ctx.mediaType === 'tv';
  const category: NewsArticle['category'] = isTv ? 'TV' : 'Movies';
  const baseSlug = createSlug(ctx.title);
  const primaryGenre = ctx.genres?.[0] || (isTv ? 'Drama' : 'Cinema');
  const castHighlight = ctx.cast && ctx.cast.length > 0 
    ? ctx.cast.slice(0, 3).map((c) => c.name).join(', ') 
    : 'an acclaimed ensemble cast';
  const image = ctx.backdropUrl || ctx.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800';
  const relId = ctx.tmdbId ? `${isTv ? 'tv' : 'movie'}-${ctx.tmdbId}` : undefined;

  const articles: NewsArticle[] = [
    {
      id: `news-dyn-${baseSlug}-production`,
      slug: `${baseSlug}-directorial-vision-and-production`,
      title: `Inside "${ctx.title}": Directorial Vision, World-Building, and Craft`,
      summary: `How the creative team behind ${ctx.title} constructed its ${primaryGenre.toLowerCase()} atmosphere, featuring stellar performances from ${castHighlight}.`,
      content: `The creative journey of "${ctx.title}" stands out as one of the most compelling achievements in contemporary ${isTv ? 'television' : 'film'}. 

From its initial development through post-production, the production embraced a distinct aesthetic philosophy rooted in immersive world-building and character-driven storytelling. ${ctx.overview ? `Central to the narrative is the premise: "${ctx.overview}"` : ''}

Featuring magnetic performances by ${castHighlight}, the project harmonizes visual precision with raw emotional resonance. Cinematography choices emphasize intimacy during key character beats while opening up scale during climatic sequences.

Critics have lauded how the production stays true to the tenets of ${primaryGenre} while pushing the storytelling language forward for global streaming audiences.`,
      category,
      imageUrl: image,
      source: 'OrangeFlix Cinema Editorial',
      publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      readTime: '4 min read',
      author: 'Elena Vance',
      relatedMovieId: relId,
      relatedMovieTitle: ctx.title,
      tags: [ctx.title, primaryGenre, isTv ? 'TV Series' : 'Movie', 'Production', 'Behind the Scenes'],
    },
    {
      id: `news-dyn-${baseSlug}-reception`,
      slug: `${baseSlug}-critical-breakdown-and-audience-impact`,
      title: `Critical Breakdown: Why "${ctx.title}" Captivates Global Viewers`,
      summary: `An analytical retrospective on the narrative depth, thematic resonance, and cultural footprint of ${ctx.title}.`,
      content: `Since its debut, "${ctx.title}" has inspired intense discussion among film scholars and entertainment enthusiasts worldwide.

The script deftly weaves themes of identity, high-stakes conflict, and emotional vulnerability. Rather than relying on familiar genre conventions, the creators opted for deliberate pacing and multi-layered subtext.

Audience metrics across OrangeFlix reveal that "${ctx.title}" enjoys exceptional completion rates and replay value, underscoring its enduring impact in an increasingly crowded streaming ecosystem.`,
      category: 'Industry',
      imageUrl: ctx.posterUrl || image,
      source: 'OrangeFlix Industry Wire',
      publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      readTime: '5 min read',
      author: 'Julian Thorne',
      relatedMovieId: relId,
      relatedMovieTitle: ctx.title,
      tags: [ctx.title, 'Analysis', 'Critical Review', 'Streaming'],
    },
    {
      id: `news-dyn-${baseSlug}-craft`,
      slug: `${baseSlug}-cinematography-and-soundtrack-craft`,
      title: `The Audio-Visual Masterclass of "${ctx.title}"`,
      summary: `Exploring how dynamic sound design, orchestral scoring, and color grading elevated ${ctx.title} into a sensory triumph.`,
      content: `Great entertainment is defined by the invisible craftsmanship that guides emotional response. In "${ctx.title}", every acoustic cue and lighting gradient serves a deliberate narrative purpose.

The sound mix alternates between atmospheric restraint and pulse-pounding sonic crescendos, tailored specifically for multi-channel spatial audio setups and high-fidelity headphones alike.

Paired with striking visual compositions that frame characters against evocative environments, "${ctx.title}" demonstrates what modern cinematic craft can achieve when image and sound move in unison.`,
      category: 'Streaming',
      imageUrl: image,
      source: 'OrangeFlix Tech & Cinema',
      publishedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      readTime: '3 min read',
      author: 'Marcus Sterling',
      relatedMovieId: relId,
      relatedMovieTitle: ctx.title,
      tags: [ctx.title, 'Soundtrack', 'Cinematography', 'Sound Design'],
    },
  ];

  // Store in cache
  articles.forEach((art) => {
    dynamicArticlesMap.set(art.slug, art);
    dynamicArticlesMap.set(art.id, art);
  });

  return articles;
}

export const NewsApi = {
  async getNews(): Promise<NewsArticle[]> {
    return this.getArticles();
  },

  async getArticles(category?: string): Promise<NewsArticle[]> {
    const all = [...ARTICLES_DATABASE, ...Array.from(dynamicArticlesMap.values())];
    // Deduplicate by slug
    const unique = Array.from(new Map(all.map((item) => [item.slug, item])).values());
    if (!category || category === 'All') {
      return unique;
    }
    return unique.filter(
      (a) => a.category.toLowerCase() === category.toLowerCase()
    );
  },

  async getArticleBySlug(slug: string): Promise<NewsArticle | null> {
    // 1. Check curated database
    const foundCurated = ARTICLES_DATABASE.find((a) => a.slug === slug);
    if (foundCurated) return foundCurated;

    // 2. Check dynamic cache
    const foundDynamic = dynamicArticlesMap.get(slug);
    if (foundDynamic) return foundDynamic;

    // 3. On-demand generator if slug follows entity pattern
    if (slug.includes('-directorial-vision-and-production') || 
        slug.includes('-critical-breakdown-and-audience-impact') || 
        slug.includes('-cinematography-and-soundtrack-craft')) {
      const rawTitle = slug
        .replace('-directorial-vision-and-production', '')
        .replace('-critical-breakdown-and-audience-impact', '')
        .replace('-cinematography-and-soundtrack-craft', '')
        .replace(/-/g, ' ');
      const title = rawTitle.replace(/\b\w/g, (l) => l.toUpperCase());
      const generated = generateDynamicArticles({ title });
      return generated.find((a) => a.slug === slug) || generated[0] || null;
    }

    return null;
  },

  async getNewsForEntity(context: EntityNewsContext | string): Promise<NewsArticle[]> {
    const ctx: EntityNewsContext = typeof context === 'string' ? { title: context } : context;
    if (!ctx.title) return ARTICLES_DATABASE.slice(0, 3);

    const query = ctx.title.toLowerCase();
    const cleanQuery = ctx.title.split(/[:\-–]/)[0].trim().toLowerCase();

    // 1. Search curated articles
    const curatedMatches = ARTICLES_DATABASE.filter((a) => {
      const matchTitle = a.title.toLowerCase().includes(query) || a.title.toLowerCase().includes(cleanQuery);
      const matchSummary = a.summary.toLowerCase().includes(query) || a.summary.toLowerCase().includes(cleanQuery);
      const matchId = ctx.tmdbId
        ? a.relatedMovieId === `movie-${ctx.tmdbId}` ||
          a.relatedMovieId === `tv-${ctx.tmdbId}` ||
          a.relatedMovieId === String(ctx.tmdbId)
        : false;
      const matchTags = a.tags?.some((t) => t.toLowerCase().includes(cleanQuery)) || false;
      return matchTitle || matchSummary || matchId || matchTags;
    });

    if (curatedMatches.length >= 3) {
      return curatedMatches.slice(0, 3);
    }

    // 2. Generate dynamic rich editorial articles tailored to this exact entity
    const dynamicArticles = generateDynamicArticles(ctx);

    // 3. Combine curated and dynamic
    const combined = [...curatedMatches];
    dynamicArticles.forEach((art) => {
      if (combined.length < 3 && !combined.some((c) => c.slug === art.slug)) {
        combined.push(art);
      }
    });

    return combined.slice(0, 3);
  },

  async searchArticles(query: string): Promise<NewsArticle[]> {
    const q = query.toLowerCase();
    const all = await this.getArticles();
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  },

  getCategories(): string[] {
    return ['All', 'Movies', 'TV', 'Streaming', 'Trailers', 'Awards', 'Industry'];
  },
};
