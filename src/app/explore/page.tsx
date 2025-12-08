import { redirect } from 'next/navigation';

// Redirect /explore to /search as explore functionality is now part of search
export default function ExplorePage() {
    redirect('/search');
}
