// Puntuación: premia cobertura, sectores cubiertos, eficiencia y rapidez.
// Colocar muchos equipos amontonados no suma: se penalizan superposiciones.
export const SCORE = {
  perCoveragePct: 10, // por cada 1% de cobertura
  perSector: 150,
  perUnusedWifi: 250, // equipos Wi-Fi que sobraron (sólo si se completa)
  perOverlap: 150,
  perSecondLeft: 10,
  completeBonus: 500,
};

export function computeScore({ totalPct, sectorsOk, overlaps, unusedWifi = 0, timeLeft = 0, completed = false }) {
  let s = Math.round(totalPct * 100) * SCORE.perCoveragePct + sectorsOk * SCORE.perSector - overlaps * SCORE.perOverlap;
  if (completed) s += SCORE.completeBonus + unusedWifi * SCORE.perUnusedWifi + Math.round(timeLeft) * SCORE.perSecondLeft;
  return Math.max(0, s);
}
