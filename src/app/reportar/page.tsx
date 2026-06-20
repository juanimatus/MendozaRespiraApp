'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Camera, MapPin, Loader2, ChevronLeft, CheckCircle } from 'lucide-react';

import { createReport } from '@/lib/reports';
import type { ReportType } from '@/types';
import { REPORT_TYPE_LABELS } from '@/types';

const TYPES: ReportType[] = ['tocon', 'arbol_talado', 'sospecha'];

type Step = 'form' | 'submitting' | 'success';

export default function ReportarPage() {
  const router = useRouter();

  // Estado del formulario
  const [type, setType]           = useState<ReportType>('tocon');
  const [comment, setComment]     = useState('');
  const [photo, setPhoto]         = useState<File | null>(null);
  const [photoPreview, setPreview] = useState<string | null>(null);
  const [location, setLocation]   = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError]   = useState<string | null>(null);
  const [step, setStep]           = useState<Step>('form');
  const [newReportId, setNewReportId] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── Foto ──────────────────────────────────────────────────────────────
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  // ── Geolocalización ──────────────────────────────────────────────────
  const getLocation = useCallback(() => {
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError('Tu navegador no soporta geolocalización.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error(err);
        setLocError('No se pudo obtener la ubicación. Habilitá el GPS e intentá de nuevo.');
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }, []);

  // ── Envío ─────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo || !location) return;

    setStep('submitting');
    try {
      const id = await createReport({
        lat:     location.lat,
        lng:     location.lng,
        type,
        comment: comment.trim() || undefined,
        photo,
      });
      setNewReportId(id);
      setStep('success');
    } catch (err) {
      console.error(err);
      setStep('form');
      alert('Error al enviar el reporte. Revisá tu conexión e intentá de nuevo.');
    }
  }

  const canSubmit = !!photo && !!location && step === 'form';

  // ── Pantalla de éxito ────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-16 h-16 rounded-full bg-green-900/50 flex items-center justify-center">
          <CheckCircle className="w-9 h-9 text-green-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-stone-100">¡Reporte enviado!</h1>
          <p className="text-stone-400 text-sm max-w-xs">
            Tu reporte ya es parte del mapa ciudadano. Gracias por contribuir.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={() => router.push('/mapa')} className="btn-primary">
            Ver en el mapa
          </button>
          <button onClick={() => { setStep('form'); setPhoto(null); setPreview(null); setLocation(null); setComment(''); }} className="btn-secondary">
            Crear otro reporte
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-stone-800 shrink-0">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-stone-100">Nuevo reporte</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 pb-8">

        {/* ── 1. Foto ────────────────────────────────────────────────── */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-stone-300">
            Foto <span className="text-red-400">*</span>
          </label>

          {photoPreview ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-stone-900">
              <Image src={photoPreview} alt="Preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => { setPhoto(null); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2.5 py-1 rounded-lg"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-stone-700
                         flex flex-col items-center justify-center gap-3
                         text-stone-500 hover:border-green-700 hover:text-green-500
                         transition-colors bg-stone-900/50"
            >
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Tocar para agregar foto</span>
              <span className="text-xs text-stone-600">JPG, PNG, HEIC · Máx 10 MB</span>
            </button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </section>

        {/* ── 2. Tipo ────────────────────────────────────────────────── */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-stone-300">
            Tipo de reporte <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all
                  ${type === t
                    ? 'bg-green-800 border-green-600 text-white'
                    : 'bg-stone-900 border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
              >
                {REPORT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </section>

        {/* ── 3. Ubicación ──────────────────────────────────────────── */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-stone-300">
            Ubicación GPS <span className="text-red-400">*</span>
          </label>

          {location ? (
            <div className="flex items-center gap-3 bg-green-900/30 border border-green-800/50
                            rounded-xl px-4 py-3">
              <MapPin className="w-4 h-4 text-green-400 shrink-0" />
              <div className="text-sm">
                <p className="text-green-300 font-medium">Ubicación capturada</p>
                <p className="text-green-600 font-mono text-xs mt-0.5">
                  {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                </p>
              </div>
              <button
                type="button"
                onClick={getLocation}
                className="ml-auto text-xs text-green-500 hover:text-green-300"
              >
                Actualizar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={getLocation}
              className="w-full flex items-center justify-center gap-2
                         bg-stone-900 border border-stone-700 hover:border-green-700
                         text-stone-300 hover:text-green-400
                         rounded-xl py-3 text-sm font-medium transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Capturar mi ubicación
            </button>
          )}

          {locError && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/40
                          rounded-lg px-3 py-2">
              {locError}
            </p>
          )}
        </section>

        {/* ── 4. Comentario ─────────────────────────────────────────── */}
        <section className="space-y-2">
          <label className="text-sm font-medium text-stone-300">
            Comentario <span className="text-stone-600 font-normal">(opcional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Describí qué viste, cuándo fue, algún dato extra…"
            rows={3}
            maxLength={500}
            className="form-input resize-none"
          />
          <p className="text-right text-xs text-stone-600">{comment.length}/500</p>
        </section>

        {/* ── Enviar ────────────────────────────────────────────────── */}
        <button
          type="submit"
          disabled={!canSubmit || step === 'submitting'}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {step === 'submitting'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando…</>
            : 'Enviar reporte'
          }
        </button>

        {!photo && (
          <p className="text-center text-xs text-stone-600">
            Se requiere foto y ubicación para enviar.
          </p>
        )}
      </form>
    </div>
  );
}
