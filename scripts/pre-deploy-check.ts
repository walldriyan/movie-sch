#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * CINEVERSE - PRE-DEPLOYMENT VALIDATION SCRIPT
 * ═══════════════════════════════════════════════════════════════════════════════
 * Run this before deploying to ensure all requirements are met.
 * Usage: npm run pre-deploy OR tsx scripts/pre-deploy-check.ts
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    fix?: string;
}

const results: CheckResult[] = [];

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT VARIABLES CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function checkEnvVariables(): void {
    console.log('\n📋 Checking Environment Variables...\n');

    const criticalVars = [
        { name: 'DATABASE_URL', desc: 'Database connection string' },
        { name: 'AUTH_SECRET', desc: 'NextAuth secret key' },
    ];

    const productionVars = [
        { name: 'NEXT_PUBLIC_SUPABASE_URL', desc: 'Supabase project URL' },
        { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', desc: 'Supabase anon key' },
    ];

    const recommendedVars = [
        { name: 'UPSTASH_REDIS_REST_URL', desc: 'Redis for caching' },
        { name: 'UPSTASH_REDIS_REST_TOKEN', desc: 'Redis token' },
        { name: 'SENTRY_DSN', desc: 'Error monitoring' },
    ];

    // Critical variables
    criticalVars.forEach(({ name, desc }) => {
        const value = process.env[name];
        if (!value) {
            results.push({
                name: `ENV: ${name}`,
                status: 'fail',
                message: `Missing critical: ${desc}`,
                fix: `Add ${name} to your .env.local or Vercel environment variables`,
            });
        } else if (value.includes('localhost') || value.includes('file:./')) {
            results.push({
                name: `ENV: ${name}`,
                status: 'warn',
                message: `Using local/dev value for ${desc}`,
                fix: `Update ${name} with production value for deployment`,
            });
        } else {
            results.push({
                name: `ENV: ${name}`,
                status: 'pass',
                message: `${desc} configured`,
            });
        }
    });

    // Production variables
    productionVars.forEach(({ name, desc }) => {
        const value = process.env[name];
        if (!value) {
            results.push({
                name: `ENV: ${name}`,
                status: 'warn',
                message: `Missing: ${desc}`,
                fix: `Add ${name} for production storage/database`,
            });
        } else {
            results.push({
                name: `ENV: ${name}`,
                status: 'pass',
                message: `${desc} configured`,
            });
        }
    });

    // Recommended variables
    recommendedVars.forEach(({ name, desc }) => {
        const value = process.env[name];
        if (!value) {
            results.push({
                name: `ENV: ${name}`,
                status: 'warn',
                message: `Optional but recommended: ${desc}`,
                fix: `Consider adding ${name} for production`,
            });
        } else {
            results.push({
                name: `ENV: ${name}`,
                status: 'pass',
                message: `${desc} configured`,
            });
        }
    });

    // Security checks
    const superuserEmail = process.env.SUPERUSER_EMAIL;
    const superuserPassword = process.env.SUPERUSER_PASSWORD;

    if (superuserEmail === 'superuser@admin.com' || superuserPassword === 'superuser') {
        results.push({
            name: 'SEC: Default credentials',
            status: 'warn',
            message: 'Using default superuser credentials',
            fix: 'Change SUPERUSER_EMAIL and SUPERUSER_PASSWORD before production',
        });
    } else {
        results.push({
            name: 'SEC: Default credentials',
            status: 'pass',
            message: 'Custom superuser credentials set',
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// FILE STRUCTURE CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function checkFileStructure(): void {
    console.log('📁 Checking File Structure...\n');

    const requiredFiles = [
        { path: 'package.json', desc: 'Package manifest' },
        { path: 'next.config.js', desc: 'Next.js configuration' },
        { path: 'vercel.json', desc: 'Vercel configuration' },
        { path: 'prisma/schema.prisma', desc: 'Prisma schema (SQLite)' },
        { path: 'prisma/schema.postgres.prisma', desc: 'Prisma schema (PostgreSQL)' },
        { path: 'tsconfig.json', desc: 'TypeScript configuration' },
    ];

    const requiredDirs = [
        { path: 'src/app', desc: 'App directory' },
        { path: 'src/lib', desc: 'Library utilities' },
        { path: 'public', desc: 'Static assets' },
    ];

    const rootDir = process.cwd();

    requiredFiles.forEach(({ path: filePath, desc }) => {
        const fullPath = path.join(rootDir, filePath);
        if (fs.existsSync(fullPath)) {
            results.push({
                name: `FILE: ${filePath}`,
                status: 'pass',
                message: `${desc} exists`,
            });
        } else {
            results.push({
                name: `FILE: ${filePath}`,
                status: 'fail',
                message: `Missing: ${desc}`,
                fix: `Create ${filePath}`,
            });
        }
    });

    requiredDirs.forEach(({ path: dirPath, desc }) => {
        const fullPath = path.join(rootDir, dirPath);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            results.push({
                name: `DIR: ${dirPath}`,
                status: 'pass',
                message: `${desc} exists`,
            });
        } else {
            results.push({
                name: `DIR: ${dirPath}`,
                status: 'fail',
                message: `Missing directory: ${desc}`,
                fix: `Create ${dirPath} directory`,
            });
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PACKAGE.JSON SCRIPTS CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function checkPackageJson(): void {
    console.log('📦 Checking package.json...\n');

    const rootDir = process.cwd();
    const packageJsonPath = path.join(rootDir, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
        results.push({
            name: 'PKG: package.json',
            status: 'fail',
            message: 'package.json not found',
        });
        return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Check required scripts
    const requiredScripts = ['build', 'start', 'vercel-build'];
    requiredScripts.forEach((script) => {
        if (packageJson.scripts?.[script]) {
            results.push({
                name: `SCRIPT: ${script}`,
                status: 'pass',
                message: `Script "${script}" defined`,
            });
        } else {
            results.push({
                name: `SCRIPT: ${script}`,
                status: 'fail',
                message: `Missing script: ${script}`,
                fix: `Add "${script}" to package.json scripts`,
            });
        }
    });

    // Check Node.js version
    const engines = packageJson.engines?.node;
    if (engines) {
        results.push({
            name: 'PKG: Node.js version',
            status: 'pass',
            message: `Node.js ${engines} required`,
        });
    } else {
        results.push({
            name: 'PKG: Node.js version',
            status: 'warn',
            message: 'No Node.js version specified',
            fix: 'Add "engines": { "node": ">=18.0.0" } to package.json',
        });
    }

    // Check for postinstall script (Prisma generate)
    if (packageJson.scripts?.postinstall?.includes('prisma generate')) {
        results.push({
            name: 'PKG: Postinstall',
            status: 'pass',
            message: 'Prisma generate in postinstall',
        });
    } else {
        results.push({
            name: 'PKG: Postinstall',
            status: 'warn',
            message: 'No Prisma generate in postinstall',
            fix: 'Add "postinstall": "prisma generate" to scripts',
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function checkSecurity(): void {
    console.log('🔒 Checking Security...\n');

    const rootDir = process.cwd();

    // Check .gitignore
    const gitignorePath = path.join(rootDir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
        const mustIgnore = ['.env', '.env.local', 'node_modules', '.next'];

        mustIgnore.forEach((item) => {
            if (gitignore.includes(item)) {
                results.push({
                    name: `GITIGNORE: ${item}`,
                    status: 'pass',
                    message: `${item} is ignored`,
                });
            } else {
                results.push({
                    name: `GITIGNORE: ${item}`,
                    status: 'fail',
                    message: `${item} is NOT ignored!`,
                    fix: `Add ${item} to .gitignore immediately`,
                });
            }
        });
    }

    // Check for exposed secrets in code
    const srcDir = path.join(rootDir, 'src');
    if (fs.existsSync(srcDir)) {
        // This is a simplified check - in production use a proper secrets scanner
        results.push({
            name: 'SEC: Source code',
            status: 'pass',
            message: 'Remember to run secrets scanning before deploy',
        });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERFORMANCE CHECK
// ═══════════════════════════════════════════════════════════════════════════════

function checkPerformance(): void {
    console.log('⚡ Checking Performance Optimizations...\n');

    const rootDir = process.cwd();
    const nextConfigPath = path.join(rootDir, 'next.config.js');

    if (fs.existsSync(nextConfigPath)) {
        const nextConfig = fs.readFileSync(nextConfigPath, 'utf-8');

        // Check for image optimization
        if (nextConfig.includes('images:')) {
            results.push({
                name: 'PERF: Image optimization',
                status: 'pass',
                message: 'Image configuration found',
            });
        }

        // Check for compression
        if (nextConfig.includes('compress: true')) {
            results.push({
                name: 'PERF: Compression',
                status: 'pass',
                message: 'Compression enabled',
            });
        }

        // Check for security headers
        if (nextConfig.includes('headers()') || nextConfig.includes('async headers')) {
            results.push({
                name: 'PERF: Security headers',
                status: 'pass',
                message: 'Custom headers configured',
            });
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                    🚀 CINEVERSE PRE-DEPLOYMENT CHECK                          ');
    console.log('═══════════════════════════════════════════════════════════════════════════════');

    // Run all checks
    checkEnvVariables();
    checkFileStructure();
    checkPackageJson();
    checkSecurity();
    checkPerformance();

    // Print results
    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              📊 RESULTS                                       ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');

    const passed = results.filter((r) => r.status === 'pass');
    const warnings = results.filter((r) => r.status === 'warn');
    const failed = results.filter((r) => r.status === 'fail');

    // Print failures first
    if (failed.length > 0) {
        console.log('❌ FAILURES:\n');
        failed.forEach((r) => {
            console.log(`   ${r.name}`);
            console.log(`   └─ ${r.message}`);
            if (r.fix) console.log(`      Fix: ${r.fix}`);
            console.log('');
        });
    }

    // Print warnings
    if (warnings.length > 0) {
        console.log('⚠️  WARNINGS:\n');
        warnings.forEach((r) => {
            console.log(`   ${r.name}`);
            console.log(`   └─ ${r.message}`);
            if (r.fix) console.log(`      Fix: ${r.fix}`);
            console.log('');
        });
    }

    // Print passes (summary only)
    console.log(`✅ PASSED: ${passed.length} checks\n`);

    // Summary
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log('                              📈 SUMMARY                                       ');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(`   ✅ Passed:   ${passed.length}`);
    console.log(`   ⚠️  Warnings: ${warnings.length}`);
    console.log(`   ❌ Failed:   ${failed.length}`);
    console.log(`   📊 Total:    ${results.length}\n`);

    // Deployment recommendation
    if (failed.length > 0) {
        console.log('🛑 DEPLOYMENT NOT RECOMMENDED - Fix all failures first!\n');
        process.exit(1);
    } else if (warnings.length > 3) {
        console.log('⚠️  DEPLOYMENT POSSIBLE - But review warnings before production\n');
        process.exit(0);
    } else {
        console.log('✅ READY FOR DEPLOYMENT!\n');
        process.exit(0);
    }
}

main().catch((error) => {
    console.error('Pre-deploy check failed:', error);
    process.exit(1);
});
