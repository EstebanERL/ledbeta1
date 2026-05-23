// Banco de preguntas dimensionales para el test de perfil profesional.
// Escala Likert 1..5 → almacenadas en backend y agregadas por dimensión.

export type PreguntaPerfil = {
  id: string;
  dimension:
    | "personalidad" | "preferencias" | "softSkills"
    | "equipo" | "liderazgo" | "comunicacion" | "tecnico";
  texto: string;
};

export const PREGUNTAS_PERFIL: PreguntaPerfil[] = [
  { id: "p1",  dimension: "personalidad",  texto: "Me describiría como una persona reflexiva antes de tomar decisiones importantes." },
  { id: "p2",  dimension: "personalidad",  texto: "Disfruto los entornos cambiantes y con cierta incertidumbre." },
  { id: "p3",  dimension: "preferencias",  texto: "Prefiero trabajar con autonomía y definir mi propio ritmo." },
  { id: "p4",  dimension: "preferencias",  texto: "Me motiva el aprendizaje continuo y los proyectos retadores." },
  { id: "p5",  dimension: "softSkills",    texto: "Manejo bien la presión y los plazos ajustados." },
  { id: "p6",  dimension: "softSkills",    texto: "Adapto mi estilo según la persona o el contexto." },
  { id: "p7",  dimension: "equipo",        texto: "Logro buenos resultados colaborando con personas diversas." },
  { id: "p8",  dimension: "equipo",        texto: "Cuando hay conflicto, busco un punto medio antes que imponer mi postura." },
  { id: "p9",  dimension: "liderazgo",     texto: "Me siento cómodo asumiendo la responsabilidad de un grupo." },
  { id: "p10", dimension: "liderazgo",     texto: "Disfruto desarrollar a otras personas y dar retroalimentación." },
  { id: "p11", dimension: "comunicacion",  texto: "Expreso ideas complejas de forma clara y estructurada." },
  { id: "p12", dimension: "comunicacion",  texto: "Escucho activamente antes de dar mi opinión." },
  { id: "p13", dimension: "tecnico",       texto: "Me entusiasma resolver problemas técnicos o analíticos." },
  { id: "p14", dimension: "tecnico",       texto: "Aprendo nuevas herramientas o tecnologías con facilidad." },
  { id: "p15", dimension: "personalidad",  texto: "Soy constante: termino lo que empiezo aunque cueste." },
];
