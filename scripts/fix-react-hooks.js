#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

console.log('⚙️ Iniciando corrección de problemas de hooks de React...');

// 1. Generar reporte de problemas restantes
try {
  console.log('📊 Generando reporte de problemas...');
  execSync('bun lint:report', { stdio: 'inherit', cwd: rootDir });
} catch (error) {
  console.error('❌ Error al generar reporte:', error);
  process.exit(1);
}

// 2. Leer el reporte de ESLint
let report;
try {
  const reportPath = resolve(rootDir, 'reports/eslint-report.json');
  report = JSON.parse(readFileSync(reportPath, 'utf8'));
  console.log(`📋 Se encontraron ${report.length} archivos con problemas de linting`);
} catch (error) {
  console.error('❌ Error al leer el reporte:', error);
  process.exit(1);
}

// 3. Procesar cada archivo con problemas
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
    
    // Obtener mensajes de dependencias faltantes en hooks
    const hookDependencies = fileReport.messages.filter(msg => 
      msg.ruleId === 'react-hooks/exhaustive-deps'
    );
    
    // Procesar problemas de hooks
    if (hookDependencies.length > 0) {
      const lines = content.split('\n');
      
      hookDependencies.forEach(msg => {
        const lineIndex = msg.line - 1;
        
        // Buscar línea del array de dependencias
        let depLineIndex = lineIndex;
        let isDepArrayFound = false;
        
        // Buscar el array de dependencias (puede estar en líneas siguientes)
        for (let i = lineIndex; i < Math.min(lineIndex + 10, lines.length); i++) {
          if (lines[i].includes('[]') || lines[i].includes('[') && lines[i].includes(']')) {
            depLineIndex = i;
            isDepArrayFound = true;
            break;
          }
        }
        
        if (isDepArrayFound) {
          // Extraer las dependencias faltantes del mensaje
          const missingDepsMatch = msg.message.match(/(?:'([^']+)'(?:, )?)+/g);
          if (missingDepsMatch) {
            // Extraer los nombres de las dependencias
            const missingDeps = missingDepsMatch.flatMap(match => 
              match.match(/'([^']+)'/g)?.map(m => m.replace(/'/g, '')) || []
            );
            
            // Si hay dependencias faltantes
            if (missingDeps.length > 0) {
              let depLine = lines[depLineIndex];
              
              // Caso 1: Array vacío
              if (depLine.includes('[]')) {
                const depsString = missingDeps.join(', ');
                lines[depLineIndex] = depLine.replace('[]', `[${depsString}]`);
              } 
              // Caso 2: Array con elementos
              else {
                const closingBracketIndex = depLine.lastIndexOf(']');
                if (closingBracketIndex !== -1) {
                  // Verificar si hay elementos en el array
                  const openingBracketIndex = depLine.lastIndexOf('[', closingBracketIndex);
                  if (openingBracketIndex !== -1) {
                    const arrayContent = depLine.substring(openingBracketIndex + 1, closingBracketIndex).trim();
                    if (arrayContent.length > 0) {
                      const depsString = missingDeps.join(', ');
                      lines[depLineIndex] = depLine.substring(0, closingBracketIndex) + 
                        (arrayContent.endsWith(',') ? ' ' : ', ') + 
                        depsString + 
                        depLine.substring(closingBracketIndex);
                    } else {
                      const depsString = missingDeps.join(', ');
                      lines[depLineIndex] = depLine.substring(0, closingBracketIndex) + 
                        depsString + 
                        depLine.substring(closingBracketIndex);
                    }
                  }
                }
              }
            }
          }
        } else {
          // Si no encontramos el array de dependencias, agregar un comentario
          lines[lineIndex] += ' // FIXME: Agregar dependencias faltantes al array de dependencias';
        }
      });
      
      content = lines.join('\n');
    }
    
    // Procesar problemas de any
    const anyIssues = fileReport.messages.filter(msg => 
      msg.ruleId === '@typescript-eslint/no-explicit-any'
    );
    
    if (anyIssues.length > 0) {
      const lines = content.split('\n');
      
      anyIssues.forEach(msg => {
        const lineIndex = msg.line - 1;
        const lineContent = lines[lineIndex];
        
        // Reemplazar any por unknown (más seguro que any)
        if (lineContent.includes(': any') || lineContent.includes('as any')) {
          lines[lineIndex] = lineContent
            .replace(': any', ': unknown')
            .replace('as any', 'as unknown');
        }
      });
      
      content = lines.join('\n');
    }
    
    // Guardar cambios si se realizaron modificaciones
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corregido: ${filePath}`);
      totalFixedIssues += hookDependencies.length + anyIssues.length;
    }
    
  } catch (error) {
    console.error(`❌ Error al procesar ${filePath}:`, error);
  }
});

console.log(`🎉 Proceso completado. Se corrigieron automáticamente ${totalFixedIssues} problemas.`);
console.log('ℹ️ Ejecute "bun lint:check" para verificar los problemas restantes.'); 