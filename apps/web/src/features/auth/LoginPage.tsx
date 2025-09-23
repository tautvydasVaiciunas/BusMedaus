import { FormEvent, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

const inputClasses =
  "mt-1 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60";

const LoginPage = () => {
  const { login, error, isProcessing } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);

    try {
      await login({ email, password });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Nepavyko prisijungti.");
    }
  };

  const feedback = localError ?? error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl shadow-brand-900/30">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-amber-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900">
            BusMedaus
          </span>
          <h1 className="mt-4 text-2xl font-semibold">Prisijunkite prie valdymo centro</h1>
          <p className="mt-2 text-sm text-slate-400">Naudokite komandos prisijungimo duomenis ir gaukite prieigą prie modulio.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              El. paštas
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={inputClasses}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isProcessing}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              Slaptažodis
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClasses}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isProcessing}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-brand-500 to-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/20 transition hover:from-brand-400 hover:to-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isProcessing}
          >
            {isProcessing ? "Jungiame..." : "Prisijungti"}
          </button>
        </form>

        {feedback ? (
          <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">{feedback}</p>
        ) : null}

        <p className="mt-6 text-center text-xs text-slate-500">
          Prisijungdami sutinkate su saugos politika. Jei pamiršote slaptažodį, kreipkitės į sistemos administratorių.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
