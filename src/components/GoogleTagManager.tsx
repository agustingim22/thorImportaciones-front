import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/**
 * Google Tag Manager sin bloquear la página. Antes se cargaba "beforeInteractive": un script de ~120 KB
 * que frenaba el arranque en cada visita. Ahora el `dataLayer` se crea de inmediato (los eventos que manda la
 * tienda antes de que cargue el script quedan en cola y GTM los procesa igual) pero el script en sí se
 * descarga 2,5 s después de que la página terminó de cargar, o antes si la persona interactúa (toca, scrollea
 * o tipea). Costo: una visita que se va en menos de ese tiempo sin tocar nada no queda registrada.
 */
export function GoogleTagManagerScript() {
  if (!GTM_ID) return null;
  return (
    <Script id="gtm-script" strategy="afterInteractive">
      {`window.dataLayer=window.dataLayer||[];
window.dataLayer.push({'gtm.start':new Date().getTime(),event:'gtm.js'});
(function(){var done=false;
function load(){if(done)return;done=true;var j=document.createElement('script');j.async=true;
j.src='https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';document.head.appendChild(j);}
['pointerdown','keydown','scroll','touchstart'].forEach(function(e){window.addEventListener(e,load,{once:true,passive:true});});
function later(){setTimeout(load,2500);}
if(document.readyState==='complete'){later();}else{window.addEventListener('load',later);}
})();`}
    </Script>
  );
}

/** Va como primer hijo de <body>. */
export function GoogleTagManagerNoscript() {
  if (!GTM_ID) return null;
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
