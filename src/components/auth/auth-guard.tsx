"use client";

import { useSession } from "next-auth/react";
import type { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  allowByDefault?: boolean;
  fallback?: ReactNode;
}

export default function AuthGuard({
  children,
  requiredPermissions,
  requiredRole,
  allowByDefault = false,
  fallback = null,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const user = session?.user;

  if (status === 'loading') {
    return <>{fallback}</>;
  }

  if (!user) {
    if (allowByDefault) {
      return <>{children}</>;
    }
    return null;
  }

  const hasRole = requiredRole ? user.role === requiredRole : true;
  const hasPermissions = requiredPermissions
    ? requiredPermissions.every((p) => user.permissions?.includes(p))
    : true;

  if (hasRole && hasPermissions) {
    return <>{children}</>;
  }
  
  if (allowByDefault) {
    return <>{children}</>;
  }

  return null;
}
