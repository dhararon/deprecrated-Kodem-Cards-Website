#!/usr/bin/env node

/**
 * Script para analizar automáticamente las dependencias del proyecto
 * Detecta:
 * - Dependencias desactualizadas
 * - Vulnerabilidades de seguridad
 * - Dependencias duplicadas
 * - Dependencias sin usar
 * - Errores en package.json
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Configuración
const SEVERITY_LEVELS = {
    LOW: { color: 'blue', symbol: 'ℹ' },
    MEDIUM: { color: 'yellow', symbol: '⚠' },
    HIGH: { color: 'red', symbol: '✖' },
    CRITICAL: { color: 'redBright', symbol: '❌' }
};

const CONFIG = {
    ignoreDependencies: [], // Dependencias a ignorar en la verificación
    ignoreDevDependencies: false, // Si es true, no verifica devDependencies
    maxVersionDiff: 2, // Diferencia máxima de versiones menores antes de alertar
    reportOutput: './reports/dependencies-report.json', // Ruta para guardar el reporte
    includeVulnerabilities: true, // Incluir auditoría de seguridad
    checkUnused: true, // Buscar dependencias sin usar
    suggestAlternatives: true // Sugerir alternativas más modernas
};

// Estado del análisis
const issues = {
    outdated: [],
    vulnerabilities: [],
    duplicated: [],
    unused: [],
    errors: []
};

// Contador de severidades
const severityCounts = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
};

/**
 * Formatea la salida de los issues
 */
function formatIssue(message, severity = 'LOW') {
    const level = SEVERITY_LEVELS[severity];
    return `${chalk[level.color](level.symbol)} ${message}`;
}

/**
 * Registra un issue en la categoría correspondiente
 */
function addIssue(category, message, severity = 'LOW', details = null) {
    issues[category].push({ message, severity, details });
    severityCounts[severity.toLowerCase()]++;
    console.log(formatIssue(message, severity));
}

/**
 * Verifica dependencias desactualizadas
 */
async function checkOutdatedDependencies() {
    console.log(chalk.cyan('\n🔍 Verificando dependencias desactualizadas...'));

    try {
        // npm outdated devuelve un código de error si hay dependencias desactualizadas
        const outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });

        if (outdatedOutput) {
            const outdated = JSON.parse(outdatedOutput);
            const outdatedDeps = Object.keys(outdated);

            if (outdatedDeps.length === 0) {
                console.log(chalk.green('✓ Todas las dependencias están actualizadas'));
                return;
            }

            for (const dep of outdatedDeps) {
                if (CONFIG.ignoreDependencies.includes(dep)) continue;
                if (CONFIG.ignoreDevDependencies && isDevDependency(dep)) continue;

                const { current, wanted, latest } = outdated[dep];
                const currentMajor = parseInt(current.split('.')[0]);
                const latestMajor = parseInt(latest.split('.')[0]);
                const versionDiff = latestMajor - currentMajor;

                let severity = 'LOW';
                if (versionDiff > 0) {
                    severity = versionDiff === 1 ? 'MEDIUM' : 'HIGH';
                }

                addIssue(
                    'outdated',
                    `${dep}: ${current} → ${latest} (${versionDiff > 0 ? `${versionDiff} versiones major` : 'actualizaciones menores'})`,
                    severity,
                    { name: dep, current, wanted, latest }
                );
            }
        }
    } catch (error) {
        // Si hay dependencias desactualizadas, npm outdated devuelve un código de error
        try {
            const outdatedOutput = error.stdout.toString();
            const outdated = JSON.parse(outdatedOutput);
            const outdatedDeps = Object.keys(outdated);

            for (const dep of outdatedDeps) {
                if (CONFIG.ignoreDependencies.includes(dep)) continue;
                if (CONFIG.ignoreDevDependencies && isDevDependency(dep)) continue;

                const { current, wanted, latest } = outdated[dep];
                const currentMajor = parseInt(current.split('.')[0]);
                const latestMajor = parseInt(latest.split('.')[0]);
                const versionDiff = latestMajor - currentMajor;

                let severity = 'LOW';
                if (versionDiff > 0) {
                    severity = versionDiff === 1 ? 'MEDIUM' : 'HIGH';
                }

                addIssue(
                    'outdated',
                    `${dep}: ${current} → ${latest} (${versionDiff > 0 ? `${versionDiff} versiones major` : 'actualizaciones menores'})`,
                    severity,
                    { name: dep, current, wanted, latest }
                );
            }
        } catch (parseError) {
            addIssue('errors', `Error al verificar dependencias desactualizadas: ${error.message}`, 'HIGH');
        }
    }
}

/**
 * Verifica vulnerabilidades en las dependencias
 */
async function checkVulnerabilities() {
    console.log(chalk.cyan('\n🔍 Verificando vulnerabilidades de seguridad...'));

    if (!CONFIG.includeVulnerabilities) {
        console.log(chalk.yellow('⚠ Verificación de vulnerabilidades desactivada en la configuración'));
        return;
    }

    try {
        const auditOutput = execSync('npm audit --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
        const audit = JSON.parse(auditOutput);

        // Si no hay vulnerabilidades
        if (audit.metadata && audit.metadata.vulnerabilities) {
            const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
            const totalVulnerabilities = critical + high + moderate + low;

            if (totalVulnerabilities === 0) {
                console.log(chalk.green('✓ No se encontraron vulnerabilidades'));
                return;
            }

            // Registrar resumen de vulnerabilidades
            if (critical > 0) addIssue('vulnerabilities', `${critical} vulnerabilidades críticas`, 'CRITICAL');
            if (high > 0) addIssue('vulnerabilities', `${high} vulnerabilidades altas`, 'HIGH');
            if (moderate > 0) addIssue('vulnerabilities', `${moderate} vulnerabilidades moderadas`, 'MEDIUM');
            if (low > 0) addIssue('vulnerabilities', `${low} vulnerabilidades bajas`, 'LOW');

            // Registrar detalles de cada vulnerabilidad
            if (audit.vulnerabilities) {
                for (const [pkg, vuln] of Object.entries(audit.vulnerabilities)) {
                    if (CONFIG.ignoreDependencies.includes(pkg)) continue;

                    const severity = vuln.severity.toUpperCase();
                    addIssue(
                        'vulnerabilities',
                        `${pkg}: ${vuln.name} (${vuln.severity})`,
                        severity,
                        vuln
                    );
                }
            }
        }
    } catch (error) {
        try {
            // Intentar analizar la salida en caso de error
            const auditOutput = error.stdout?.toString();
            if (auditOutput) {
                const audit = JSON.parse(auditOutput);

                if (audit.metadata && audit.metadata.vulnerabilities) {
                    const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
                    const totalVulnerabilities = critical + high + moderate + low;

                    if (totalVulnerabilities === 0) {
                        console.log(chalk.green('✓ No se encontraron vulnerabilidades'));
                        return;
                    }

                    // Registrar resumen de vulnerabilidades
                    if (critical > 0) addIssue('vulnerabilities', `${critical} vulnerabilidades críticas`, 'CRITICAL');
                    if (high > 0) addIssue('vulnerabilities', `${high} vulnerabilidades altas`, 'HIGH');
                    if (moderate > 0) addIssue('vulnerabilities', `${moderate} vulnerabilidades moderadas`, 'MEDIUM');
                    if (low > 0) addIssue('vulnerabilities', `${low} vulnerabilidades bajas`, 'LOW');

                    // Registrar detalles de cada vulnerabilidad
                    if (audit.vulnerabilities) {
                        for (const [pkg, vuln] of Object.entries(audit.vulnerabilities)) {
                            if (CONFIG.ignoreDependencies.includes(pkg)) continue;

                            const severity = vuln.severity.toUpperCase();
                            addIssue(
                                'vulnerabilities',
                                `${pkg}: ${vuln.name} (${vuln.severity})`,
                                severity,
                                vuln
                            );
                        }
                    }
                }
            } else {
                addIssue('errors', `Error al verificar vulnerabilidades: ${error.message}`, 'HIGH');
            }
        } catch (parseError) {
            addIssue('errors', `Error al verificar vulnerabilidades: ${error.message}`, 'HIGH');
        }
    }
}

/**
 * Verifica dependencias duplicadas
 */
async function checkDuplicatedDependencies() {
    console.log(chalk.cyan('\n🔍 Verificando dependencias duplicadas...'));

    try {
        const dedupe = execSync('npm dedupe --dry-run', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });

        if (dedupe && dedupe.includes('would remove')) {
            const lines = dedupe.split('\n');
            const duplicatedLines = lines.filter(line => line.includes('would remove'));

            for (const line of duplicatedLines) {
                const match = line.match(/would remove ([^,]+), replacing with ([^,]+)/);
                if (match) {
                    const [_, dupeVersion, replaceVersion] = match;
                    addIssue(
                        'duplicated',
                        `Dependencia duplicada: ${dupeVersion} → ${replaceVersion}`,
                        'MEDIUM'
                    );
                }
            }
        } else {
            console.log(chalk.green('✓ No se encontraron dependencias duplicadas'));
        }
    } catch (error) {
        // Si devuelve error pero contiene información sobre dependencias duplicadas
        if (error.stdout) {
            const output = error.stdout.toString();
            if (output.includes('would remove')) {
                const lines = output.split('\n');
                const duplicatedLines = lines.filter(line => line.includes('would remove'));

                for (const line of duplicatedLines) {
                    const match = line.match(/would remove ([^,]+), replacing with ([^,]+)/);
                    if (match) {
                        const [_, dupeVersion, replaceVersion] = match;
                        addIssue(
                            'duplicated',
                            `Dependencia duplicada: ${dupeVersion} → ${replaceVersion}`,
                            'MEDIUM'
                        );
                    }
                }
            } else {
                console.log(chalk.green('✓ No se encontraron dependencias duplicadas'));
            }
        } else {
            addIssue('errors', `Error al verificar dependencias duplicadas: ${error.message}`, 'MEDIUM');
        }
    }
}

/**
 * Verifica dependencias sin usar
 * Requiere depcheck instalado globalmente o en el proyecto
 */
async function checkUnusedDependencies() {
    console.log(chalk.cyan('\n🔍 Verificando dependencias sin usar...'));

    if (!CONFIG.checkUnused) {
        console.log(chalk.yellow('⚠ Verificación de dependencias sin usar desactivada en la configuración'));
        return;
    }

    try {
        // Primero intentamos con npx depcheck
        const depcheckOutput = execSync('npx depcheck --json', { encoding: 'utf8' });
        const depcheck = JSON.parse(depcheckOutput);

        if (depcheck.dependencies.length === 0 && depcheck.devDependencies.length === 0) {
            console.log(chalk.green('✓ No se encontraron dependencias sin usar'));
            return;
        }

        // Dependencias de producción sin usar
        for (const dep of depcheck.dependencies) {
            if (CONFIG.ignoreDependencies.includes(dep)) continue;
            addIssue(
                'unused',
                `Dependencia sin usar: ${dep}`,
                'MEDIUM',
                { name: dep, type: 'dependency' }
            );
        }

        // DevDependencies sin usar
        if (!CONFIG.ignoreDevDependencies) {
            for (const dep of depcheck.devDependencies) {
                if (CONFIG.ignoreDependencies.includes(dep)) continue;
                addIssue(
                    'unused',
                    `DevDependencia sin usar: ${dep}`,
                    'LOW',
                    { name: dep, type: 'devDependency' }
                );
            }
        }
    } catch (error) {
        // Si falla, tal vez no está instalado depcheck
        try {
            // Instalarlo temporalmente y ejecutarlo
            console.log(chalk.yellow('⚠ depcheck no está instalado, instalando temporalmente...'));
            execSync('npm install -g depcheck', { stdio: 'inherit' });

            const depcheckOutput = execSync('depcheck --json', { encoding: 'utf8' });
            const depcheck = JSON.parse(depcheckOutput);

            if (depcheck.dependencies.length === 0 && depcheck.devDependencies.length === 0) {
                console.log(chalk.green('✓ No se encontraron dependencias sin usar'));
                return;
            }

            // Dependencias de producción sin usar
            for (const dep of depcheck.dependencies) {
                if (CONFIG.ignoreDependencies.includes(dep)) continue;
                addIssue(
                    'unused',
                    `Dependencia sin usar: ${dep}`,
                    'MEDIUM',
                    { name: dep, type: 'dependency' }
                );
            }

            // DevDependencies sin usar
            if (!CONFIG.ignoreDevDependencies) {
                for (const dep of depcheck.devDependencies) {
                    if (CONFIG.ignoreDependencies.includes(dep)) continue;
                    addIssue(
                        'unused',
                        `DevDependencia sin usar: ${dep}`,
                        'LOW',
                        { name: dep, type: 'devDependency' }
                    );
                }
            }
        } catch (installError) {
            addIssue('errors', `Error al verificar dependencias sin usar: ${error.message}`, 'LOW');
        }
    }
}

/**
 * Verifica si una dependencia es de desarrollo
 */
function isDevDependency(name) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    return packageJson.devDependencies && packageJson.devDependencies[name];
}

/**
 * Sugiere alternativas para dependencias deprecadas o problemáticas
 */
function suggestAlternatives() {
    console.log(chalk.cyan('\n🔍 Analizando posibles mejoras y alternativas...'));

    if (!CONFIG.suggestAlternatives) {
        console.log(chalk.yellow('⚠ Sugerencias de alternativas desactivadas en la configuración'));
        return;
    }

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
    };

    // Mapeo de dependencias problemáticas y sus alternativas recomendadas
    const alternatives = {
        'moment': { alt: 'date-fns o dayjs', reason: 'Tamaño reducido y mejor modularidad' },
        'jquery': { alt: 'vanilla JS o petite-dom', reason: 'Rendimiento mejorado y menor tamaño' },
        'lodash': { alt: 'lodash-es o solo importar métodos específicos', reason: 'Tree-shaking y reducción de tamaño de bundle' },
        'request': { alt: 'node-fetch, axios o got', reason: 'request está deprecado' },
        'underscore': { alt: 'lodash-es', reason: 'Más funcionalidades y mejor mantenimiento' },
        'express': { alt: 'fastify', reason: 'Mejor rendimiento para aplicaciones nuevas' },
        'gulp': { alt: 'rollup, webpack o esbuild', reason: 'Mejores alternativas para proyectos modernos' },
        'grunt': { alt: 'npm scripts, webpack o rollup', reason: 'Simplificación del flujo de trabajo' },
        'enzyme': { alt: '@testing-library/react', reason: 'Mejor enfoque de testing centrado en el usuario' },
    };

    let hasSuggestions = false;

    for (const [dep, info] of Object.entries(alternatives)) {
        if (allDeps[dep] && !CONFIG.ignoreDependencies.includes(dep)) {
            hasSuggestions = true;
            addIssue(
                'outdated',
                `Considera reemplazar ${dep} con ${info.alt}: ${info.reason}`,
                'LOW',
                { name: dep, alternative: info.alt, reason: info.reason }
            );
        }
    }

    if (!hasSuggestions) {
        console.log(chalk.green('✓ No se encontraron alternativas a sugerir'));
    }
}

/**
 * Guarda el reporte en un archivo JSON
 */
function saveReport() {
    const reportDir = path.dirname(CONFIG.reportOutput);

    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalIssues: Object.values(issues).reduce((acc, arr) => acc + arr.length, 0),
            bySeverity: severityCounts,
            byCategory: {
                outdated: issues.outdated.length,
                vulnerabilities: issues.vulnerabilities.length,
                duplicated: issues.duplicated.length,
                unused: issues.unused.length,
                errors: issues.errors.length
            }
        },
        issues
    };

    fs.writeFileSync(CONFIG.reportOutput, JSON.stringify(report, null, 2));
    console.log(chalk.green(`\n✓ Reporte guardado en ${CONFIG.reportOutput}`));
}

/**
 * Muestra el resumen final
 */
function showSummary() {
    const totalIssues = Object.values(issues).reduce((acc, arr) => acc + arr.length, 0);

    console.log(chalk.cyan('\n📊 Resumen de análisis:'));
    console.log(`Total de problemas: ${totalIssues}`);
    console.log(`- Críticos: ${severityCounts.critical}`);
    console.log(`- Altos: ${severityCounts.high}`);
    console.log(`- Medios: ${severityCounts.medium}`);
    console.log(`- Bajos: ${severityCounts.low}`);

    console.log(chalk.cyan('\nPor categoría:'));
    console.log(`- Desactualizadas: ${issues.outdated.length}`);
    console.log(`- Vulnerabilidades: ${issues.vulnerabilities.length}`);
    console.log(`- Duplicadas: ${issues.duplicated.length}`);
    console.log(`- Sin usar: ${issues.unused.length}`);
    console.log(`- Errores: ${issues.errors.length}`);

    if (totalIssues > 0) {
        if (severityCounts.critical > 0 || severityCounts.high > 0) {
            console.log(chalk.red('\n❌ Se encontraron problemas críticos o de alta severidad que deben solucionarse.'));
        } else if (severityCounts.medium > 0) {
            console.log(chalk.yellow('\n⚠ Se encontraron problemas de severidad media que deberían revisarse.'));
        } else {
            console.log(chalk.blue('\nℹ Se encontraron problemas menores que podrían mejorarse.'));
        }
    } else {
        console.log(chalk.green('\n✅ No se encontraron problemas en las dependencias.'));
    }
}

/**
 * Función principal
 */
async function main() {
    console.log(chalk.cyan('🔍 Iniciando análisis de dependencias...'));

    // Ejecutar verificaciones
    await checkOutdatedDependencies();
    await checkVulnerabilities();
    await checkDuplicatedDependencies();
    await checkUnusedDependencies();
    await suggestAlternatives();

    // Guardar reporte y mostrar resumen
    saveReport();
    showSummary();

    // Salir con código de error si hay problemas críticos
    if (severityCounts.critical > 0) {
        process.exit(1);
    }
}

// Ejecutar análisis
main().catch(error => {
    console.error(chalk.red(`Error en el análisis: ${error.message}`));
    process.exit(1);
}); 