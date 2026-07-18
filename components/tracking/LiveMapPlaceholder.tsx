"use client";

import dynamic from "next/dynamic";

const LiveTrackingMap = dynamic(() => import("./LiveTrackingMap"), { ssr: false });

/** Legacy placeholder — renders empty live map shell. */
export default function LiveMapPlaceholder() {
  return <LiveTrackingMap restaurant={null} customer={null} rider={null} />;
}
