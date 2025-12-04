export const STORAGE_CONFIG = {
    // The URL prefix for accessing images on the client
    // For local: '/uploads'
    // For Supabase: 'https://<project>.supabase.co/storage/v1/object/public/<bucket>'
    publicUrlPrefix: process.env.NEXT_PUBLIC_STORAGE_URL_PREFIX || '/uploads',

    // The local file system path for saving images (only used if provider is 'local')
    localRoot: process.env.LOCAL_STORAGE_ROOT || 'public/uploads',

    // 'local' or 'supabase'
    provider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 'supabase',

    // Supabase Configuration
    supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        bucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'uploads',
    }
};
