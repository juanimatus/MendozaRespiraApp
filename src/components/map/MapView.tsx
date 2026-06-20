'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { AnimatePresence } from 'motion/react';
import 'leaflet/dist/leaflet.css';

import { fetchReports } from '@/lib/reports';
import type { ReportWithVerifications } from '@/types';
import { REPORT_TYPE_COLORS } from '@/types';
import ReportDetailModal from '@/components/reports/ReportDetailModal';

// Mendoza ciudad
const MENDOZA_CENTER: [number, number] = [-32.8908, -68.8272];
const DEFAULT_ZOOM = 13;

// Recarga cada 60 segundos para ver nuevos reportes
const REFRESH_INTERVAL_MS = 60_000;

function RecenterButton() {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView(MENDOZA_CENTER, DEFAULT_ZOOM)}
      className="absolute top-4 right-4 z-[999] bg-stone-900 border border-stone-700
                 text-stone-300 hover:text-white text-xs px-3 py-1.5 rounded-lg shadow
                 transition-colors"
      title="Centrar en Mendoza"
    >
      ⊙ Centrar
    </button>
  );
}

export default function MapView() {
  const [reports, setReports]     = useState<ReportWithVerifications[]>([]);
  const [selected, setSelected]   = useState<ReportWithVerifications | null>(null);
  const [loading, setLoading]     = useState(true);

  const loadReports = useCallback(async () => {
    try {
      const data = await fetchReports();
      setReports(data);
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
    const interval = setInterval(loadReports, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadReports]);

  return (
    <>
      {loading && (
        <div className="absolute inset-0 z-[900] flex items-center justify-center bg-stone-950/60 pointer-events-none">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <MapContainer
        center={MENDOZA_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterButton />

        {reports.map((report) => (
          <CircleMarker
            key={report.id}
            center={[report.lat, report.lng]}
            radius={report.status === 'verified' ? 10 : 8}
            pathOptions={{
              color:       REPORT_TYPE_COLORS[report.type],
              fillColor:   REPORT_TYPE_COLORS[report.type],
              fillOpacity: report.status === 'verified' ? 0.9 : 0.6,
              weight:      report.status === 'verified' ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => setSelected(report) }}
          />
        ))}
      </MapContainer>

      {/* Contador de reportes */}
      <div className="absolute top-4 left-4 z-[999] bg-stone-900/90 border border-stone-700
                      text-stone-300 text-xs px-3 py-1.5 rounded-lg shadow pointer-events-none">
        {reports.length} {reports.length === 1 ? 'reporte' : 'reportes'}
      </div>

      {/* Modal de detalle */}
      <AnimatePresence>
        {selected && (
          <ReportDetailModal
            key={selected.id}
            report={selected}
            onClose={() => setSelected(null)}
            onVerified={loadReports}
          />
        )}
      </AnimatePresence>
    </>
  );
}
