"use client";

import { useEffect, useState } from "react";

export default function HideOnScroll({
  children,
  heightClass = "h-14",
}: {
  children: React.ReactNode;
  heightClass?: string;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Handle mobile bounce at the top
      if (currentScrollY <= 0) {
        setHidden(false);
        lastScrollY = currentScrollY;
        return;
      }

      // Handle mobile bounce at the bottom
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (currentScrollY >= maxScroll) {
        lastScrollY = currentScrollY;
        return;
      }

      // Calculate scroll difference
      const diff = currentScrollY - lastScrollY;
      
      // Require a minimum scroll distance to trigger hiding/showing
      // This prevents micro-bounces from constantly toggling the navbar
      if (Math.abs(diff) > 5) {
        if (diff > 0) {
          // Scrolling down
          setHidden(true);
        } else {
          // Scrolling up
          setHidden(false);
        }
        lastScrollY = currentScrollY;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 transition-transform duration-300 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } md:translate-y-0`}
    >
      {children}
    </header>
  );
}
