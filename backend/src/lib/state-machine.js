// Flujo controlado y secuencial de estados de una postulación.
// Solo se permiten las transiciones definidas en TRANSITIONS.

export const ESTADOS = [
  'enviada', 'en_revision', 'evaluacion', 'test_asignado', 'test_completado',
  'entrevista_pendiente', 'entrevista_realizada',
  'aprobado', 'rechazada', 'contratada',
];

/** Próximos estados permitidos por estado actual. */
export const TRANSITIONS = {
  enviada:              ['en_revision', 'rechazada'],
  en_revision:          ['test_asignado', 'entrevista_pendiente', 'rechazada'],
  evaluacion:           ['test_asignado', 'entrevista_pendiente', 'rechazada'],
  test_asignado:        ['test_completado', 'rechazada'],
  test_completado:      ['entrevista_pendiente', 'rechazada'],
  entrevista_pendiente: ['entrevista_realizada', 'rechazada'],
  entrevista_realizada: ['contratada', 'rechazada'],
  aprobado:             ['contratada', 'rechazada'],
  // estados finales:
  contratada:           [],
  rechazada:            [],
};

/** Acciones que ningún Evaluador puede ejecutar (RRHH/Super Admin sí). */
export const ACCIONES_FINALES = new Set(['contratada', 'rechazada']);

export function canTransition(from, to) {
  if (from === to) return true;
  const allowed = TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function isFinal(estado) {
  return estado === 'contratada' || estado === 'rechazada';
}

/** Filtra los estados que un usuario con `role` puede establecer dado el estado actual. */
export function allowedTransitionsFor(role, from) {
  const all = TRANSITIONS[from] || [];
  if (role === 'evaluador') return all.filter((s) => !ACCIONES_FINALES.has(s));
  return all;
}
