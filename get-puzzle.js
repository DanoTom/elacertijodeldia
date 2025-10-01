// Esta función se ejecuta en un servidor, no en el navegador del usuario.
// Aquí es donde la API Key se usa de forma segura.

exports.handler = async function (event, context) {
    // Solo permitir peticiones POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const dateString = body.date;
        
        // Obtener la API Key de las variables de entorno seguras de Netlify
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            throw new Error("API Key no está configurada en el servidor.");
        }

        const systemPrompt = `Eres un generador de acertijos para un juego llamado 'El Acertijo del Día'. Tu tarea es crear un desafío diario en español basado en la fecha proporcionada.
La respuesta puede ser una palabra o una frase corta (ej. 'Big Ben', 'ADN', 'Vías del tren').
Prioriza las siguientes temáticas al generar el acertijo:
- Países y ciudades. - Tecnología. - Historia (no tan dificil). - Música de los últimos 40 años (rock y pop). - Cine (no tan difícil pero desafiante).

Muy importante: Todas las referencias culturales, especialmente títulos de películas, series o libros, deben usar los nombres con los que son conocidos en Argentina y América Latina. Evita regionalismos de España. Por ejemplo, 'The Matrix' es 'Matrix', no 'La Matriz'; 'Die Hard' es 'Duro de Matar', no 'La Jungla de Cristal'.

Debes proporcionar 5 pistas en orden de dificultad progresiva: la primera muy difícil y abstracta, y la última muy fácil y directa.
La respuesta debe estar en un formato JSON estricto, sin texto adicional antes o después. El JSON debe tener dos claves: "answer" (string) y "clues" (un array de 5 strings).`;
        
        const userQuery = `Genera el acertijo para la fecha: ${dateString}.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userQuery }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (!response.ok) {
            console.error("Error de la API de Google:", await response.text());
            throw new Error("La API de Google no respondió correctamente.");
        }
        
        const result = await response.json();
        const jsonText = result.candidates[0].content.parts[0].text;
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: jsonText
        };

    } catch (error) {
        console.error("Error en la función del servidor:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "No se pudo generar el acertijo." })
        };
    }
};
