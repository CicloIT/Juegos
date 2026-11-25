// Puntuación: premia aciertos, rapidez y pocos errores sin castigar demasiado.
export const SCORE = {
  perCorrect: 100,
  perError: 25,
  completeBonus: 500,
  perSecondLeft: 10,
  noErrorsBonus: 300,
  perFixed: 75, // cable mal conectado que se encontró y quitó (nivel experto)
};

export function liveScore(correct, errors, fixed = 0) {
  return Math.max(0, correct * SCORE.perCorrect + fixed * SCORE.perFixed - errors * SCORE.perError);
}

export function finalScore({ correct, errors, timeLeft, completed, fixed = 0 }) {
  let s = liveScore(correct, errors, fixed);
  if (completed) {
    s += SCORE.completeBonus + Math.round(timeLeft) * SCORE.perSecondLeft;
    if (errors === 0) s += SCORE.noErrorsBonus;
  }
  return s;
}
