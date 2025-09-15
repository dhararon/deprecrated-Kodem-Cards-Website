#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('⚙️ Iniciando corrección automática de problemas de linting...');

// 1. Primero ejecutar lint:fix para arreglar problemas que ESLint puede resolver automáticamente
try {
  console.log('🔄 Ejecutando ESLint con correcciones automáticas...');
  execSync('bun lint:fix', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('❌ Error al ejecutar ESLint:', error);
}

// 2. Generar reporte de problemas restantes
try {
  console.log('📊 Generando reporte de problemas restantes...');
  execSync('bun lint:report', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('❌ Error al generar reporte:', error);
  process.exit(1);
}

// 3. Leer el reporte de ESLint
let report;
try {
  const reportPath = resolve(rootDir, 'reports/eslint-report.json');
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
  console.log(`📋 Se encontraron ${report.length} archivos con problemas de linting`);
} catch (error) {
  console.error('❌ Error al leer el reporte:', error);
  process.exit(1);
}

// 4. Procesar cada archivo con problemas
const processedFiles = new Set();
let totalFixedIssues = 0;

report.forEach(fileReport => {
  const filePath = fileReport.filePath;
  
  // Evitar procesar el mismo archivo varias veces
  if (processedFiles.has(filePath)) return;
  processedFiles.add(filePath);
  
  try {
    // Leer el contenido del archivo
    let content = readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Agrupar mensajes por tipo
    const unusedVars = fileReport.messages.filter(msg => 
      msg.ruleId === '@typescript-eslint/no-unused-vars' || 
      msg.ruleId === 'no-unused-vars'
    );
    
    // Ordenar mensajes por línea (de mayor a menor para no afectar índices)
    unusedVars.sort((a, b) => b.line - a.line);
    
    // Procesar variables no utilizadas
    if (unusedVars.length > 0) {
      const lines = content.split('\n');
      
      unusedVars.forEach(msg => {
        const lineIndex = msg.line - 1;
        const lineContent = lines[lineIndex];
        
        // Extraer el nombre de la variable no utilizada
        const unusedVarName = msg.message.match(/'([^']+)'/)?.[1];
        
        if (unusedVarName) {
          // Caso especial: import statement
          if (lineContent.trim().startsWith('import')) {
            // Eliminar la importación completa o solo la variable específica
            if (lineContent.includes(`{ ${unusedVarName} }`) || 
                lineContent.includes(`{ ${unusedVarName},`) ||
                lineContent.includes(`, ${unusedVarName} }`) ||
                lineContent.includes(`, ${unusedVarName},`)) {
              
              // Importación con múltiples elementos
              let newLine = lineContent
                .replace(`{ ${unusedVarName} }`, '{}')  // Único elemento
                .replace(`{ ${unusedVarName}, `, '{ ')  // Primer elemento
                .replace(`, ${unusedVarName} }`, ' }')  // Último elemento
                .replace(`, ${unusedVarName},`, ',');   // Elemento del medio
              
              // Limpiar importación vacía
              if (newLine.includes('{ }')) {
                lines[lineIndex] = '// ' + lines[lineIndex]; // Comentar la línea en vez de eliminarla
              } else {
                lines[lineIndex] = newLine;
              }
            } else if (lineContent.includes(`import ${unusedVarName} from`)) {
              // Importación única
              lines[lineIndex] = '// ' + lines[lineIndex]; // Comentar la línea en vez de eliminarla
            }
          }
          // Caso: Variable en destructuración
          else if (lineContent.includes(`{ ${unusedVarName} }`) || 
                  lineContent.includes(`{ ${unusedVarName},`) ||
                  lineContent.includes(`, ${unusedVarName} }`) ||
                  lineContent.includes(`, ${unusedVarName},`)) {
            let newLine = lineContent
              .replace(`{ ${unusedVarName} }`, '{}')
              .replace(`{ ${unusedVarName}, `, '{ ')
              .replace(`, ${unusedVarName} }`, ' }')
              .replace(`, ${unusedVarName},`, ',');
            
            lines[lineIndex] = newLine;
          }
          // Otros casos: Prefijamos con _ para indicar que es deliberadamente no usado
          else if (lineContent.includes(`${unusedVarName}:`)) {
            lines[lineIndex] = lineContent.replace(`${unusedVarName}:`, `_${unusedVarName}:`);
          }
        }
      });
      
      content = lines.join('\n');
    }
    
    // Guardar cambios si se realizaron modificaciones
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corregido: ${filePath}`);
      totalFixedIssues += unusedVars.length;
    }
    
  } catch (error) {
    console.error(`❌ Error al procesar ${filePath}:`, error);
  }
});

console.log(`🎉 Proceso completado. Se corrigieron automáticamente ${totalFixedIssues} problemas.`);
console.log('ℹ️ Ejecute "bun lint:check" para verificar los problemas restantes.'); 