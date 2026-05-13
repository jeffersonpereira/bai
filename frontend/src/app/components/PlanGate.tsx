"use client";
import Link from "next/link";

interface PlanGateProps {
  hasFeature: boolean;
  featureName: string;
  requiredPlan?: string;
  children: React.ReactNode;
}

export default function PlanGate({
  hasFeature,
  featureName,
  requiredPlan = "Pro",
  children,
}: PlanGateProps) {
  if (hasFeature) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-4">
      <div className="bg-white border border-slate-100 rounded-[3rem] shadow-sm p-12 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3">{featureName}</h2>
        <p className="text-slate-500 text-sm mb-8">
          Este recurso está disponível no plano <span className="font-bold text-blue-600">{requiredPlan}</span> e superiores.
          Faça upgrade para desbloquear.
        </p>
        <Link
          href="/dashboard/cobranca"
          className="inline-block px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 text-sm"
        >
          Ver Planos →
        </Link>
      </div>
    </div>
  );
}
