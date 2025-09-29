export interface User {
  id: number;
  name: string;
  avatarUrlId: string;
}

export interface Review {
  id: number;
  user: User;
  rating: number;
  comment: string;
}

export interface Subtitle {
  id: number;
  language: string;
  uploader: string;
  price: number;
}

export interface Movie {
  id: number;
  title: string;
  description: string[];
  posterUrlId: string;
  galleryImageIds: string[];
  year: number;
  genres: string[];
  duration: string;
  imdbRating: number;
  viewCount: number;
  likes: number;
  reviews: Review[];
  subtitles: Subtitle[];
}
