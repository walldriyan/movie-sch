'use client';

import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface CaptchaProps {
    onChange: (token: string | null) => void;
}

export default function Captcha({ onChange }: CaptchaProps) {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    // If no site key configured, hide reCAPTCHA component (no error shown)
    if (!siteKey) {
        // Call onChange with a bypass token so form validation passes
        React.useEffect(() => {
            onChange('__skip_captcha__');
        }, [onChange]);
        return null;
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
