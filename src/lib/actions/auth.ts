
'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    // The signIn function will automatically handle redirection on success
    // and throw an error on failure, which is caught below.
    await signIn('credentials', Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid email or password.';
        default:
          return 'Something went wrong. Please try again.';
      }
    }
    // Re-throw other errors to be caught by Next.js error boundary
    throw error;
  }
}

export async function doSignOut() {
  await signOut();
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

    // This logic ensures only the first user with the SUPER_ADMIN_EMAIL becomes a super admin.
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
      // For other errors, return a generic message.
      console.error('Registration Error:', error);
      return { message: 'An unexpected error occurred during registration.', input: formInput };
  }

  // After successful registration, redirect to the login page.
  redirect('/login');
}


export async function getSuperAdminEmailForDebug() {
  if (process.env.NODE_ENV === 'development') {
    return process.env.SUPER_ADMIN_EMAIL || null;
  }
  return null;
}
