import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ROLES } from '@/lib/permissions';
import 'dotenv/config';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new NextResponse(JSON.stringify({ message: 'Missing name, email, or password' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new NextResponse(JSON.stringify({ message: 'User with this email already exists' }), { status: 409, headers: { 'Content-Type': 'application/json' } });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let userRole = ROLES.USER;
    if (email === process.env.SUPER_ADMIN_EMAIL) {
      userRole = ROLES.SUPER_ADMIN;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: userRole,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('REGISTRATION_ERROR', error);
    return new NextResponse(
        JSON.stringify({ message: 'Internal Server Error', error: error.message, name: error.name }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
