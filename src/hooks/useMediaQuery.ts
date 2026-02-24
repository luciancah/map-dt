"use client";

import * as React from "react";

export function useMediaQuery(query: string, defaultValue = false) {
  const [matches, setMatches] = React.useState(defaultValue);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}
