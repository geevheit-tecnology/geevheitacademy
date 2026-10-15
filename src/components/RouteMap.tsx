export function RouteMap({ progress = 0 }: { progress?: number }) {
  return (
    <div className="route-map">
      <div className="map-caption">
        CORREDOR SUDESTE <span>Mapa ilustrativo • treinamento</span>
      </div>
      <svg
        viewBox="0 0 800 300"
        role="img"
        aria-label="Rota ilustrativa entre São Paulo e Rio de Janeiro"
      >
        <defs>
          <pattern
            id="grid"
            width="30"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 30 0 L 0 0 0 30"
              fill="none"
              stroke="#e1e8e0"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="800" height="300" fill="url(#grid)" />
        <path
          d="M500 0L530 70 590 110 610 180 700 220 800 210V300H430L450 250 420 210 470 160 450 90Z"
          fill="#dbe8e5"
        />
        <g fill="none" stroke="#d1d8cd" strokeWidth="8">
          <path d="M0 60L220 130 400 85 630 180 800 130" />
          <path d="M100 300L210 180 430 160 600 30" />
        </g>
        <path
          d="M160 210C250 200 250 120 360 135S470 210 610 140"
          fill="none"
          stroke="#a7c6b8"
          strokeWidth="14"
        />
        <path
          d="M160 210C250 200 250 120 360 135S470 210 610 140"
          fill="none"
          stroke="#23785e"
          strokeWidth="4"
          strokeDasharray="8 6"
        />
        <circle cx="160" cy="210" r="9" fill="#184f40" />
        <circle cx="610" cy="140" r="9" fill="#184f40" />
        <g fontFamily="sans-serif" fontSize="16" fill="#264a40">
          <text x="120" y="250">
            SÃO PAULO
          </text>
          <text x="560" y="110">
            RIO DE JANEIRO
          </text>
          <text x="320" y="85" fontSize="12" fill="#819088">
            MINAS GERAIS
          </text>
        </g>
        <g
          transform={`translate(${160 + 450 * progress},${190 - 50 * progress})`}
        >
          <rect
            x="-23"
            y="-16"
            width="46"
            height="32"
            rx="10"
            fill="#eff8cd"
            stroke="#184f40"
            strokeWidth="2"
          />
          <text textAnchor="middle" y="6" fontSize="20">
            ▰
          </text>
        </g>
      </svg>
      <div className="map-legend">
        <span>
          <i /> Rota planejada
        </span>
        <span>● Origem / destino</span>
        <span>▰ Veículo de treinamento</span>
      </div>
    </div>
  );
}
