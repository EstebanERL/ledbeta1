import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  const text = response.text
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

try {
  return JSON.parse(text);
} catch (err) {
  console.error("Respuesta Gemini:");
  console.log(text);
  throw new Error("Gemini devolvió un JSON inválido");
}
}