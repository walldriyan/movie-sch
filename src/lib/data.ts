import type { Movie, User, Review, Subtitle } from './types';

const users: User[] = [
  { id: 1, name: 'Alice', avatarUrlId: 'avatar-1' },
  { id: 2, name: 'Bob', avatarUrlId: 'avatar-2' },
  { id: 3, name: 'Charlie', avatarUrlId: 'avatar-3' },
  { id: 4, name: 'David', avatarUrlId: 'avatar-4' },
];

const reviews: Review[] = [
  {
    id: 1,
    user: users[0],
    rating: 5,
    comment:
      "A mind-bending masterpiece! The visuals and plot are incredible. A must-watch for any sci-fi fan. Christopher Nolan at his absolute best.",
  },
  {
    id: 2,
    user: users[1],
    rating: 4,
    comment:
      "Complex and thrilling. It took me a second watch to fully grasp everything, but it was well worth it. The acting is superb.",
  },
  {
    id: 3,
    user: users[2],
    rating: 5,
    comment:
      "Absolutely brilliant. The concept of dreams within dreams is executed flawlessly. The ending left me speechless.",
  },
];

const subtitles: Subtitle[] = [
  { id: 1, language: 'English', uploader: 'subtitlepro', price: 0 },
  { id: 2, language: 'Spanish', uploader: 'lingua', price: 1.99 },
  { id: 3, language: 'French', uploader: 'captain_caption', price: 1.99 },
  { id: 4, language: 'German', uploader: 'subtitlepro', price: 2.5 },
];

const movies: Movie[] = [
  {
    id: 1,
    title: 'Inception',
    description: `Dom Cobb is a skilled thief, the absolute best in the dangerous art of extraction, stealing valuable secrets from deep within the subconscious during the dream state, when the mind is at its most vulnerable. Cobb's rare ability has made him a coveted player in this treacherous new world of corporate espionage, but it has also made him an international fugitive and cost him everything he has ever loved. Now Cobb is being offered a chance at redemption. One last job could give him his life back but only if he can accomplish the impossible, inception. Instead of the perfect heist, Cobb and his team of specialists have to pull off the reverse: their task is not to steal an idea, but to plant one. If they succeed, it could be the perfect crime. But no amount of careful planning or expertise can prepare the team for the dangerous enemy that seems to predict their every move. An enemy that only Cobb could have seen coming.`,
    posterUrlId: 'movie-poster-inception',
    galleryImageIds: ['gallery-inception-1', 'gallery-inception-2'],
    year: 2010,
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    duration: '2h 28m',
    imdbRating: 8.8,
    viewCount: 2300000,
    likes: 120000,
    reviews,
    subtitles,
  },
  {
    id: 2,
    title: 'The Dark Knight',
    description: `When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.`,
    posterUrlId: 'movie-poster-dark-knight',
    galleryImageIds: ['gallery-dark-knight-1', 'gallery-dark-knight-2'],
    year: 2008,
    genres: ['Action', 'Crime', 'Drama'],
    duration: '2h 32m',
    imdbRating: 9.0,
    viewCount: 2700000,
    likes: 150000,
    reviews: [
      { id: 4, user: users[0], rating: 5, comment: "A cinematic triumph. Heath Ledger's Joker is iconic." },
      { id: 5, user: users[3], rating: 5, comment: "The best superhero movie ever made. A dark, complex, and unforgettable film." }
    ],
    subtitles,
  },
  {
    id: 3,
    title: 'Interstellar',
    description: `A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.`,
    posterUrlId: 'movie-poster-interstellar',
    galleryImageIds: ['gallery-interstellar-1', 'gallery-interstellar-2'],
    year: 2014,
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    duration: '2h 49m',
    imdbRating: 8.6,
    viewCount: 1900000,
    likes: 110000,
    reviews: [
      { id: 6, user: users[1], rating: 5, comment: "Visually stunning and emotionally powerful. A true sci-fi epic." },
    ],
    subtitles,
  },
  {
    id: 4,
    title: 'Parasite',
    description: `Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.`,
    posterUrlId: 'movie-poster-parasite',
    galleryImageIds: ['gallery-parasite-1', 'gallery-parasite-2'],
    year: 2019,
    genres: ['Thriller', 'Comedy', 'Drama'],
    duration: '2h 12m',
    imdbRating: 8.5,
    viewCount: 850000,
    likes: 95000,
    reviews: [
       { id: 7, user: users[2], rating: 5, comment: "A masterpiece of modern cinema. Perfectly crafted and deeply unsettling." },
    ],
    subtitles,
  },
];

export function getMovieById(id: number): Movie | undefined {
  return movies.find((movie) => movie.id === id);
}

export function getAllMovies(): Movie[] {
  return movies;
}
