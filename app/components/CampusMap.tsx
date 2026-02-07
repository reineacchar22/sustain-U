"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

export default function CampusMap() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [-113.5263, 53.5232],
      zoom: 15,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("load", async () => {
      const res = await fetch("/data/study_spaces.geojson");
      const studySpaces = await res.json();

      map.addSource("studySpaces", { type: "geojson", data: studySpaces });

      map.addLayer({
        id: "studySpaces-layer",
        type: "circle",
        source: "studySpaces",
        paint: {
          "circle-radius": 7,
          "circle-color": "#2b7cff",
          "circle-opacity": 0.9,
        },
      });

      map.on("click", "studySpaces-layer", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;

        const name = (feature.properties as any)?.name ?? "Study space";
        const coords = (feature.geometry as any).coordinates as [number, number];

        const routeUrl = `https://www.google.com/maps/dir/?api=1&destination=${coords[1]},${coords[0]}&travelmode=walking`;

        new maplibregl.Popup()
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family: system-ui">
              <strong>${name}</strong><br/>
              <a href="${routeUrl}" target="_blank" rel="noreferrer">Route here (walk)</a>
            </div>
          `)
          .addTo(map);
      });
    });

    mapRef.current = map;
    return () => map.remove();
  }, []);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh" }} />;
}
