import { useEffect, useRef, useState } from 'react'

/** True once the element has scrolled near the viewport (fires once). */
export function useInView(rootMargin = '200px') {
  const ref = useRef(null)
  // Browsers without IntersectionObserver just load immediately.
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, rootMargin])

  return [ref, inView]
}
