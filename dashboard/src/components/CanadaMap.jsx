import { useMemo, useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { fmt } from "../utils/formatters.js";

// Simplified province paths (viewBox 0 0 800 500)
const PROVINCE_PATHS = {
  BC: "M60,120 L120,80 L140,140 L130,220 L110,280 L70,300 L50,250 L40,180 Z",
  AB: "M140,100 L190,90 L200,150 L195,250 L185,280 L130,280 L130,220 L140,140 Z",
  SK: "M200,90 L260,85 L265,270 L195,275 L195,250 L200,150 Z",
  MB: "M265,80 L330,90 L340,180 L330,270 L265,270 Z",
  ON: "M340,150 L420,130 L460,170 L470,220 L450,280 L400,300 L360,280 L340,250 L330,200 Z",
  QC: "M460,100 L540,80 L570,130 L560,200 L530,250 L480,260 L460,230 L460,170 Z",
  NB: "M560,180 L590,170 L600,200 L590,230 L565,235 L555,210 Z",
  NS: "M595,200 L630,190 L640,210 L625,235 L600,230 Z",
  PE: "M610,175 L630,170 L635,180 L615,185 Z",
  NL: "M580,60 L630,50 L650,90 L640,130 L600,140 L580,110 Z",
};

// City coordinates on the map (approximate lat/lon mapped to viewBox)
const CITY_COORDS = {
  Toronto: [410, 250], Montreal: [500, 195], Vancouver: [75, 230], Calgary: [155, 200],
  Edmonton: [155, 150], Ottawa: [445, 210], Winnipeg: [300, 200], Mississauga: [405, 255],
  Brampton: [400, 248], Hamilton: [400, 260], Surrey: [80, 240], Laval: [505, 190],
  Halifax: [610, 210], London: [385, 260], Markham: [415, 245], Vaughan: [408, 242],
  Gatineau: [448, 200], Saskatoon: [225, 145], Kitchener: [388, 255], Burnaby: [78, 235],
  Windsor: [365, 275], Regina: [230, 195], Richmond: [77, 238], "Richmond Hill": [412, 240],
  Oakville: [398, 258], Burlington: [395, 262], Oshawa: [425, 248], Barrie: [410, 225],
  "St. Catharines": [408, 268], Cambridge: [390, 258], Kingston: [445, 235], Guelph: [392, 252],
  "Thunder Bay": [340, 180], Waterloo: [387, 253], Brantford: [393, 263], Pickering: [420, 250],
  "Niagara Falls": [410, 270], Peterborough: [430, 230], "Sault Ste. Marie": [360, 195],
  Sarnia: [370, 268], Kelowna: [105, 200], Nanaimo: [65, 215], Kamloops: [100, 180],
  Chilliwack: [85, 240], Victoria: [60, 260], Fredericton: [570, 200], Moncton: [580, 195],
  "Saint John": [565, 215], Lethbridge: [165, 240], "Red Deer": [160, 175],
};

const PROVINCE_NAMES = {
  BC: "British Columbia", AB: "Alberta", SK: "Saskatchewan", MB: "Manitoba",
  ON: "Ontario", QC: "Quebec", NB: "New Brunswick", NS: "Nova Scotia",
  PE: "Prince Edward Island", NL: "Newfoundland",
};

export default function CanadaMap({ dateRange }) {
  const { stores } = useData();
  const [hovered, setHovered] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);

  const provinceData = useMemo(() => {
    const data = {};
    stores.forEach((s) => {
      if (!data[s.province]) data[s.province] = { rev: 0, stores: 0, live: 0 };
      data[s.province].rev += s.rev_7d;
      data[s.province].stores++;
      if (s.status === "live") data[s.province].live++;
    });
    return data;
  }, [stores]);

  const cityData = useMemo(() => {
    const data = {};
    stores.forEach((s) => {
      if (!data[s.city]) data[s.city] = { rev: 0, stores: 0, province: s.province };
      data[s.city].rev += s.rev_7d;
      data[s.city].stores++;
    });
    return data;
  }, [stores]);

  const maxProvRev = Math.max(...Object.values(provinceData).map((p) => p.rev), 1);

  function getProvColor(prov) {
    const d = provinceData[prov];
    if (!d) return "#1f2937";
    const intensity = d.rev / maxProvRev;
    const r = Math.round(99 + intensity * 0);
    const g = Math.round(102 + intensity * (-102 + 196));
    const b = Math.round(241);
    return `rgba(${r}, ${g}, ${b}, ${0.15 + intensity * 0.65})`;
  }

  function getCityRadius(city) {
    const d = cityData[city];
    if (!d) return 0;
    const maxCityRev = Math.max(...Object.values(cityData).map((c) => c.rev), 1);
    return 3 + (d.rev / maxCityRev) * 8;
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wider">Revenue Heatmap — Canada</h3>
      <div className="relative">
        <svg viewBox="0 0 700 350" className="w-full h-auto">
          {/* Province fills */}
          {Object.entries(PROVINCE_PATHS).map(([prov, path]) => (
            <path
              key={prov}
              d={path}
              fill={getProvColor(prov)}
              stroke="#374151"
              strokeWidth="1.5"
              className="transition-all duration-200 cursor-pointer"
              onMouseEnter={() => setHovered(prov)}
              onMouseLeave={() => setHovered(null)}
              style={{ opacity: hovered && hovered !== prov ? 0.4 : 1 }}
            />
          ))}

          {/* Province labels */}
          {Object.entries(PROVINCE_PATHS).map(([prov]) => {
            const d = provinceData[prov];
            if (!d) return null;
            // Approximate center of each province
            const centers = {
              BC: [90, 200], AB: [165, 185], SK: [232, 180], MB: [298, 180],
              ON: [400, 230], QC: [510, 160], NB: [575, 205], NS: [615, 215],
              PE: [622, 178], NL: [615, 95],
            };
            const [cx, cy] = centers[prov] || [0, 0];
            return (
              <text key={`label-${prov}`} x={cx} y={cy} textAnchor="middle" className="text-[9px] font-bold fill-gray-400 pointer-events-none select-none">
                {prov}
              </text>
            );
          })}

          {/* City dots */}
          {Object.entries(CITY_COORDS).map(([city, [cx, cy]]) => {
            const d = cityData[city];
            if (!d) return null;
            const r = getCityRadius(city);
            return (
              <circle
                key={city}
                cx={cx}
                cy={cy}
                r={r}
                fill="#6366f1"
                fillOpacity={0.7}
                stroke="#818cf8"
                strokeWidth="0.5"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredCity(city)}
                onMouseLeave={() => setHoveredCity(null)}
                style={{ transform: hoveredCity === city ? "scale(1.5)" : "scale(1)", transformOrigin: `${cx}px ${cy}px` }}
              />
            );
          })}
        </svg>

        {/* Province tooltip */}
        {hovered && provinceData[hovered] && (
          <div className="absolute top-2 right-2 bg-gray-900/95 border border-gray-700 rounded-lg px-3 py-2 text-xs pointer-events-none">
            <p className="font-semibold text-white">{PROVINCE_NAMES[hovered] || hovered}</p>
            <p className="text-gray-400">{provinceData[hovered].stores} stores · {provinceData[hovered].live} live</p>
            <p className="text-indigo-400 font-medium">{fmt.currency(provinceData[hovered].rev)} rev ({dateRange || "7d"})</p>
          </div>
        )}

        {/* City tooltip */}
        {hoveredCity && cityData[hoveredCity] && (
          <div className="absolute bottom-2 left-2 bg-gray-900/95 border border-gray-700 rounded-lg px-3 py-2 text-xs pointer-events-none">
            <p className="font-semibold text-white">{hoveredCity}, {cityData[hoveredCity].province}</p>
            <p className="text-gray-400">{cityData[hoveredCity].stores} stores</p>
            <p className="text-indigo-400 font-medium">{fmt.currency(cityData[hoveredCity].rev)}</p>
          </div>
        )}
      </div>

      {/* Province legend */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {Object.entries(provinceData)
          .sort((a, b) => b[1].rev - a[1].rev)
          .map(([prov, data]) => (
            <div key={prov} className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: getProvColor(prov) }} />
              <span className="text-gray-400">{prov}</span>
              <span className="text-white font-medium">{fmt.currency(data.rev)}</span>
              <span className="text-gray-600">{data.stores}st</span>
            </div>
          ))}
      </div>
    </div>
  );
}
