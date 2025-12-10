'use client';

import { useState } from 'react';

export default function Loading() {
    // Exact URL provided by user
    const logoUrl = 'https://nxxruoipaevhutvxnukg.supabase.co/storage/v1/object/public/Public/loading.png';
    const [imgError, setImgError] = useState(false);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/5 backdrop-blur-[2px] animate-in fade-in duration-200 gap-4">
            {/* Logo Image - Only show if no error */}
            {!imgError && (
                <div className="relative w-24 h-24 mb-2 animate-pulse">
                    <img
                        src={logoUrl}
                        alt="Loading..."
                        className="object-contain w-full h-full opacity-80"
                        onError={() => setImgError(true)}
                    />
                </div>
            )}

            {/* Dots */}
            <div className="flex space-x-2">
                <div className="h-2.5 w-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="h-2.5 w-2.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="h-2.5 w-2.5 bg-primary rounded-full animate-bounce"></div>
            </div>
        </div>
    );
}
