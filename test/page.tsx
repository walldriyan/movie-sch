/*
  ================================================================
  පියවර 4: Reusable Button එක භාවිතා කිරීම
  ================================================================
  අප විසින් නිර්මාණය කරන ලද MyReusableButton component එක import කර,
  එයට විවිධ props (variant සහ size) ලබා දී, විවිධ පෙනුම් සහිත
  buttons කිහිපයක් මෙම පිටුවේ නිර්මාණය කර ඇත.
*/
import { Mail } from "lucide-react";
import { MyReusableButton } from "./components/my-reusable-button";
import Link from 'next/link';

export default function TestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-10 text-foreground">
      <h1 className="text-3xl font-bold font-serif mb-6">Reusable Button Component Test</h1>
      
      <div className="flex flex-wrap items-center justify-center gap-4">
        {/* Default Variant */}
        <MyReusableButton>
          Default Button
        </MyReusableButton>

        {/* Destructive Variant with Icon */}
        <MyReusableButton variant="destructive" size="lg">
          <Mail className="mr-2 h-5 w-5" />
          Destructive Large
        </MyReusableButton>

        {/* Outline Variant (Small) */}
        <MyReusableButton variant="outline" size="sm">
          Outline Small
        </MyReusableButton>

        {/* Ghost Variant (Icon) */}
        <MyReusableButton variant="ghost" size="icon">
          <Mail className="h-5 w-5" />
        </MyReusableButton>

        {/* Secondary Variant */}
        <MyReusableButton variant="secondary">
          Secondary
        </MyReusableButton>

        {/* asChild prop එක Link එකක් ලෙස භාවිතා කිරීම */}
        <MyReusableButton asChild variant="link">
          <Link href="#">
            Link Button
          </Link>
        </MyReusableButton>
      </div>

       <div className="mt-8 text-sm text-muted-foreground">
          <p>මෙම සියලුම buttons එකම component එකකින් (`MyReusableButton`) නිර්මාණය කර ඇත.</p>
        </div>
    </div>
  );
}
