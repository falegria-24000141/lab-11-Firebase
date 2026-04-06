// =============================================================================
// AI ACTIONS - Module 5: EventPass Pro
// =============================================================================
//
// ## Educational Note: Server Actions para IA Generativa
//
// Este archivo contiene Server Actions que integran Gemini AI para generar
// contenido de eventos. Usamos Server Actions en lugar de API Routes porque:
//
// 1. **Seguridad**: Las API keys NUNCA llegan al cliente
// 2. **Simplicidad**: No necesitamos crear endpoints REST
// 3. **Type Safety**: TypeScript end-to-end sin serializacion manual
// 4. **Caching**: Next.js puede cachear resultados automaticamente
//
// ### Flujo de Generación con Gemini
//
// ```
// ┌─────────────────────────────────────────────────────────────────────────┐
// │                    FLUJO: CLIENTE → SERVER ACTION → GEMINI              │
// ├─────────────────────────────────────────────────────────────────────────┤
// │                                                                          │
// │   1. Usuario escribe título ────────────────────────────────────────┐    │
// │      "Conferencia de React 2025"                                    │    │
// │                                                                     │
// │   2. Click "Generar con IA" ────────────────────────────────────────┤    │
// │                                                                     │
// │   3. EventForm llama generateEventDetailsAction(title) ─────────────┤    │
// │      (Server Action, ejecuta en el servidor)                        │    │
// │                                                                     │
// │   4. Server Action construye prompt ────────────────────────────────┤    │
// │      + Envía a Gemini API                                           │    │
// │                                                                     │
// │   5. Gemini retorna JSON ───────────────────────────────────────────┤    │
// │      { description, category, tags }                                │    │
// │                                                                     │
// │   6. Server Action parsea y valida ─────────────────────────────────┤    │
// │                                                                     │
// │   7. Retorna datos al cliente ──────────────────────────────────────┘    │
// │      EventForm actualiza campos automáticamente                          │
// │                                                                          │
// └─────────────────────────────────────────────────────────────────────────┘
// ```
//
// ### Prompt Engineering
//
// El prompt está diseñado para:
// 1. Dar contexto claro al modelo (eres un experto en eventos)
// 2. Especificar el formato exacto de salida (JSON)
// 3. Incluir restricciones (categorías válidas, límite de caracteres)
// 4. Pedir respuesta sin formato markdown (solo JSON)
//
// =============================================================================

'use server';

import { getGeminiClient, GEMINI_MODELS } from '@/lib/gemini';
import { EVENT_CATEGORIES } from '@/types/event';

// =============================================================================
// TIPOS DE RESPUESTA
// =============================================================================

export interface GeneratedEventDetails {
    description: string;
    category: string;
    tags: string[];
}

// 🔧 FIX: tipos faltantes
type Tone = 'formal' | 'casual' | 'emocional' | 'corporativo';

interface AIVariantsResponse {
    variants: string[];
}

export async function generateDescriptionVariants(
  title: string, 
  category: string, 
  tone: Tone
): Promise<{ success: boolean; variants?: string[]; error?: string }> {
  
  if (!title || title.length < 3) {
    return { success: false, error: 'El título es demasiado corto.' };
  }

  try {
    // 🔧 FIX: usar client en lugar de función inexistente
    const client = getGeminiClient();
    
    const prompt = `
      Eres un experto en copy de marketing para eventos.
      Genera 3 variantes de descripción para el evento: "${title}" de la categoría "${category}".
      El tono de voz debe ser: ${tone}.
      Cada descripción debe ser persuasiva y tener menos de 500 caracteres.

      Responde ESTRICTAMENTE en este formato JSON:
      {
        "variants": ["descripción 1", "descripción 2", "descripción 3"]
      }
    `;

    const result = await client.models.generateContent({
      model: GEMINI_MODELS.TEXT,
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
    });

    const responseText = result.text || '';

    if (!responseText) {
  return { success: false, error: 'La IA no devolvió contenido.' };
}
    
    let data: AIVariantsResponse;

    try {
      const clean = responseText.replace(/```json|```/g, '').trim();
      data = JSON.parse(clean);
    } catch {
      return { success: false, error: 'Respuesta inválida de la IA.' };
    }

    if (!Array.isArray(data.variants) || data.variants.length !== 3) {
    return { success: false, error: 'La IA no generó exactamente 3 variantes.' };
}
    
    return { 
      success: true, 
      variants: data.variants 
    };

  } catch (error) {
    console.error('Error en AI Action:', error);
    return { success: false, error: 'No se pudieron generar las sugerencias.' };
  }
}

export async function generateEventPosterAction(prompt: string, eventId?: string): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        const client = getGeminiClient();

        // Generate image
        const result = await client.models.generateContent({
            model: GEMINI_MODELS.IMAGE,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `Create a professional, modern, and clean business event poster for: ${prompt}. Style: High-quality photorealistic imagery, elegant typography. Avoid futuristic, sci-fi, or neon aesthetics. 16:9 aspect ratio. Minimal text.` }]
                }
            ],
        });

        const candidates = result.candidates;
        const parts = candidates?.[0]?.content?.parts || [];

        //  buscar imagen correctamente
        const imagePart = parts.find(p => p.inlineData?.data);

        if (!imagePart?.inlineData?.data) {
            console.error('No inlineData in response:', JSON.stringify(parts));
            throw new Error('No image generated');
        }

        const buffer = Buffer.from(imagePart.inlineData.data, 'base64');

        // Upload to storage
        const targetId = eventId || crypto.randomUUID();

        const { uploadPosterToStorage } = await import('@/lib/firebase/storage');
        const imageUrl = await uploadPosterToStorage(targetId, buffer, 'image/png');

        if (!imageUrl) {
            throw new Error('Failed to upload image to storage');
        }

        return { success: true, imageUrl };
    } catch (error) {
        console.error('Gemini Image Generation Error:', error);
        return { success: false, error: 'Failed to generate poster.' };
    }
}