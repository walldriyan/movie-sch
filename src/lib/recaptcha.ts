'use server';

export async function validateRecaptcha(token: string | null): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        // In development, if no key is set, we might want to bypass (or warn).
        // For safety, let's log error and return false, forcing the user to set it up.
        if (process.env.NODE_ENV === 'development') {
            console.warn('RECAPTCHA_SECRET_KEY is missing. Recaptcha validation passed for development purposes.');
            return true;
        }
        console.error('RECAPTCHA_SECRET_KEY is missing!');
        return false;
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
