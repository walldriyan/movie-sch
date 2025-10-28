
import { getMicroPosts, getSetting } from '@/lib/actions';
import { auth } from '@/auth';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import { ROLES } from '@/lib/permissions';
import WallClient from '@/components/wall-client';

export default async function WallPage() {
  const session = await auth();

  // Check for Micro Post access
  let canAccessMicroPosts = false;
  if (session?.user) {
    if (session.user.role === ROLES.SUPER_ADMIN) {
      canAccessMicroPosts = true;
    } else {
      const allowedGroupsSetting = await getSetting('microPostAllowedGroupIds');
      if (allowedGroupsSetting?.value) {
        const allowedGroupIds = allowedGroupsSetting.value.split(',').filter(Boolean);
        if (allowedGroupIds.length > 0) {
          const userMembershipCount = await prisma.groupMember.count({
            where: {
              userId: session.user.id,
              status: 'ACTIVE',
              groupId: { in: allowedGroupIds },
            },
          });
          canAccessMicroPosts = userMembershipCount > 0;
        }
      }
    }
  }

  if (!canAccessMicroPosts) {
    notFound();
  }

  const microPosts = await getMicroPosts();

  return <WallClient initialMicroPosts={microPosts} />;
}
