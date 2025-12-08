'use client';

import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaProps {
    onChange: (token: string | null) => void;
}

export default function Captcha({ onChange }: CaptchaProps) {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
        return (
            <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-xl text-red-400 text-sm">
                Error: NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not defined.
            </div>
        );
    }

    return (
        <div className="flex justify-center my-4">
            <ReCAPTCHA
                sitekey={siteKey}
                onChange={onChange}
                theme="dark"
            />
        </div>
    );
}
