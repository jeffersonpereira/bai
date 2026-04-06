"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Spinner from "./ui/Spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Salva a página atual para redirecionar após o login
      router.push(`/login?redirect=${pathname}`);
    } else if (!loading && isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
      // Se tiver papel restrito e o usuário não tiver permissão
      router.push("/");
    }
  }, [loading, isAuthenticated, user, allowedRoles, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Spinner size="lg" />
        <p className="text-slate-400 animate-pulse font-medium">Verificando acesso...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // O useEffect tratará o redirecionamento
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null; // O useEffect tratará o redirecionamento
  }

  return <>{children}</>;
}
