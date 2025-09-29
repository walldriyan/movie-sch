import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from './ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface MovieCardProps {
  id: number;
  title: string;
  description: string;
  posterUrlId: string;
}

export default function MovieCard({ id, title, posterUrlId }: MovieCardProps) {
  const poster = PlaceHolderImages.find((p) => p.id === posterUrlId);

  return (
    <Link href={`/movies/${id}`} className="group block">
      <Card className="flex flex-col overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:-translate-y-2">
        <div className="aspect-[2/3] relative">
          {poster ? (
            <Image
              src={poster.imageUrl}
              alt={`Poster for ${title}`}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              data-ai-hint={poster.imageHint}
            />
          ) : (
            <div className="bg-muted h-full w-full"></div>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-semibold text-sm truncate group-hover:text-primary">{title}</h3>
        </CardContent>
      </Card>
    </Link>
  );
}
