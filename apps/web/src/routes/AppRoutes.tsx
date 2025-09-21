import { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { appRoutes } from "./routeConfig";
import { LoadingState } from "../components/ui/LoadingState";

const NotFound = () => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-300">
    <p className="text-lg font-semibold text-slate-100">Puslapis nerastas</p>
    <p className="mt-2 text-sm text-slate-400">
      Patikrinkite adresą arba pasirinkite modulį iš kairėje esančio meniu.
    </p>
  </div>
);

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingState label="Įkeliame modulį" />}>
      <Routes>
        {appRoutes.map((route) => (
          <Route key={route.id} {...route} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
