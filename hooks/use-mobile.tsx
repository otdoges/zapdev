import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (typeof window === "undefined") {
      setIsMobile(false)
      return
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    setIsMobile(mql.matches)

    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    // Legacy Safari support
    // @ts-expect-error addListener is deprecated but needed for older browsers
    mql.addListener(onChange)
    // @ts-expect-error removeListener is deprecated but needed for older browsers
    return () => mql.removeListener(onChange)
  }, [])

  return !!isMobile
}
