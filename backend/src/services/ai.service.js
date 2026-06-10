import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-2.5-flash";

function cleanJson(text) {
  return String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

async function genJSON(prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });
  const text = cleanJson(response.text);
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini JSON inválido:", text.slice(0, 400));
    throw new Error("Gemini devolvió un JSON inválido");
  }
}

export async function generateTest({
  tipo,
  categoria,
  nivel,
  cantidad,
  instrucciones,
}) {
  const prompt = `
Genera un test ${tipo}
Nivel: ${nivel}
Categoría: ${categoria}

Cantidad de preguntas: ${cantidad}

${instrucciones || ""}

Devuelve únicamente JSON válido con esta estructura:

{
  "titulo": "",
  "descripcion": "",
  "categoria": "",
  "preguntas": [
    {
      "id": "q1",
      "enunciado": "",
      "tipo": "single",
      "puntaje": 1,
      "opciones": [
        {
          "id": "a",
          "texto": "",
          "correcta": false
        }
      ]
    }
  ]
}
`;
  return genJSON(prompt);
}

/**
 * Analiza compatibilidad candidato ↔ vacante.
 * Retorna { score, fortalezas[], debilidades[], opinion, recomendacion, resumen }.
 */
export async function analizarCompatibilidad({ candidato, vacante, evaluaciones }) {
  const prompt = `
Eres un reclutador senior. Evalúa la compatibilidad entre el candidato y la vacante.
Sé objetivo, profesional y conciso. Responde en español.

CANDIDATO:
${JSON.stringify(candidato, null, 2)}

VACANTE:
${JSON.stringify(vacante, null, 2)}

RESULTADOS DE EVALUACIONES:
${JSON.stringify(evaluaciones || [], null, 2)}

Devuelve ÚNICAMENTE JSON válido con esta estructura exacta:
{
  "score": 0,
  "fortalezas": ["..."],
  "debilidades": ["..."],
  "opinion": "Breve opinión profesional (1-2 frases).",
  "recomendacion": "Recomendación final (1 frase).",
  "resumen": "Resumen breve general."
}

Reglas:
- "score" es un entero de 0 a 100 representando la compatibilidad global.
- Máximo 5 fortalezas y 5 debilidades, frases cortas.
- No inventes datos: si falta información, indícalo como debilidad.
`;
  const out = await genJSON(prompt);
  const score = Math.max(0, Math.min(100, parseInt(out.score, 10) || 0));
  return {
    score,
    fortalezas: Array.isArray(out.fortalezas) ? out.fortalezas.slice(0, 5) : [],
    debilidades: Array.isArray(out.debilidades) ? out.debilidades.slice(0, 5) : [],
    opinion: String(out.opinion || ""),
    recomendacion: String(out.recomendacion || ""),
    resumen: String(out.resumen || ""),
  };
}

/**
 * Recomendaciones IA: para un candidato y una lista de vacantes,
 * devuelve [{ id, score, motivo }] ordenado por afinidad.
 */
export async function recomendarVacantes({ candidato, vacantes }) {
  const compact = vacantes.map((v) => ({
    id: v.id,
    titulo: v.titulo,
    departamento: v.departamento,
    modalidad: v.modalidad,
    ubicacion: v.ubicacion,
    requisitos: (v.requisitos || "").slice(0, 400),
    descripcion: (v.descripcion || "").slice(0, 400),
  }));

  const prompt = `
Eres un sistema de recomendación de empleos. Dado el perfil del candidato
y una lista de vacantes, asigna a cada vacante un puntaje de afinidad 0-100
y un motivo breve (una frase, en español) explicando por qué encaja.

CANDIDATO:
${JSON.stringify(candidato, null, 2)}

VACANTES:
${JSON.stringify(compact, null, 2)}

Devuelve ÚNICAMENTE JSON válido:
{
  "items": [
    { "id": "vacanteId", "score": 0, "motivo": "..." }
  ]
}

Reglas:
- Incluye TODAS las vacantes recibidas (mismo id).
- "score" entero 0-100.
- "motivo" en una frase clara y específica al candidato.
`;
  const out = await genJSON(prompt);
  const items = Array.isArray(out.items) ? out.items : [];
  return items.map((i) => ({
    id: String(i.id),
    score: Math.max(0, Math.min(100, parseInt(i.score, 10) || 0)),
    motivo: String(i.motivo || ""),
  }));
}
