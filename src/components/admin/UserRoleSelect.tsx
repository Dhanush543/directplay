//src/components/admin/UserRoleSelect.tsx
'use client';

import * as React from 'react';

type Props = {
    userId: string;
    initialRole: 'user' | 'admin';
};

export default function UserRoleSelect({ userId, initialRole }: Props) {
    const [role, setRole] = React.useState<Props['initialRole']>(initialRole);
    const [pending, startTransition] = React.useTransition();

    async function handleChange(next: 'user' | 'admin') {
        const prev = role;
        setRole(next);

        startTransition(async () => {
            try {
                const res = await fetch('/api/admin/users', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: userId, role: next }),
                });

                if (!res.ok) {
                    const err = await safeJson(res);
                    console.error('Failed to update role', err);
                    setRole(prev); // revert on failure
                }
            } catch (e) {
                console.error('Failed to update role', e);
                setRole(prev); // revert on error
            }
        });
    }

    return (
        <select
            name="role"
            value={role}
            onChange={(e) => handleChange(e.target.value as 'user' | 'admin')}
            disabled={pending}
            className="border rounded px-2 py-1 text-sm bg-transparent"
        >
            <option value="user">user</option>
            <option value="admin">admin</option>
        </select>
    );
}

async function safeJson(res: Response) {
    try {
        return await res.json();
    } catch {
        return { error: 'non-json response', status: res.status };
    }
}