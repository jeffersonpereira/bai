"use client";

import ProtectedRoute from "../components/ProtectedRoute";
import DashboardSidebar from "../components/DashboardSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <DashboardSidebar />
        <main className="flex-1 min-w-0 bg-slate-50">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
