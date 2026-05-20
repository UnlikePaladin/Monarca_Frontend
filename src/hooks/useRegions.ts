import { useEffect, useState } from "react";

type Region = { id: string; name: string };

// Import local JSON at build time so browsers don't need `require`.
import localRegions from "../data/regionsByCountry.json";

export const useRegions = () => {
  const [regionsByCountry, setRegionsByCountry] = useState<Record<string, Region[]>>(localRegions as Record<string, Region[]>);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const url = import.meta.env.VITE_REGIONS_URL as string | undefined;
    if (url) {
      setLoading(true);
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to fetch regions: ${r.status}`);
          return r.json();
        })
        .then((json) => {
          if (mounted) {
            setRegionsByCountry(json as Record<string, Region[]>);
            setLoading(false);
          }
        })
        .catch((e) => {
          if (mounted) {
            // keep localRegions as fallback
            setError(e as Error);
            setLoading(false);
          }
        });
    }

    return () => {
      mounted = false;
    };
  }, []);

  return { regionsByCountry, loading, error } as const;
};
