import { Link } from 'react-router-dom';
import { BookAdaptation } from '@/services/books-api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink, Sparkles } from 'lucide-react';

interface RelatedBooksProps {
  sourceBook: BookAdaptation | null;
  isLoading?: boolean;
}

export default function RelatedBooks({ sourceBook, isLoading }: RelatedBooksProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-6 animate-pulse space-y-3">
        <div className="h-6 w-48 bg-gray-800 rounded" />
        <div className="h-24 bg-gray-800/60 rounded-xl" />
      </div>
    );
  }

  if (!sourceBook) {
    return null; // Do not invent fake book relationships when none exist
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-400" />
          Literary Source Material & Novel Adaptation
        </h2>
        <Button asChild variant="ghost" size="sm" className="text-xs text-orange-400 hover:text-orange-300">
          <Link to="/books">
            Explore All Adaptations <ExternalLink className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </div>

      <Card className="bg-gray-900/60 border-gray-800 backdrop-blur-xl overflow-hidden hover:border-orange-500/30 transition-all">
        <CardContent className="p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-22 rounded-lg overflow-hidden bg-gray-950 shrink-0 border border-white/10 shadow-md">
              <img
                src={sourceBook.bookCoverUrl}
                alt={sourceBook.bookTitle}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px]">
                  Original Novel
                </Badge>
                {sourceBook.publishYear && (
                  <span className="text-xs text-gray-500">First Published {sourceBook.publishYear}</span>
                )}
              </div>
              <h4 className="text-base font-bold text-white line-clamp-1">{sourceBook.bookTitle}</h4>
              <p className="text-xs text-gray-400">Written by <span className="text-gray-200 font-semibold">{sourceBook.author}</span></p>
              <p className="text-xs text-gray-300 line-clamp-2 max-w-xl pt-0.5">{sourceBook.notes}</p>
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold shrink-0"
          >
            <Link to="/books">
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Source Material Hub
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
