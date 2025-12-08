'use server';

export async function validateRecaptcha(token: string | null): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // If secret key is not configured, skip reCAPTCHA validation entirely
    if (!secretKey) {
        console.info('RECAPTCHA_SECRET_KEY is not configured. Skipping reCAPTCHA validation.');
        return true;
    }

    // If bypass token is provided (when site key wasn't configured on client), skip validation
    if (token === '__skip_captcha__') {
        console.info('reCAPTCHA bypass token received. Skipping validation.');
        return true;
    }

    if (!token) {
        console.warn('Recaptcha token is missing');
        return false;
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${secretKey}&response=${token}`,
        });

        const data = await response.json();

        if (!data.success) {
            console.warn('Recaptcha verification failed:', data['error-codes']);
        }

        return data.success;
    } catch (error) {
        console.error('Recaptcha verification error:', error);
        return false;
    }
}
