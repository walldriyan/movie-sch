import type { Movie, User, Review, Subtitle } from './types';

const users: User[] = [
  { id: 1, name: 'Alice', avatarUrlId: 'avatar-1' },
  { id: 2, name: 'Bob', avatarUrlId: 'avatar-2' },
  { id: 3, name: 'Charlie', avatarUrlId: 'avatar-3' },
  { id: 4, name: 'David', avatarUrlId: 'avatar-4' },
];

// Hardcoded movie data has been removed.
// The application will now rely on localStorage.
const movies: Movie[] = [];

export function getMovieById(id: number): Movie | undefined {
  // This function is no longer the primary source of data.
  // It's kept for potential fallback logic, but pages now use localStorage.
  const allMovies = getAllMovies();
  return allMovies.find((movie) => movie.id === id);
}

export function getAllMovies(): Movie[] {
  // Returns an empty array. The app should populate this from localStorage.
  // If localStorage is empty, the app starts with no movies.
  return [];
}
