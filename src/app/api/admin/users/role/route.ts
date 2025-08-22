// src/app/api/admin/users/role/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminOrNotFound } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        await requireAdminOrNotFound();

        const body = (await req.json()) as { userId?: string; role?: 'user' | 'admin' };
        if (!body?.userId || (body.role !== 'user' && body.role !== 'admin')) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: body.userId },
            data: { role: body.role, isAdmin: body.role === 'admin' },
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('users/role POST error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}