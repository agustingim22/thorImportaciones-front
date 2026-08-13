"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { whatsappUrl } from "@/lib/site";

type Chart = {
  title: string;
  headers: string[];
  rows: string[][];
};

type Category = {
  key: string;
  label: string;
  charts: Chart[];
};

const CATEGORIES: Category[] = [
  {
    key: "futbol",
    label: "Camisetas de fútbol",
    charts: [
      {
        title: "Fan Version",
        headers: ["Talle", "Ancho (cm)", "Largo (cm)", "Altura", "Peso"],
        rows: [
          ["S", "48-50", "69-71", "160-165 cm", "60-65 kg"],
          ["M", "50-52", "71-73", "165-170 cm", "66-70 kg"],
          ["L", "52-54", "73-75", "170-175 cm", "71-75 kg"],
          ["XL", "54-56", "75-77", "175-180 cm", "76-80 kg"],
          ["XXL", "56-58", "77-79", "180-185 cm", "81-87 kg"],
          ["3XL", "58-60", "79-81", "185-190 cm", "88-95 kg"],
          ["4XL", "60-62", "81-83", "190-195 cm", "96-103 kg"],
        ],
      },
      {
        title: "Player Version",
        headers: ["Talle", "Largo (cm)", "Ancho (cm)", "Altura / Peso"],
        rows: [
          ["S", "68-70", "43-45", "160-165 cm / 50-60 kg"],
          ["M", "70-72", "45-47", "165-170 cm / 60-65 kg"],
          ["L", "72-74", "47-49", "170-175 cm / 65-70 kg"],
          ["XL", "74-76", "49-51", "175-180 cm / 70-80 kg"],
          ["XXL", "76-78", "51-53", "180-185 cm / 80-90 kg"],
          ["3XL", "78-80", "53-56", "185-190 cm / 90-100 kg"],
          ["4XL", "82-84", "60", "—"],
        ],
      },
      {
        title: "Retro — manga corta o larga",
        headers: [
          "Talle",
          "Largo (cm)",
          "Ancho pecho (cm)",
          "Manga corta (cm)",
          "Manga larga (cm)",
          "Altura",
          "Peso",
        ],
        rows: [
          ["S", "66-68", "46-48", "36.5", "68-70", "160-165 cm", "50-60 kg"],
          ["M", "68-70", "48-50", "38", "70-72", "165-170 cm", "60-65 kg"],
          ["L", "70-72", "50-52", "39.5", "72-74", "170-175 cm", "65-70 kg"],
          ["XL", "72-74", "52-54", "41", "74-76", "175-180 cm", "70-80 kg"],
          ["XXL", "74-76", "54-56", "42.5", "76-78", "180-185 cm", "80-90 kg"],
        ],
      },
    ],
  },
  {
    key: "otros-deportes",
    label: "NBA y rugby",
    charts: [
      {
        title: "Camiseta NBA (básquet)",
        headers: [
          "Talle",
          "Largo (cm)",
          "Contorno pecho (cm)",
          "Ancho hombros (cm)",
          "Altura / Peso",
        ],
        rows: [
          ["S", "70", "98", "35", "160-170 cm / 45-57 kg"],
          ["M", "72", "106", "37", "168-175 cm / 58-67 kg"],
          ["L", "75", "112", "39", "172-180 cm / 68-82 kg"],
          ["XL", "77", "120", "41", "178-185 cm / 83-92 kg"],
          ["XXL", "80", "130", "44", "183-200 cm / 90-105 kg"],
        ],
      },
      {
        title: "Camiseta de rugby",
        headers: ["Talle", "Largo (cm)", "1/2 Pecho (cm)", "1/2 Cintura (cm)", "Largo manga (cm)"],
        rows: [
          ["S", "71", "52", "49.5", "36.5"],
          ["M", "73", "54", "51.5", "38.5"],
          ["L", "75", "56", "53.5", "40.5"],
          ["XL", "77", "58", "55.5", "42.5"],
          ["XXL", "79", "60", "57.5", "44.5"],
          ["3XL", "81", "62", "59.5", "46.5"],
        ],
      },
    ],
  },
  {
    key: "remeras",
    label: "Remeras y conjuntos",
    charts: [
      {
        title: "Remera casual",
        headers: ["Talle", "Largo (cm)", "1/2 Pecho (cm)", "Hombros (cm)", "Altura (cm)"],
        rows: [
          ["S", "67", "48", "42", "165"],
          ["M", "69", "50", "43", "170"],
          ["L", "71", "51", "44", "175"],
          ["XL", "73", "53", "45", "180"],
          ["XXL", "75", "55", "46", "185"],
        ],
      },
      {
        title: "Polo / conjunto polo",
        headers: ["Talle", "Largo (cm)", "1/2 Pecho (cm)", "Altura (cm)"],
        rows: [
          ["S", "70", "49", "168-172"],
          ["M", "72", "51", "172-178"],
          ["L", "74", "53", "175-178"],
          ["XL", "76", "55", "178-185"],
        ],
      },
      {
        title: "Conjunto deportivo (buzo + pantalón)",
        headers: [
          "Talle",
          "Largo remera (cm)",
          "1/2 Pecho (cm)",
          "Largo pantalón (cm)",
          "Altura",
          "Peso",
        ],
        rows: [
          ["S", "68-71", "50-53", "96-98", "160-170 cm", "50-67 kg"],
          ["M", "71-74", "53-55", "98-101", "171-176 cm", "62-75 kg"],
          ["L", "73-76", "55-58", "101-104", "176-182 cm", "70-80 kg"],
          ["XL", "75-78", "57-60", "104-107", "182-190 cm", "81-90 kg"],
          ["XXL", "77-80", "59-62", "107-110", "195-210 cm", "95-115 kg"],
        ],
      },
      {
        title: "Conjunto de entrenamiento (short)",
        headers: ["Talle", "Largo (cm)", "Contorno pecho (cm)", "Altura", "Peso"],
        rows: [
          ["S", "69", "100", "155-170 cm", "55-65 kg"],
          ["M", "71", "104", "165-175 cm", "60-75 kg"],
          ["L", "73", "108", "170-185 cm", "70-85 kg"],
          ["XL", "75", "112", "180-195 cm", "80-100 kg"],
          ["2XL", "77", "116", "195-210 cm", "95-115 kg"],
        ],
      },
    ],
  },
  {
    key: "pantalones",
    label: "Pantalones y shorts",
    charts: [
      {
        title: "Pantalones y shorts",
        headers: [
          "Talle",
          "Largo (cm)",
          "Ancho cintura (cm)",
          "Cadera (cm)",
          "Muslo (cm)",
          "Contorno pie (cm)",
          "Altura",
        ],
        rows: [
          ["S", "44", "31", "104", "64", "30", "150-159 cm"],
          ["M", "46", "33", "104", "64", "31", "160-169 cm"],
          ["L", "48", "35", "108", "68", "32", "170-179 cm"],
          ["XL", "50", "37", "112", "72", "33", "180-189 cm"],
          ["XXL", "52", "39", "126", "86", "34", "190-199 cm"],
        ],
      },
    ],
  },
  {
    key: "mujer",
    label: "Mujer",
    charts: [
      {
        title: "Camiseta mujer",
        headers: ["Talle", "Largo (cm)", "1/2 Pecho (cm)", "Cintura (cm)", "Altura", "Peso"],
        rows: [
          ["S", "63", "42", "39", "155-165 cm", "40-52 kg"],
          ["M", "66", "44", "41", "165-170 cm", "52-58 kg"],
          ["L", "69", "46", "43", "170-175 cm", "58-65 kg"],
          ["XL", "71", "49", "45", "175-180 cm", "65-70 kg"],
          ["XXL", "73", "52", "48", "180-185 cm", "70-75 kg"],
        ],
      },
    ],
  },
  {
    key: "ninos",
    label: "Niños",
    charts: [
      {
        title: "Camisetas de niños",
        headers: [
          "Talle",
          "Edad",
          "Largo (cm)",
          "1/2 Pecho (cm)",
          "Altura (cm)",
          "Largo pantalón (cm)",
        ],
        rows: [
          ["16", "3-4 años", "42", "33", "95-105", "31"],
          ["18", "4-5 años", "45", "35", "105-115", "33"],
          ["20", "6-7 años", "48", "36.5", "115-125", "35"],
          ["22", "7-8 años", "50", "38", "125-135", "37"],
          ["24", "8-9 años", "55", "42.5", "135-145", "39"],
          ["26", "10-11 años", "59", "44", "145-155", "41"],
          ["28", "12-14 años", "62", "45.5", "155-165", "43"],
        ],
      },
    ],
  },
];

function SizeTable({ chart }: { chart: Chart }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-thor-line bg-thor-paper">
      <div className="border-b border-thor-line px-5 py-3">
        <h3 className="font-body text-sm font-extrabold uppercase tracking-wide text-thor-ink">
          {chart.title}
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left font-mono text-[11px] uppercase tracking-wide text-thor-muted">
            {chart.headers.map((h) => (
              <th key={h} className="whitespace-nowrap px-5 py-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.rows.map((row) => (
            <tr key={row[0]} className="border-t border-thor-line">
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={`whitespace-nowrap px-5 py-3 ${
                    i === 0 ? "font-bold text-thor-gold" : "tabular-nums text-thor-ink"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TallesGuideInner() {
  const params = useSearchParams();
  const requestedCat = params.get("cat");
  const initial = CATEGORIES.find((c) => c.key === requestedCat)?.key ?? CATEGORIES[0].key;
  const [active, setActive] = useState(initial);
  const category = CATEGORIES.find((c) => c.key === active)!;

  return (
    <>
      <div className="border-b border-thor-line bg-thor-cream-2">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <p className="mb-3 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-thor-gold">
            <span className="inline-block h-2 w-2 rotate-45 bg-thor-gold" />
            Antes de comprar
          </p>
          <h1 className="font-display text-4xl tracking-wide text-thor-ink sm:text-5xl">
            Guía de talles
          </h1>
          <p className="mt-3 max-w-xl text-thor-ink-soft">
            Medidas de fábrica, tomadas en plano (no del cuerpo). Pueden variar 1 a 3 cm según la
            prenda. Ante la duda, escribinos y te ayudamos a elegir.
          </p>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="mb-8 flex flex-wrap gap-1 rounded-xl border border-thor-line bg-thor-paper p-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={`rounded-lg px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                active === c.key
                  ? "bg-thor-gold text-thor-ink"
                  : "text-thor-muted hover:text-thor-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {category.charts.map((chart) => (
            <div key={chart.title} className={chart.headers.length > 5 ? "lg:col-span-2" : ""}>
              <SizeTable chart={chart} />
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-thor-muted">
          ¿No estás seguro de tu talle o buscás una medida que no está acá?{" "}
          <a
            href={whatsappUrl("¡Hola Thor! Quería consultar sobre talles.")}
            target="_blank"
            rel="noopener noreferrer"
            className="text-thor-gold underline"
          >
            Escribinos por WhatsApp
          </a>{" "}
          y te ayudamos a elegir antes de comprar.
        </p>
      </section>
    </>
  );
}

export function TallesGuide() {
  return (
    <Suspense fallback={<p className="px-5 py-16 text-center text-thor-muted">Cargando…</p>}>
      <TallesGuideInner />
    </Suspense>
  );
}
