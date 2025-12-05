/**
 * ========================================
 * SITE CONFIGURATION
 * ========================================
 * 
 * This is the SINGLE SOURCE OF TRUTH for all site-wide content.
 * Update this file to change the site name, branding, hero text,
 * footer content, social links, and more.
 * 
 * All components across the app will automatically use these values.
 */

export const siteConfig = {
    // ========================================
    // CORE BRANDING
    // ========================================
    name: "Fiddle",
    tagline: "Learn. Create. Inspire.",
    domain: "fiddle.com",

    // ========================================
    // SEO & META
    // ========================================
    seo: {
        title: "Fiddle - Learn. Create. Inspire.",
        description: "Discover curated content, tutorials, and resources to fuel your creativity and learning journey.",
        keywords: ["education", "magazine", "learning", "tutorials", "creative", "content"],
    },

    // ========================================
    // HERO SECTION (Homepage)
    // ========================================
    hero: {
        headline: "Fuel Your Curiosity",
        subheadline: "Explore. Learn. Grow.",
        description: "Discover curated content, in-depth tutorials, and inspiring resources crafted for curious minds.",
        cta: {
            primary: {
                text: "Start Exploring",
                href: "/explore",
            },
            secondary: {
                text: "Browse Collections",
                href: "/series",
            },
        },
        stats: [
            { label: "Articles", value: "500+", icon: "FileText" },
            { label: "Creators", value: "100+", icon: "Users" },
            { label: "Topics", value: "50+", icon: "Folder" },
        ],
    },

    // ========================================
    // SECTIONS (Homepage)
    // ========================================
    sections: {
        featured: {
            title: "Featured Content",
            subtitle: "Hand-picked articles and resources for you",
        },
        trending: {
            title: "Trending Now",
            subtitle: "What the community is reading",
        },
        creators: {
            title: "Top Creators",
            subtitle: "Meet the minds behind the content",
        },
        collections: {
            title: "Popular Collections",
            subtitle: "Curated groups of related content",
        },
        categories: {
            title: "Browse by Topic",
            subtitle: "Find content that interests you",
        },
    },

    // ========================================
    // NAVIGATION
    // ========================================
    navigation: {
        main: [
            { label: "Home", href: "/", icon: "Home" },
            { label: "Explore", href: "/explore", icon: "Compass" },
            { label: "Movies", href: "/movies", icon: "Clapperboard" },
            { label: "Series", href: "/series", icon: "Tv" },
        ],
        footer: [
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
        ],
    },

    // ========================================
    // SOCIAL LINKS
    // ========================================
    social: {
        twitter: "https://twitter.com/fiddle",
        facebook: "https://facebook.com/fiddle",
        instagram: "https://instagram.com/fiddle",
        youtube: "https://youtube.com/@fiddle",
        linkedin: "https://linkedin.com/company/fiddle",
        discord: "https://discord.gg/fiddle",
    },

    // ========================================
    // FOOTER
    // ========================================
    footer: {
        description: "Your go-to destination for curated content and learning resources. Empowering creators and learners worldwide.",
        copyright: `© ${new Date().getFullYear()} Fiddle. All rights reserved.`,
        columns: [
            {
                title: "Explore",
                links: [
                    { label: "Trending", href: "/" },
                    { label: "Movies", href: "/movies" },
                    { label: "Series", href: "/series" },
                    { label: "Collections", href: "/groups" },
                ],
            },
            {
                title: "Community",
                links: [
                    { label: "Creators", href: "/explore" },
                    { label: "Groups", href: "/groups" },
                    { label: "Feedback", href: "/feedback" },
                ],
            },
            {
                title: "Resources",
                links: [
                    { label: "Help Center", href: "/help" },
                    { label: "Guidelines", href: "/guidelines" },
                    { label: "API", href: "/api-docs" },
                ],
            },
        ],
        contact: {
            email: "hello@fiddle.com",
            address: "123 Creative Lane, Innovation City",
        },
    },

    // ========================================
    // THEME & STYLING
    // ========================================
    theme: {
        primaryColor: "hsl(45, 100%, 51%)", // Warm golden/amber
        accentColor: "hsl(200, 100%, 50%)", // Bright blue
        gradients: {
            hero: "from-amber-500/20 via-orange-500/10 to-rose-500/20",
            card: "from-zinc-900 to-zinc-800",
        },
    },

    // ========================================
    // FEATURES FLAGS
    // ========================================
    features: {
        enableSearch: true,
        enableNotifications: true,
        enableDarkMode: true,
        enableNewsletter: true,
        enableComments: true,
    },
} as const;

// Type export for TypeScript support
export type SiteConfig = typeof siteConfig;
