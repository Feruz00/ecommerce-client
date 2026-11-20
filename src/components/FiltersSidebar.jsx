import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api/axios";

function getName(cat) {
  return (
    cat?.translations?.ru?.name ||
    cat?.translations?.en?.name ||
    cat?.name ||
    cat?.slug
  );
}

export default function FiltersSidebar({ categories = [] }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roots = categories.filter((c) => !c.parent_id);

  const { data: facetsData } = useQuery({
    queryKey: ["facets"],
    queryFn: () => api.get("/attributes/facets").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const facets = facetsData?.data?.facets || [];

  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const [selectedCats, setSelectedCats] = useState(() => {
    const c = params.get("category");
    return c ? [c] : [];
  });
  const [featuredOnly, setFeaturedOnly] = useState(
    params.get("featured") === "true",
  );
  const [attrFilters, setAttrFilters] = useState(() => {
    const init = {};
    params.forEach((v, k) => {
      if (k.startsWith("attr_")) init[k.slice(5)] = v;
    });
    return init;
  });

  useEffect(() => {
    const init = {};
    params.forEach((v, k) => {
      if (k.startsWith("attr_")) init[k.slice(5)] = v;
    });
    setAttrFilters(init);
  }, [params]);

  const toggleCat = (id) => {
    setSelectedCats((prev) =>
      prev.includes(String(id))
        ? prev.filter((x) => x !== String(id))
        : [...prev, String(id)],
    );
  };

  const setAttr = (code, value) => {
    setAttrFilters((prev) => {
      const next = { ...prev };
      if (!value) delete next[code];
      else next[code] = value;
      return next;
    });
  };

  const apply = () => {
    const q = new URLSearchParams();
    if (selectedCats[0]) q.set("category", selectedCats[0]);
    if (minPrice) q.set("minPrice", minPrice);
    if (maxPrice) q.set("maxPrice", maxPrice);
    if (featuredOnly) q.set("featured", "true");
    Object.entries(attrFilters).forEach(([code, val]) => {
      if (val) q.set(`attr_${code}`, val);
    });
    navigate(`/products?${q.toString()}`);
  };

  return (
    <aside className="bg-white p-5 rounded-xl border border-slate-200 h-fit sticky top-[88px]">
      <div className="mb-6 pb-5 border-b border-slate-200">
        <h3 className="text-[15px] font-semibold mb-3">Цена, TMT</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="От"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-md text-[13px] outline-none focus:border-primary"
          />
          <span className="text-slate-400">—</span>
          <input
            type="number"
            placeholder="До"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-md text-[13px] outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="mb-6 pb-5 border-b border-slate-200">
        <h3 className="text-[15px] font-semibold mb-3">Категория</h3>
        <div className="space-y-2">
          {roots.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedCats.includes(String(cat.id))}
                onChange={() => toggleCat(cat.id)}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              {getName(cat)}
            </label>
          ))}
        </div>
      </div>

      {facets.map((facet) => (
        <div key={facet.id} className="mb-6 pb-5 border-b border-slate-200">
          <h3 className="text-[15px] font-semibold mb-3">{facet.name}</h3>
          {["select", "color"].includes(facet.type) ? (
            <div className="space-y-2">
              {(facet.options || []).map((o) => (
                <label
                  key={o.id}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`facet_${facet.code}`}
                    checked={attrFilters[facet.code] === o.value}
                    onChange={() => setAttr(facet.code, o.value)}
                    className="text-primary focus:ring-primary"
                  />
                  {facet.type === "color" && o.color_hex && (
                    <span
                      className="inline-block w-3.5 h-3.5 rounded-full border border-slate-200"
                      style={{ background: o.color_hex }}
                    />
                  )}
                  {o.label || o.value}
                </label>
              ))}
              {attrFilters[facet.code] && (
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={() => setAttr(facet.code, "")}
                >
                  Сбросить
                </button>
              )}
            </div>
          ) : facet.type === "boolean" ? (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={attrFilters[facet.code] === "true"}
                onChange={(e) =>
                  setAttr(facet.code, e.target.checked ? "true" : "")
                }
              />
              Да
            </label>
          ) : (
            <input
              type="text"
              value={attrFilters[facet.code] || ""}
              onChange={(e) => setAttr(facet.code, e.target.value)}
              placeholder={facet.name}
              className="w-full p-2 border border-slate-200 rounded-md text-[13px] outline-none focus:border-primary"
            />
          )}
        </div>
      ))}

      <div className="mb-6 pb-5 border-b border-slate-200">
        <h3 className="text-[15px] font-semibold mb-3">Наличие</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={(e) => setFeaturedOnly(e.target.checked)}
            className="rounded border-slate-300 text-primary focus:ring-primary"
          />
          Только хиты
        </label>
      </div>

      <button
        type="button"
        onClick={apply}
        className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-semibold transition-colors"
      >
        Применить фильтры
      </button>
    </aside>
  );
}
