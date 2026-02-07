export default function OfficialUofAMapSeries() {
  return (
    <main style={{ width: "100vw", height: "100vh" }}>
      <iframe
        src="https://uofa.maps.arcgis.com/apps/MapSeries/index.html?appid=790a05b2b5474121822e7e590bdc669e"
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          display: "block",
        }}
        loading="lazy"
        title="UAlberta Map Series"
        allow="geolocation; fullscreen"
      />
    </main>
  );
}
