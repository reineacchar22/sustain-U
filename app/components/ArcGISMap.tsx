export default function ArcGISMap() {
  return (
    <iframe
      src="https://uofa.maps.arcgis.com/home/webmap/viewer.html?id=8ce2bcf7a1b1456887932b5f4d40b900"
      style={{
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
      loading="lazy"
      referrerPolicy="no-referrer"
      title="UAlberta Campus Map"
    />
  );
}
