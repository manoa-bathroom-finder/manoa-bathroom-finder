
"use client";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";

export default function LeafletMap() {
  return (
    <MapContainer
      center={[21.298476, -157.817423]}
      zoom={102}
      scrollWheelZoom={true}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <CircleMarker
        center={[21.298476, -157.817423]}
        radius={10}
        pathOptions={{ color: "red" }}
      >
        <Popup>
          Test text
        </Popup>
      </CircleMarker>
    </MapContainer>
  );
}
