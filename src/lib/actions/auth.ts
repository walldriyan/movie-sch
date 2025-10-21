
'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { signIn, signOut } from '@/auth';

export async function doSignIn(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    // The signIn function from next-auth will handle the credential verification.
    // Adding redirectTo: '/' ensures a full page reload to the homepage,
    // which correctly updates the client-side session state.
    await signIn('credentials', {
      ...Object.fromEntries(formData),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials. Please check your email and password.';
        default:
          return 'An unknown error occurred. Please try again.';
      }
    }
    // Re-throw other errors to be caught by Next.js's error boundary
    throw error;
  }
}

// This Server Action can be used if you need to perform server-side logic before signing out.
// For a simple sign-out, using the client-side signOut() is often easier and more reliable for UI updates.
export async function doSignOut() {
  await signOut({ redirectTo: '/' });
}

export async function registerUser(
  prevState: { message: string | null; input?: any },
  formData: FormData
): Promise<{ message: string | null; input?: any }> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const formInput = { name, email };

  if (!name || !email || !password) {
    return { message: 'A required field is missing.', input: formInput };
  }
  
  let userRole: Role = Role.USER;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    if (
      process.env.SUPER_ADMIN_EMAIL &&
      email === process.env.SUPER_ADMIN_EMAIL
    ) {
      const existingSuperAdmin = await prisma.user.findFirst({
          where: { role: Role.SUPER_ADMIN }
      });
      if (!existingSuperAdmin) {
          userRole = Role.SUPER_ADMIN;
      }
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

  } catch (error: any) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') { // Unique constraint violation
              return { message: 'An account with this email already exists.', input: formInput };
          }
      }
      console.error('Registration Error:', error);
      return { message: 'An unexpected error occurred during registration.', input: formInput };
  }

  redirect('/login');
}


export async function getSuperAdminEmailForDebug() {
  if (process.env.NODE_ENV === 'development') {
    return process.env.SUPER_ADMIN_EMAIL || null;
  }
  return null;
}
