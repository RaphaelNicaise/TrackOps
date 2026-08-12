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
      const y = window.scrollY;
      if (y > lastScrollY && y > 0) {
        setHidden(true);
      } else if (y < lastScrollY) {
        setHidden(false);
      }
      lastScrollY = y;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-30 transition-transform duration-300 ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } md:translate-y-0`}
      >
        {children}
      </header>
      <div className={`shrink-0 transition-[height] duration-300 md:h-14 ${hidden ? "h-0" : heightClass}`} />
    </>
  );
}
