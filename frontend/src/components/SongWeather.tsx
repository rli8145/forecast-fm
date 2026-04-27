import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, AlertCircle } from "lucide-react";
import { WeatherIcon } from "./weather/WeatherIcon";
import type { WeatherType } from "./weather/WeatherBackground";
import { apiService } from "@/services/api-service";

interface SongWeatherProps {
  onWeatherChange: (weather: WeatherType) => void;
}

type SongWeatherType = "sunny" | "cloudy" | "rainy" | "snowy";

interface AudioFeatures {
  energy: number;
  valence: number;
  tempo: number;
  acousticness: number;
  loudness: number;
}

interface SongResult {
  title: string;
  artist: string;
  weather: SongWeatherType;
  confidence: number;
  imageUrl?: string;
  audioFeatures?: AudioFeatures;
}

const WEATHER_COLORS: Record<SongWeatherType, string> = {
  sunny: "hsl(38, 95%, 58%)",
  cloudy: "hsl(215, 18%, 68%)",
  rainy: "hsl(205, 85%, 60%)",
  snowy: "hsl(196, 42%, 85%)",
};

const WEATHER_DESCRIPTIONS: Record<SongWeatherType, string> = {
  sunny: "Best enjoyed beneath open skies and warm afternoon light.",
  cloudy: "Perfect for grey-sky drives and quiet reflection.",
  rainy: "Made for watching rain trace lines down cold glass.",
  snowy: "A soundtrack for still, white, crystalline mornings.",
};

const FEATURE_LABELS: Record<keyof AudioFeatures, string> = {
  energy: "Energy",
  valence: "Valence",
  tempo: "Tempo",
  acousticness: "Acoustic",
  loudness: "Loudness",
};

/* ── Waveform loader ───────────────────────────────────── */
const WaveformLoader = () => {
  const bars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        height: 18 + Math.abs(Math.sin(i * 0.72)) * 65,
        delay: i * 0.048,
      })),
    []
  );

  return (
    <div className="py-8">
      <div className="scan-bar mb-6" />
      <div className="flex items-end gap-px h-14">
        {bars.map((bar, i) => (
          <motion.div
            key={i}
            className="flex-1 bg-primary/35 rounded-sm origin-bottom"
            style={{ height: `${bar.height}%` }}
            animate={{ scaleY: [1, 0.22, 1] }}
            transition={{
              duration: 1.1,
              delay: bar.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-muted-foreground mt-5">
        Scanning audio signal...
      </p>
    </div>
  );
};

/* ── Feature grid ──────────────────────────────────────── */
const FeatureGrid = ({ features }: { features: AudioFeatures }) => (
  <div className="border-t border-border/40 px-6 py-4">
    <p className="font-mono-data text-[9px] tracking-[0.3em] uppercase text-muted-foreground mb-3">
      Audio Features
    </p>
    <div className="flex flex-wrap gap-2">
      {(Object.keys(FEATURE_LABELS) as (keyof AudioFeatures)[]).map((key) => {
        const raw = features[key];
        const display =
          key === "tempo"
            ? `${Math.round(raw)} bpm`
            : key === "loudness"
            ? `${raw.toFixed(1)} dB`
            : raw.toFixed(2);
        return (
          <div key={key} className="feature-pill">
            <span className="font-mono-data text-[8.5px] text-muted-foreground/70 uppercase tracking-wider">
              {FEATURE_LABELS[key]}
            </span>
            <span className="font-mono-data text-xs text-foreground font-medium mt-0.5">
              {display}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

/* ── Main component ────────────────────────────────────── */
export const SongWeather = ({ onWeatherChange }: SongWeatherProps) => {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SongResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const response = await apiService.predictSongWeather(query);
      const songResult: SongResult = {
        title: response.name,
        artist: response.artist,
        weather: response.weather,
        confidence: response.confidence,
        imageUrl: response.image_url || undefined,
        audioFeatures: response.audio_features,
      };
      setResult(songResult);
      onWeatherChange(response.weather);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze song");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="w-full">
      {/* ── Search row ───────────────────────────── */}
      <div className="flex items-end gap-4 mb-2">
        {/* Input */}
        <div className="flex-1">
          <label className="font-mono-data text-[9px] tracking-[0.35em] uppercase text-muted-foreground block mb-3">
            Song Query
          </label>
          <div className="flex items-center gap-3">
            <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <input
              className="terminal-input"
              placeholder='Artist · Title  (e.g. "Adele · Someone Like You")'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        {/* Analyze button */}
        <motion.button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="mb-px px-5 py-2.5 bg-primary text-primary-foreground font-mono-data text-[10px] tracking-[0.22em] uppercase rounded disabled:opacity-35 hover:bg-primary/88 transition-colors flex-shrink-0"
          whileTap={{ scale: 0.97 }}
        >
          {isSearching ? "Scanning…" : "Analyze →"}
        </motion.button>
      </div>

      {/* ── States ───────────────────────────────── */}
      <AnimatePresence mode="wait">

        {/* Loading */}
        {isSearching && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <WaveformLoader />
          </motion.div>
        )}

        {/* Result */}
        {!isSearching && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8"
          >
            {/* Card */}
            <div
              className="rounded-md overflow-hidden border border-border/50"
              style={{
                background: "hsl(var(--card) / 0.82)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex">
                {/* Album art */}
                {result.imageUrl && (
                  <div className="w-36 h-36 md:w-44 md:h-44 flex-shrink-0 relative">
                    <img
                      src={result.imageUrl}
                      alt={result.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Subtle vignette */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 px-6 py-5 flex flex-col justify-between min-w-0">
                  {/* Top: artist + title */}
                  <div>
                    <p className="font-mono-data text-[9.5px] tracking-[0.22em] uppercase text-muted-foreground mb-1 truncate">
                      {result.artist}
                    </p>
                    <h3 className="font-display text-xl md:text-2xl text-foreground leading-tight truncate mb-4">
                      {result.title}
                    </h3>

                    {/* THE BIG REVEAL — weather type */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <WeatherIcon weather={result.weather} size={22} />
                      <motion.span
                        className="weather-readout"
                        style={{
                          color: WEATHER_COLORS[result.weather],
                          fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
                        }}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      >
                        {result.weather.toUpperCase()}
                      </motion.span>
                    </div>
                  </div>

                  {/* Bottom: confidence */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-mono-data text-[9px] tracking-[0.28em] uppercase text-muted-foreground">
                        Confidence
                      </span>
                      <motion.span
                        className="font-mono-data text-xs text-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {(result.confidence * 100).toFixed(1)}%
                      </motion.span>
                    </div>
                    <div className="confidence-bar">
                      <motion.div
                        className="confidence-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${result.confidence * 100}%` }}
                        transition={{ delay: 0.4, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Audio features row */}
              {result.audioFeatures && (
                <FeatureGrid features={result.audioFeatures} />
              )}
            </div>

            {/* Poetic caption */}
            <motion.p
              className="font-mono-data text-[10px] text-muted-foreground/50 tracking-wider mt-3 px-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              — {WEATHER_DESCRIPTIONS[result.weather]}
            </motion.p>
          </motion.div>
        )}

        {/* Error */}
        {!isSearching && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 flex items-start gap-3 p-4 border border-destructive/25 rounded"
          >
            <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="font-mono-data text-xs text-destructive leading-relaxed">{error}</p>
          </motion.div>
        )}

        {/* Empty hint */}
        {!isSearching && !result && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5"
          >
            <p className="font-mono-data text-[10px] text-muted-foreground/45 tracking-wider">
              → Try: "Happy — Pharrell Williams" or "Someone Like You — Adele"
            </p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default SongWeather;
