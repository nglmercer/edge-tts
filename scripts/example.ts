// example.ts
import { EdgeTTS, type Voice } from '../src/services/EdgeTTS';
import { mkdir, access } from 'fs/promises';
import { join } from 'path';

/**
 * Utilidad para colorear la salida de consola
 */
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test de validaciones de pitch
 */
async function testPitchValidation(tts: EdgeTTS) {
  log('\n🧪 Probando validaciones de PITCH...', 'cyan');
  
  const pitchTests = [
    { value: 0, expected: '+0Hz', description: 'Pitch número 0' },
    { value: 50, expected: '+50Hz', description: 'Pitch número positivo' },
    { value: -30, expected: '-30Hz', description: 'Pitch número negativo' },
    { value: '+25Hz', expected: '+25Hz', description: 'Pitch string positivo' },
    { value: '-45Hz', expected: '-45Hz', description: 'Pitch string negativo' },
    { value: '12.5Hz', expected: '12.5Hz', description: 'Pitch decimal' },
  ];

  for (const test of pitchTests) {
    try {
      await tts.synthesize('Test pitch', 'en-US-AnaNeural', { pitch: test.value });
      log(`  ✅ ${test.description}: ${test.value} -> ${test.expected}`, 'green');
    } catch (error) {
      log(`  ❌ ${test.description}: Error - ${error instanceof Error ? error.message : error}`, 'red');
    }
  }
}

/**
 * Test de validaciones de rate
 */
async function testRateValidation(tts: EdgeTTS) {
  log('\n🧪 Probando validaciones de RATE...', 'cyan');
  
  const rateTests = [
    { value: 0, expected: '+0%', description: 'Rate número 0' },
    { value: 50, expected: '+50%', description: 'Rate número positivo' },
    { value: -20, expected: '-20%', description: 'Rate número negativo' },
    { value: '100%', expected: '+100%', description: 'Rate string positivo' },
    { value: '-25%', expected: '-25%', description: 'Rate string negativo' },
    { value: '150.5%', expected: '+150.5%', description: 'Rate decimal' },
  ];

  for (const test of rateTests) {
    try {
      await tts.synthesize('Test rate', 'en-US-AnaNeural', { rate: test.value });
      log(`  ✅ ${test.description}: ${test.value} -> ${test.expected}`, 'green');
    } catch (error) {
      log(`  ❌ ${test.description}: Error - ${error instanceof Error ? error.message : error}`, 'red');
    }
  }
}

/**
 * Test de validaciones de volume
 */
async function testVolumeValidation(tts: EdgeTTS) {
  log('\n🧪 Probando validaciones de VOLUME...', 'cyan');
  
  const volumeTests = [
    { value: 0, expected: '0%', description: 'Volume número 0' },
    { value: 50, expected: '50%', description: 'Volume número válido' },
    { value: '100%', expected: '100%', description: 'Volume string válido' },
    { value: 150, expected: '150%', description: 'Volume mayor a 100%' },
    { value: -100, expected: '-100%', description: 'Volume negativo' },
  ];

  const invalidVolumeTests = [
    { value: -110, description: 'Volume número negativo mayor a -100%' },
    { value: '-120%', description: 'Volume string negativo mayor a -100%' },
  ];

  // Tests válidos
  for (const test of volumeTests) {
    try {
      await tts.synthesize('Test volume', 'en-US-AnaNeural', { volume: test.value });
      log(`  ✅ ${test.description}: ${test.value} -> ${test.expected}`, 'green');
    } catch (error) {
      log(`  ❌ ${test.description}: Error - ${error instanceof Error ? error.message : error}`, 'red');
    }
  }

  // Tests que deben fallar
  for (const test of invalidVolumeTests) {
    try {
      await tts.synthesize('Test volume', 'en-US-AnaNeural', { volume: test.value });
      log(`  ❌ ${test.description}: Debería haber fallado pero no lo hizo`, 'red');
    } catch (error) {
      log(`  ✅ ${test.description}: Correctamente rechazado - ${error instanceof Error ? error.message : error}`, 'green');
    }
  }
}

/**
 * Test de síntesis con diferentes combinaciones
 */
async function testSynthesisCombinations(tts: EdgeTTS, outputDir: string) {
  log('\n🧪 Probando combinaciones de síntesis...', 'cyan');
  
  const combinations = [
    {
      name: 'basic_english',
      text: 'Hello world, this is a basic test.',
      voice: 'en-US-AnaNeural',
      options: {},
      description: 'Síntesis básica sin opciones'
    },
    {
      name: 'modified_pitch',
      text: 'This text has a modified pitch.',
      voice: 'en-US-AnaNeural',
      options: { pitch: '+50Hz' },
      description: 'Solo pitch modificado'
    },
    {
      name: 'modified_rate',
      text: 'This text has a slower rate of speech.',
      voice: 'en-US-AnaNeural',
      options: { rate: '-30%' },
      description: 'Solo rate modificado'
    },
    {
      name: 'modified_volume',
      text: 'This text has increased volume.',
      voice: 'en-US-AnaNeural',
      options: { volume: '120%' },
      description: 'Solo volumen modificado'
    },
    {
      name: 'all_modified',
      text: 'This text has all parameters modified for a dramatic effect.',
      voice: 'en-US-AnaNeural',
      options: { pitch: '-20Hz', rate: '+25%', volume: '90%' },
      description: 'Todos los parámetros modificados'
    }
  ];

  for (const combo of combinations) {
    try {
      log(`  🎵 ${combo.description}...`, 'yellow');
      
      await tts.synthesize(combo.text, combo.voice, combo.options);
      
      const outputPath = join(outputDir, combo.name);
      const finalPath = await tts.toFile(outputPath);
      
      // Verificar que el archivo se creó
      await access(finalPath);
      
      log(`    ✅ Archivo creado: ${finalPath}`, 'green');
    } catch (error) {
      log(`    ❌ Error en ${combo.name}: ${error instanceof Error ? error.message : error}`, 'red');
    }
  }
}

/**
 * Test de voces disponibles
 */
async function testVoices(tts: EdgeTTS) {
  log('\n🧪 Probando obtención de voces...', 'cyan');
  
  try {
    const voices = await tts.getVoices();
    log(`  ✅ Se obtuvieron ${voices.length} voces`, 'green');
    
    // Agrupar por idioma
    const voicesByLocale = voices.reduce((acc, voice) => {
      const locale = voice.Locale;
      if (!acc[locale]) acc[locale] = [];
      acc[locale].push(voice);
      return acc;
    }, {} as Record<string, Voice[]>);
    
    log(`  📊 Idiomas disponibles: ${Object.keys(voicesByLocale).length}`, 'blue');
    
    // Mostrar algunos ejemplos
    const locales = Object.keys(voicesByLocale).slice(0, 5);
    for (const locale of locales) {
      const count = voicesByLocale[locale].length;
      const example = voicesByLocale[locale][0];
      log(`    • ${locale}: ${count} voces (ej: ${example.FriendlyName})`, 'blue');
    }
    
    return voices;
  } catch (error) {
    log(`  ❌ Error al obtener voces: ${error instanceof Error ? error.message : error}`, 'red');
    return [];
  }
}

/**
 * Test de diferentes formatos de salida
 */
async function testOutputFormats(tts: EdgeTTS, outputDir: string) {
  log('\n🧪 Probando formatos de salida...', 'cyan');
  
  const testText = 'Testing different output formats.';
  
  try {
    await tts.synthesize(testText, 'en-US-AnaNeural');
    
    // Test Buffer
    const buffer = tts.toBuffer();
    log(`  ✅ Buffer generado: ${buffer.length} bytes`, 'green');
    
    // Test Base64
    const base64 = tts.toBase64();
    log(`  ✅ Base64 generado: ${base64.length} caracteres`, 'green');
    
    // Test Raw (alias de Base64)
    const raw = tts.toRaw();
    log(`  ✅ Raw generado: ${raw.length} caracteres`, 'green');
    
    // Verificar que Base64 y Raw son iguales
    if (base64 === raw) {
      log(`  ✅ Base64 y Raw son idénticos`, 'green');
    } else {
      log(`  ❌ Base64 y Raw difieren`, 'red');
    }
    
    // Test File
    const filePath = await tts.toFile(join(outputDir, 'format_test'));
    await access(filePath);
    log(`  ✅ Archivo guardado: ${filePath}`, 'green');
    
  } catch (error) {
    log(`  ❌ Error en test de formatos: ${error instanceof Error ? error.message : error}`, 'red');
  }
}

/**
 * Test de diferentes voces por idioma
 */
async function testMultiLanguageVoices(tts: EdgeTTS, voices: Voice[], outputDir: string) {
  
  log('\n🧪 Probando voces de diferentes idiomas...', 'cyan');
  
  const languageTests = [
    { locale: 'en-US', text: 'Hello, this is English.', name: 'english_test' },
/*     { locale: 'es-MX', text: 'Hola, esto es español.', name: 'spanish_test' },
    { locale: 'fr-FR', text: 'Bonjour, ceci est français.', name: 'french_test' },
    { locale: 'de-DE', text: 'Hallo, das ist Deutsch.', name: 'german_test' },
    { locale: 'it-IT', text: 'Ciao, questo è italiano.', name: 'italian_test' },
    { locale: 'pt-BR', text: 'Olá, isto é português.', name: 'portuguese_test' }, */
  ];
  
  for (const test of languageTests) {
    const voice = voices.find(v => v.Locale.startsWith(test.locale.split('-')[0]));
    
    if (voice) {
      try {
        log(`  🗣️  Probando ${test.locale} con ${voice.FriendlyName}...`, 'yellow');
        
        await tts.synthesize(test.text, voice.ShortName, {
          pitch: '+10Hz',
          rate: '0%',
          volume: '100%'
        });
        
        const filePath = await tts.toFile(join(outputDir, test.name));
        log(`    ✅ Guardado: ${filePath}`, 'green');
        
      } catch (error) {
        log(`    ❌ Error con ${test.locale}: ${error instanceof Error ? error.message : error}`, 'red');
      }
    } else {
      log(`  ⚠️  No se encontró voz para ${test.locale}`, 'yellow');
    }
  }
}

/**
 * Función principal mejorada
 */
async function main() {
  log('🚀 Iniciando suite de tests completa para EdgeTTS...', 'bright');
  
  // Crear directorio de salida
  const outputDir = join(__dirname, 'test_output');
  try {
    await mkdir(outputDir, { recursive: true });
    log(`📂 Directorio de tests: ${outputDir}`, 'blue');
  } catch (error) {
    log(`❌ Error al crear directorio: ${error}`, 'red');
    return;
  }
  
  const tts = new EdgeTTS();
  
  // Ejecutar todos los tests
  try {
    // Test de voces
    const voices = await testVoices(tts);
    
    // Tests de validación
    await testPitchValidation(tts);
    await testRateValidation(tts);
    await testVolumeValidation(tts);
    
    // Tests de síntesis
    await testSynthesisCombinations(tts, outputDir);
    
    // Tests de formatos
    await testOutputFormats(tts, outputDir);
    
    // Tests multi-idioma
    if (voices.length > 0) {
      await testMultiLanguageVoices(tts, voices, outputDir);
    }
    
    log('\n🎉 Suite de tests completada exitosamente!', 'green');
    log(`📁 Revisa los archivos generados en: ${outputDir}`, 'blue');
    
  } catch (error) {
    log(`💥 Error fatal durante los tests: ${error}`, 'red');
  }
}

// Ejecutar tests
main().catch(error => {
  log(`💥 Error no manejado: ${error}`, 'red');
  process.exit(1);
});