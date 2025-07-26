// example.ts

import { EdgeTTS, type Voice } from '../src/services/EdgeTTS';
import { mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Función principal asíncrona para ejecutar los ejemplos.
 */
async function main() {
  console.log('🚀 Iniciando demostración de EdgeTTS...');

  // --- 1. Crear directorio de salida ---
  // Es una buena práctica guardar los archivos generados en una carpeta separada.
  const outputDir = join(__dirname, 'output');
  try {
    await mkdir(outputDir, { recursive: true }); // `recursive: true` evita errores si la carpeta ya existe.
    console.log(`📂 Directorio de salida asegurado: ${outputDir}`);
  } catch (error) {
    console.error('Error al crear el directorio de salida:', error);
    return; // Salir si no podemos crear la carpeta
  }
  
  // --- 2. Instanciar la clase ---
  const tts = new EdgeTTS();

  // --- 3. (Opcional) Obtener y listar voces disponibles ---
  // Esto es útil para descubrir qué voces puedes usar.
  let aSpanishVoice: Voice | undefined;
  try {
    console.log('\n🗣️  Obteniendo lista de voces disponibles...');
    const voices = await tts.getVoices();
    console.log(`✅ Se encontraron ${voices.length} voces.`);
    
    // Busquemos una voz en español de México para el segundo ejemplo
    aSpanishVoice = voices.find(v => v.ShortName.startsWith('es-MX'));

    if (aSpanishVoice) {
      console.log(`   -> Voz de ejemplo encontrada para español: ${aSpanishVoice.FriendlyName} (${aSpanishVoice.ShortName})`);
    } else {
      console.log('   -> No se encontró una voz en español de México, el segundo ejemplo usará la voz por defecto.');
    }
  } catch (error) {
    console.error('Error al obtener las voces:', error);
  }

  // --- 4. Sintetizar y Guardar (Ejemplo 1 - Básico en Inglés) ---
  try {
    console.log('\n🎧 Ejemplo 1: Sintetizando texto en inglés con voz por defecto...');
    const text1 = "Hello from Windsurf! This is a test of the text-to-speech synthesis using TypeScript.";
    // La síntesis ocurre en memoria primero
    await tts.synthesize(text1, 'en-US-AnaNeural'); 
    
    // Luego, guardamos el audio de la memoria a un archivo
    // Nota: toFile() ya añade la extensión .mp3
    const outputPath1 = join(outputDir, 'hello_english');
    const finalPath1 = await tts.toFile(outputPath1);
    
    console.log(`✅ ¡Éxito! Audio guardado en: ${finalPath1}`);
  } catch (error) {
    console.error('❌ Error en el Ejemplo 1:', error);
  }

  // --- 5. Sintetizar y Guardar (Ejemplo 2 - Avanzado en Español) ---
  if (aSpanishVoice) {
    try {
      console.log('\n🎧 Ejemplo 2: Sintetizando texto en español con opciones personalizadas...');
      const text2 = "¡Hola desde Windsurf! Esta es una prueba con una voz en español y un tono más agudo.";
      
      await tts.synthesize(text2, aSpanishVoice.ShortName, {
        pitch: '-20Hz',   // Tono más agudo
        rate: '10%',     // Un 10% más lento
        volume: '5%',    // Un 5% más de volumen
      });
      
      const outputPath2 = join(outputDir, 'hola_espanol');
      const finalPath2 = await tts.toFile(outputPath2);

      console.log(`✅ ¡Éxito! Audio guardado en: ${finalPath2}`);
    } catch (error) {
      console.error('❌ Error en el Ejemplo 2:', error);
    }
  }

  console.log('\n🎉 Demostración finalizada.');
}

// Ejecutar la función principal y capturar cualquier error no manejado.
main().catch(error => {
  console.error('Ha ocurrido un error fatal en la ejecución:', error);
});