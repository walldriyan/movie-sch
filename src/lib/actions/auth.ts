
'use server';

import { signIn, signOut } from '@/auth';
import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { Prisma, Role } from '@prisma/client';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: '/' });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid email or password.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function doSignOut() {
  await signOut({redirect: false});
  redirect('/');
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
    // This basic validation can remain
    return { message: 'A required field is missing.', input: formInput };
  }
  
  // The try-catch block is removed to let Next.js Error Boundary handle it.
  const hashedPassword = await bcrypt.hash(password, 12);

  let userRole: Role = Role.USER;
  if (
    process.env.SUPER_ADMIN_EMAIL &&
    email === process.env.SUPER_ADMIN_EMAIL
  ) {
    // Check if a SUPER_ADMIN already exists
    const existingSuperAdmin = await prisma.user.findFirst({
        where: { role: Role.SUPER_ADMIN }
    });
    if (existingSuperAdmin) {
        // This will be caught by the error boundary
        throw new Error('A SUPER_ADMIN account already exists. Cannot create another.');
    }
    userRole = Role.SUPER_ADMIN;
  }

  // Any error from this `create` call, like a unique constraint violation (P2002),
  // will now be thrown and caught by the nearest `error.js` boundary.
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: userRole,
    },
  });

  redirect('/login');
}


export async function getSuperAdminEmailForDebug() {
  if (process.env.NODE_ENV === 'development') {
    return process.env.SUPER_ADMIN_EMAIL || null;
  }
  return null;
}
