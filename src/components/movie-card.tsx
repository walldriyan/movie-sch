import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from './ui/badge';

interface MovieCardProps {
  title: string;
  description: string;
  reason: string;
  posterUrlId: string;
}

export default function MovieCard({ title, description, reason, posterUrlId }: MovieCardProps) {
  const poster = PlaceHolderImages.find((p) => p.id === posterUrlId);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
      {poster && (
        <div className="aspect-[2/3] relative">
          <Image
            src={poster.imageUrl}
            alt={`Poster for ${title}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
            data-ai-hint={poster.imageHint}
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-lg font-headline">{title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
      </CardContent>
      <CardFooter>
        <Badge variant="outline" className="w-full text-center block">
          <span className="font-normal text-muted-foreground mr-1">Why?</span> {reason}
        </Badge>
      </CardFooter>
    </Card>
  );
}
