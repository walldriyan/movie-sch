/*
  ================================================================
  පියවර 2: `cn` Utility Function එක නිර්මාණය කිරීම
  ================================================================
  මෙම function එක මගින්, Tailwind CSS class නම් කිහිපයක් පහසුවෙන්
  එකට සම්බන්ධ කිරීමට (merge) සහ කොන්දේසි වලට අනුව (conditionally) 
  class නම් යෙදීමට හැකියාව ලැබේ. මෙය component එකේ variants 
  (විවිධ පෙනුම්) සෑදීමේදී ඉතාමත් ප්‍රයෝජනවත් වේ.
*/
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
