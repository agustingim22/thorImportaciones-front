"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPixelEvent } from "@/lib/metaPixel";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/** Registra un PageView cada vez que cambia la ruta (navegación client-side, sin recarga). */
export function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (!PIXEL_ID) return;
    trackPixelEvent("PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];
          // La cola (fbq) queda lista de inmediato, así no se pierde ningún evento, pero el script
          // pesado (fbevents.js, ~270 KB con su configuración) se baja 2,5 s después de que la página
          // terminó de cargar, o antes si la persona interactúa.
          var done=false;
          function load(){if(done)return;done=true;t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}
          ['pointerdown','keydown','scroll','touchstart'].forEach(function(ev){f.addEventListener(ev,load,{once:true,passive:true})});
          function later(){setTimeout(load,2500)}
          if(b.readyState==='complete'){later()}else{f.addEventListener('load',later)}
          }(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          alt=""
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
