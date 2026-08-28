import { useParams, Link } from 'react-router-dom';
import { usePersonDetails } from '@/hooks/use-tmdb';
import MovieCard from '@/components/MovieCard';
import SEOHead from '@/components/seo/SEOHead';
import StructuredData, { SchemaGenerators } from '@/components/seo/StructuredData';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Calendar,
  MapPin,
  Film,
  Award,
  Sparkles,
  ArrowLeft,
  Tv,
} from 'lucide-react';
import { PROFILE_FALLBACK } from '@/lib/tmdb/images';

export default function PeopleDetail() {
  const { id } = useParams<{ id: string }>();
  const personId = id ? parseInt(id, 10) : undefined;
  const { data: person, isLoading, error } = usePersonDetails(personId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-3" />
        <p className="text-xs text-slate-400">Loading artist profile...</p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold">Talent not found</h1>
        <p className="text-slate-400 text-sm mt-2 mb-6">Unable to retrieve artist information.</p>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link to="/movies">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Movies
          </Link>
        </Button>
      </div>
    );
  }

  const allCredits = [...person.credits.cast, ...person.credits.crew].filter(
    (item, index, self) => self.findIndex((m) => m.id === item.id) === index
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEOHead
        title={`${person.name} — Biography, Movies & Series`}
        description={`Explore the career, biography, and filmography of ${person.name} (${person.knownForDepartment}) on OrangeFlix.`}
        image={person.profilePath || PROFILE_FALLBACK}
      />
      <StructuredData
        id="person-jsonld"
        data={SchemaGenerators.person({
          name: person.name,
          biography: person.biography,
          profileUrl: person.profilePath,
          knownFor: person.knownForDepartment,
        })}
      />

      <div className="page-wrap py-8">
        <Breadcrumbs
          items={[
            { name: 'People & Cast', url: '/movies' },
            { name: person.name, url: `/people/${person.id}` },
          ]}
        />

        {/* Hero Bio Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[.08] bg-gradient-to-br from-[#121829] via-[#090d18] to-[#1a1126] p-6 sm:p-10 mb-10 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            <div className="w-48 h-64 sm:w-56 sm:h-80 rounded-2xl overflow-hidden bg-gray-950 shrink-0 border border-white/10 shadow-2xl">
              <img
                src={person.profilePath || PROFILE_FALLBACK}
                alt={person.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <Badge className="bg-orange-500 text-white font-bold text-xs">
                  {person.knownForDepartment}
                </Badge>
                <Badge variant="outline" className="border-white/10 text-slate-400 text-xs">
                  ⭐ Popularity: {person.popularity.toFixed(1)}
                </Badge>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {person.name}
              </h1>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
                {person.birthday && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400" />
                    Born {new Date(person.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                {person.placeOfBirth && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {person.placeOfBirth}
                  </span>
                )}
              </div>

              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Biography</h3>
                <p className="text-sm text-slate-300 leading-relaxed max-h-44 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                  {person.biography || 'No comprehensive biography available.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filmography Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/[.08] pb-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-orange-400" />
                Filmography & Known For ({allCredits.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Productions featuring {person.name}</p>
            </div>
          </div>

          {allCredits.length === 0 ? (
            <div className="text-center py-12 bg-gray-900/40 rounded-2xl border border-gray-800">
              <p className="text-sm text-slate-400">No credited productions found.</p>
            </div>
          ) : (
            <div className="content-grid">
              {allCredits.map((credit) => (
                <MovieCard key={credit.id} movie={credit} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

