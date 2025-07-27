import { EdgeTTS, type Voice } from '../src/services/EdgeTTS';
import { mkdir, access } from 'fs/promises';
import { join } from 'path';

/**
 * Utility to color console output
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
 * Pitch validation tests
 */
async function testPitchValidation(tts: EdgeTTS) {
  log('\n🧪 Testing PITCH validations...', 'cyan');

  const pitchTests = [
    { value: 0, expected: '+0Hz', description: 'Pitch number 0' },
    { value: 50, expected: '+50Hz', description: 'Positive pitch number' },
    { value: -30, expected: '-30Hz', description: 'Negative pitch number' },
    { value: '+25Hz', expected: '+25Hz', description: 'Positive pitch string' },
    { value: '-45Hz', expected: '-45Hz', description: 'Negative pitch string' },
    { value: '12.5Hz', expected: '12.5Hz', description: 'Decimal pitch' },
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
 * Rate validation tests
 */
async function testRateValidation(tts: EdgeTTS) {
  log('\n🧪 Testing RATE validations...', 'cyan');

  const rateTests = [
    { value: 0, expected: '+0%', description: 'Rate number 0' },
    { value: 50, expected: '+50%', description: 'Positive rate number' },
    { value: -20, expected: '-20%', description: 'Negative rate number' },
    { value: '100%', expected: '+100%', description: 'Positive rate string' },
    { value: '-25%', expected: '-25%', description: 'Negative rate string' },
    { value: '150.5%', expected: '+150.5%', description: 'Decimal rate' },
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
 * Volume validation tests
 */
async function testVolumeValidation(tts: EdgeTTS) {
  log('\n🧪 Testing VOLUME validations...', 'cyan');

  const volumeTests = [
    { value: 0, expected: '0%', description: 'Volume number 0' },
    { value: 50, expected: '50%', description: 'Valid volume number' },
    { value: '100%', expected: '100%', description: 'Valid volume string' },
    { value: 150, expected: '150%', description: 'Volume greater than 100%' },
    { value: -100, expected: '-100%', description: 'Negative volume' },
  ];

  const invalidVolumeTests = [
    { value: -110, description: 'Volume number lower than -100%' },
    { value: '-120%', description: 'Negative volume string lower than -100%' },
  ];

  // Valid tests
  for (const test of volumeTests) {
    try {
      await tts.synthesize('Test volume', 'en-US-AnaNeural', { volume: test.value });
      log(`  ✅ ${test.description}: ${test.value} -> ${test.expected}`, 'green');
    } catch (error) {
      log(`  ❌ ${test.description}: Error - ${error instanceof Error ? error.message : error}`, 'red');
    }
  }

  // Tests that should fail
  for (const test of invalidVolumeTests) {
    try {
      await tts.synthesize('Test volume', 'en-US-AnaNeural', { volume: test.value });
      log(`  ❌ ${test.description}: Should have failed but didn't`, 'red');
    } catch (error) {
      log(`  ✅ ${test.description}: Correctly rejected - ${error instanceof Error ? error.message : error}`, 'green');
    }
  }
}

/**
 * Synthesis tests with different combinations
 */
async function testSynthesisCombinations(tts: EdgeTTS, outputDir: string) {
  log('\n🧪 Testing synthesis combinations...', 'cyan');

  const combinations = [
    {
      name: 'basic_english',
      text: 'Hello world, this is a basic test.',
      voice: 'en-US-AnaNeural',
      options: {},
      description: 'Basic synthesis without options'
    },
    {
      name: 'modified_pitch',
      text: 'This text has a modified pitch.',
      voice: 'en-US-AnaNeural',
      options: { pitch: '+50Hz' },
      description: 'Only pitch modified'
    },
    {
      name: 'modified_rate',
      text: 'This text has a slower rate of speech.',
      voice: 'en-US-AnaNeural',
      options: { rate: '-30%' },
      description: 'Only rate modified'
    },
    {
      name: 'modified_volume',
      text: 'This text has increased volume.',
      voice: 'en-US-AnaNeural',
      options: { volume: '120%' },
      description: 'Only volume modified'
    },
    {
      name: 'all_modified',
      text: 'This text has all parameters modified for a dramatic effect.',
      voice: 'en-US-AnaNeural',
      options: { pitch: '-20Hz', rate: '+25%', volume: '90%' },
      description: 'All parameters modified'
    }
  ];
  tts
  for (const combo of combinations) {
    try {
      log(`  🎵 ${combo.description}...`, 'yellow');

      await tts.synthesize(combo.text, combo.voice, combo.options);

      const outputPath = join(outputDir, combo.name);
      const finalPath = await tts.toFile(outputPath);

      // Verify file creation
      await access(finalPath);

      log(`    ✅ File created: ${finalPath}`, 'green');
    } catch (error) {
      log(`    ❌ Error in ${combo.name}: ${error instanceof Error ? error.message : error}`, 'red');
    }
  }
}

/**
 * Voice retrieval tests
 */
async function testVoices(tts: EdgeTTS) {
  log('\n🧪 Testing voice retrieval...', 'cyan');

  try {
    const voices = await tts.getVoices();
    log(`  ✅ Retrieved ${voices.length} voices`, 'green');

    // Group by language
    const voicesByLocale = voices.reduce((acc, voice) => {
      const locale = voice.Locale;
      if (!acc[locale]) acc[locale] = [];
      acc[locale].push(voice);
      return acc;
    }, {} as Record<string, Voice[]>);

    log(`  📊 Available languages: ${Object.keys(voicesByLocale).length}`, 'blue');

    // Show some examples
    const locales = Object.keys(voicesByLocale).slice(0, 5);
    for (const locale of locales) {
      const count = voicesByLocale[locale].length;
      const example = voicesByLocale[locale][0];
      log(`    • ${locale}: ${count} voices (e.g. ${example.FriendlyName})`, 'blue');
    }

    return voices;
  } catch (error) {
    log(`  ❌ Error retrieving voices: ${error instanceof Error ? error.message : error}`, 'red');
    return [];
  }
}

/**
 * Output format tests
 */
async function testOutputFormats(tts: EdgeTTS, outputDir: string) {
  log('\n🧪 Testing output formats...', 'cyan');

  const testText = 'Testing different output formats.';

  try {
    await tts.synthesize(testText, 'en-US-AnaNeural');

    // Buffer test
    const buffer = tts.toBuffer();
    log(`  ✅ Buffer generated: ${buffer.length} bytes`, 'green');

    // Base64 test
    const base64 = tts.toBase64();
    log(`  ✅ Base64 generated: ${base64.length} characters`, 'green');

    // Raw test (alias of Base64)
    const raw = tts.toRaw();
    log(`  ✅ Raw generated: ${raw.length} characters`, 'green');

    // Verify Base64 and Raw equality
    if (base64 === raw) {
      log('  ✅ Base64 and Raw are identical', 'green');
    } else {
      log('  ❌ Base64 and Raw differ', 'red');
    }

    // File test
    const filePath = await tts.toFile(join(outputDir, 'format_test'));
    await access(filePath);
    log(`  ✅ File saved: ${filePath}`, 'green');

  } catch (error) {
    log(`  ❌ Error in format tests: ${error instanceof Error ? error.message : error}`, 'red');
  }
}

/**
 * Tests with voices from different languages
 */
async function testMultiLanguageVoices(tts: EdgeTTS, voices: Voice[], outputDir: string) {

  log('\n🧪 Testing voices from different languages...', 'cyan');

  const languageTests = [
    { locale: 'en-US', text: 'Hello, this is English.', name: 'english_test' },
  ];

  for (const test of languageTests) {
    const voice = voices.find(v => v.Locale.startsWith(test.locale.split('-')[0]));

    if (voice) {
      try {
        log(`  🗣️  Testing ${test.locale} with ${voice.FriendlyName}...`, 'yellow');

        await tts.synthesize(test.text, voice.ShortName, {
          pitch: '+10Hz',
          rate: '0%',
          volume: '100%'
        });

        const filePath = await tts.toFile(join(outputDir, test.name));
        log(`    ✅ Saved: ${filePath}`, 'green');

      } catch (error) {
        log(`    ❌ Error with ${test.locale}: ${error instanceof Error ? error.message : error}`, 'red');
      }
    } else {
      log(`  ⚠️  No voice found for ${test.locale}`, 'yellow');
    }
  }
}

/**
 * Improved main function
 */
async function main() {
  log('🚀 Starting full test suite for EdgeTTS...', 'bright');

  // Create output directory
  const outputDir = join(__dirname, 'test_output');
  try {
    await mkdir(outputDir, { recursive: true });
    log(`📂 Test directory: ${outputDir}`, 'blue');
  } catch (error) {
    log(`❌ Error creating directory: ${error}`, 'red');
    return;
  }

  const tts = new EdgeTTS();

  // Execute all tests
  try {
    // Voice tests
    const voices = await testVoices(tts);

    // Validation tests
    await testPitchValidation(tts);
    await testRateValidation(tts);
    await testVolumeValidation(tts);

    // Synthesis tests
    await testSynthesisCombinations(tts, outputDir);

    // Format tests
    await testOutputFormats(tts, outputDir);

    // Multi-language tests
    if (voices.length > 0) {
      await testMultiLanguageVoices(tts, voices, outputDir);
    }

    log('\n🎉 Test suite completed successfully!', 'green');
    log(`📁 Check the generated files in: ${outputDir}`, 'blue');

  } catch (error) {
    log(`💥 Fatal error during tests: ${error}`, 'red');
  }
}

// Run tests
main().catch(error => {
  log(`💥 Unhandled error: ${error}`, 'red');
  process.exit(1);
});
