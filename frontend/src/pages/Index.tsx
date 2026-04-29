import { useState } from "react";
import { motion } from "framer-motion";
import { WeatherBackground, type WeatherType } from "@/components/weather/WeatherBackground";
import SongWeather from "@/components/SongWeather";

const easeOut = [0.16, 1, 0.3, 1] as const;

const Index = () => {
  const [activeWeather, setActiveWeather] = useState<WeatherType>("default");

  return (
    <div className="relative min-h-screen overflow-hidden">
      <WeatherBackground weather={activeWeather} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* ── Header ─────────────────────────────────── */}
        <motion.header
          className="px-8 pt-8 pb-0"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOut }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-5">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  {/* Spinning vinyl disc */}
                  <motion.div
                    className="w-4 h-4 rounded-full border border-primary/60 flex items-center justify-center relative flex-shrink-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                  </motion.div>
                  <span className="font-mono-data text-[10px] tracking-[0.35em] text-muted-foreground uppercase">
                    Forecast.fm
                  </span>
                </div>
              </div>

              {/* Right meta */}
              <div className="hidden md:flex flex-col items-end gap-1">
                <span className="font-mono-data text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  ML-Powered Classification
                </span>
                <span className="font-mono-data text-[10px] text-muted-foreground/45 tracking-wider">
                  Gradient Boosting · 75.8% F1
                </span>
              </div>
            </div>

            {/* Hairline divider */}
            <div className="rule-line" />
          </div>
        </motion.header>

        {/* ── Main ───────────────────────────────────── */}
        <main className="flex-1 flex flex-col justify-center px-8 py-12">
          <div className="max-w-5xl mx-auto w-full">
            {/* Feature component */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.8, ease: easeOut }}
            >
              <SongWeather onWeatherChange={setActiveWeather} />
            </motion.div>
          </div>
        </main>

        {/* ── Footer ─────────────────────────────────── */}
        <motion.footer
          className="px-8 pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="rule-line mb-4" />
            <div className="flex items-center justify-between">
              <p className="font-mono-data text-[10px] text-muted-foreground/60 tracking-wider">
                Built by Daniel Kwan & Ryan Li
              </p>
              <p className="font-mono-data text-[10px] text-muted-foreground/30 tracking-wider hidden md:block">
                Energy · Valence · Tempo · Acousticness · Loudness
              </p>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default Index;
