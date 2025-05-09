#!/usr/bin/env node

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('🧹 Iniciando limpieza completa del código...');

// Función para ejecutar comandos y capturar salida
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf-8', cwd: rootDir });
  } catch (error) {
    console.error(`Error al ejecutar: ${command}`, error.message);
    return null;
  }
}

// Paso 1: Verificar el estado inicial
console.log('📊 Analizando estado inicial del código...');
const initialOutput = runCommand('bun lint:check');
const initialWarningMatch = initialOutput?.match(/(\d+) problems \((\d+) errors, (\d+) warnings\)/);
const initialWarnings = initialWarningMatch ? parseInt(initialWarningMatch[3]) : 0;
console.log(`🔍 Estado inicial: ${initialWarnings} advertencias`);

// Paso 2: Ejecutar scripts de limpieza
console.log('\n🔧 Ejecutando scripts de limpieza...');

// Ejecutar script de limpieza de variables no utilizadas
console.log('\n📌 Paso 1: Eliminando variables no utilizadas...');
try {
  execSync('node scripts/fix-lint-issues.js', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('❌ Error al ejecutar fix-lint-issues.js:', error.message);
}

// Ejecutar script de corrección de hooks
console.log('\n📌 Paso 2: Corrigiendo problemas de hooks y tipos...');
try {
  execSync('node scripts/fix-react-hooks.js', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('❌ Error al ejecutar fix-react-hooks.js:', error.message);
}

// Paso 3: Ejecutar linting para aplicar correcciones finales
console.log('\n📌 Paso 3: Ejecutando limpieza final con ESLint...');
try {
  execSync('bun lint:fix', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('❌ Error al ejecutar lint:fix:', error.message);
}

// Paso 4: Verificar el estado final
console.log('\n📊 Analizando estado final del código...');
const finalOutput = runCommand('bun lint:check');
const finalWarningMatch = finalOutput?.match(/(\d+) problems \((\d+) errors, (\d+) warnings\)/);
const finalWarnings = finalWarningMatch ? parseInt(finalWarningMatch[3]) : 0;

console.log(`\n📈 Resultados:`);
console.log(`   - Advertencias iniciales: ${initialWarnings}`);
console.log(`   - Advertencias finales: ${finalWarnings}`);
console.log(`   - Mejora: ${initialWarnings - finalWarnings} advertencias eliminadas (${((initialWarnings - finalWarnings) / initialWarnings * 100).toFixed(2)}%)`);

// Paso 5: Recomendar acciones adicionales si quedan advertencias
if (finalWarnings > 0) {
  console.log('\n⚠️ Todavía hay advertencias que no pudieron ser corregidas automáticamente.');
  console.log('   Puedes revisarlas ejecutando: bun lint:check');
  console.log('   Para issues más complejos, revisa manualmente los archivos afectados.');
} else {
  console.log('\n🎉 ¡Felicidades! El código está libre de advertencias.');
}

console.log('\n✅ Proceso de limpieza completado.'); 