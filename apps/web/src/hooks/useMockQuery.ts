import { useEffect, useState } from "react";

type AsyncFactory<T> = () => Promise<T>;

export const useMockQuery = <T,>(key: string, factory: AsyncFactory<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    setIsLoading(true);
    factory()
      .then((result) => {
        if (isSubscribed) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          setError(err instanceof Error ? err : new Error("Nežinoma klaida"));
        }
      })
      .finally(() => {
        if (isSubscribed) {
          setIsLoading(false);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [key, factory]);

  return { data, error, isLoading };
};
