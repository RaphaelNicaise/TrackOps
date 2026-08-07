"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function UmamiAnalytics() {
  const pathname = usePathname();
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const hostUrl = process.env.NEXT_PUBLIC_UMAMI_HOST_URL || "http://localhost:3002";

  if (!websiteId || pathname?.startsWith("/admin")) return null;

  return (
    <Script
      src={`${hostUrl}/script.js`}
      data-website-id={websiteId}
      strategy="lazyOnload"
    />
  );
}
