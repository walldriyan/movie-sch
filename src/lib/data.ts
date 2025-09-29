import type { Movie, User, Review, Subtitle } from './types';

const users: User[] = [
  { id: 1, name: 'Alice', avatarUrlId: 'avatar-1' },
  { id: 2, name: 'Bob', avatarUrlId: 'avatar-2' },
  { id: 3, name: 'Charlie', avatarUrlId: 'avatar-3' },
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
    description: `ඩොම් කොබ් යනු අති දක්ෂ සොරෙකි, ඔහු සිහින බෙදාගැනීමේ තාක්‍ෂණය භාවිතා කරමින් ආයතනික රහස් සොරකම් කරයි. "ඔබේ මනස තමයි අපරාධයේ තිප්පොළ." නමුත් මෙවර ඔහුට ලැබෙන්නේ සොරකමකට වඩා භයානක, ප්‍රතිවිරුද්ධ කාර්යයකි: ප්‍රධාන විධායක නිලධියෙකුගේ මනසෙහි අදහසක් පැලපදියම් කිරීම.

මෙම භයානක මෙහෙයුම අතරතුර, ඔහුගේ ශෝකජනක අතීතය නැවතත් මතුවී, මෙම ව්‍යාපෘතිය සහ ඔහුගේ කණ්ඩායමම විනාශයේ අද්දරට ගෙන යයි. ඔවුන් සිහින ලෝකයේ ගැඹුරට, සිහිනයක් තුළ තවත් සිහිනයක් වෙත ගමන් කරන විට, යථාර්ථය සහ මායාව අතර සීමාවන් බොඳ වී යයි. "අපි බිය විය යුත්තේ කාගෙන්දැයි ඔබ මගෙන් ඇසුවොත්, මම කියන්නේ අපටම කියාය."

ඔහුගේ ශෝකජනක අතීතයේ සෙවණැලි ඔහුව හොල්මන් කරන අතර, ඔහුගේ කණ්ඩායමේ ආරක්ෂාව සහ මෙහෙයුමේ සාර්ථකත්වය අතර තෝරා ගැනීමකට ඔහුට බල කෙරෙයි. යථාර්ථය කුමක්ද? සිහිනය කුමක්ද? අවසානයේදී, ඔවුන්ගේ පැවැත්ම පවා ප්‍රශ්නාර්ථයක් බවට පත් වේ.`,
    posterUrlId: 'movie-poster-inception',
    year: 2010,
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    duration: '2h 28m',
    imdbRating: 8.8,
    viewCount: 2300000,
    likes: 120000,
    reviews,
    subtitles,
  },
];

export function getMovieById(id: number): Movie | undefined {
  return movies.find((movie) => movie.id === id);
}

export function getAllMovies(): Movie[] {
  return movies;
}
