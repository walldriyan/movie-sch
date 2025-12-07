
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4 relative overflow-hidden">

            {/* Background Gradients - Suno Vibe */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-blue-600/10 rounded-full blur-[80px]" />
            </div>

            <div className="z-10 flex flex-col items-center text-center max-w-2xl px-6">

                {/* Cat Image with Floating Animation */}
                <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 animate-float">
                    {/* Standard Style Tag instead of styled-jsx to avoid server component errors */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(2deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}} />
                    <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-[50px] animate-pulse" />
                    <Image
                        src="/cat.png"
                        alt="Lost Cat"
                        fill
                        className="object-contain drop-shadow-2xl z-10"
                        priority
                    />
                </div>

                {/* Artistic Typography */}
                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                    Lost in the Scene?
                </h1>

                <p className="text-lg md:text-xl text-white/60 mb-8 leading-relaxed font-light">
                    Something went wrong. It seems you've wandered off the script, <br className="hidden md:block" />
                    or perhaps you don't have the <span className="text-purple-400 font-medium">Clearance Card</span> to enter this area.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
                    <Button
                        asChild
                        size="lg"
                        className="rounded-full bg-white text-black hover:bg-gray-200 hover:scale-105 transition-all duration-300 font-bold px-8 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <Home className="w-5 h-5" />
                            Return Home
                        </Link>
                    </Button>

                    <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md px-8 hover:border-white/20 transition-all duration-300"
                    >
                        <Link href="/explore" className="flex items-center gap-2">
                            <ArrowLeft className="w-5 h-5" />
                            Explore Movies
                        </Link>
                    </Button>
                </div>

                <div className="mt-12 text-white/20 text-xs tracking-[0.2em] font-mono">
                    ERROR CODE: 404 • ACCESS DENIED
                </div>

            </div>
        </div>
    );
}