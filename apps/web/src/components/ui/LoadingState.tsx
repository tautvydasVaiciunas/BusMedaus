type LoadingStateProps = {
  label?: string;
};

export const LoadingState = ({ label = "Įkeliama" }: LoadingStateProps) => {
  return (
    <div className="flex h-full w-full items-center justify-center p-8 text-slate-300">
      <div className="flex flex-col items-center gap-3 text-center">
        <svg
          className="h-10 w-10 animate-spin text-brand-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p className="text-sm font-medium text-slate-200">{label}</p>
      </div>
    </div>
  );
};
