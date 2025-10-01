"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  allowByDefault?: boolean;
}

export default function AuthGuard({
  children,
  requiredPermissions,
  requiredRole,
  allowByDefault = false,
}: AuthGuardProps) {
  const user = useCurrentUser();

  if (!user) {
    if (allowByDefault) {
      return <>{children}</>;
    }
    return null; // Or a loading spinner, or a "not authenticated" message
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

  return null; // Or a "not authorized" message
}
