#!/usr/bin/env node

/**
 * Script para analizar automáticamente las dependencias del proyecto
 * Versión CommonJS compatible
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Importar chalk de forma compatible
let chalk;
(async () => {
    try {
        // Intentar importar chalk v5 (ESM)
        chalk = (await import('chalk')).default;
    } catch (error) {
        // Fallback a chalk v4 (CommonJS)
        chalk = require('chalk');
    }
})();

// Si chalk no está disponible, usar colores básicos
if (!chalk) {
    chalk = {
        cyan: (text) => `\x1b[36m${text}\x1b[0m`,
        green: (text) => `\x1b[32m${text}\x1b[0m`,
        yellow: (text) => `\x1b[33m${text}\x1b[0m`,
        red: (text) => `\x1b[31m${text}\x1b[0m`,
        blue: (text) => `\x1b[34m${text}\x1b[0m`,
        dim: (text) => `\x1b[2m${text}\x1b[0m`,
        redBright: (text) => `\x1b[91m${text}\x1b[0m`
    };
}

// Configuración
const SEVERITY_LEVELS = {
    LOW: { color: 'blue', symbol: 'ℹ' },
    MEDIUM: { color: 'yellow', symbol: '⚠' },
    HIGH: { color: 'red', symbol: '✖' },
    CRITICAL: { color: 'redBright', symbol: '❌' }
};

const CONFIG = {
    ignoreDependencies: [],
    ignoreDevDependencies: false,
    maxVersionDiff: 2,
    reportOutput: './reports/dependencies-report.json',
    includeVulnerabilities: true,
    checkUnused: true,
    suggestAlternatives: true,
    packageManager: 'auto',
    autoUpdate: false,
    updateStrategy: 'minor',
    interactiveMode: true,
    quickUpdate: false
};

// Estado del análisis
const issues = {
    outdated: [],
    vulnerabilities: [],
    duplicated: [],
    unused: [],
    errors: []
};

const severityCounts = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
};

const pendingUpdates = {
    patch: [],
    minor: [],
    major: []
};

/**
 * Detecta el package manager utilizado en el proyecto
 */
function detectPackageManager() {
    if (CONFIG.packageManager !== 'auto') {
        return CONFIG.packageManager;
    }

    if (fs.existsSync('bun.lockb')) return 'bun';
    if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
    if (fs.existsSync('yarn.lock')) return 'yarn';
    if (fs.existsSync('package-lock.json')) return 'npm';

    try {
        execSync('bun --version', { stdio: 'ignore' });
        return 'bun';
    } catch {
        return 'npm';
    }
}

/**
 * Obtiene los comandos específicos para cada package manager
 */
function getPackageManagerCommands(pm) {
    const commands = {
        npm: {
            install: 'npm install',
            update: 'npm update',
            outdated: 'npm outdated --json',
            audit: 'npm audit --json',
            dedupe: 'npm dedupe --dry-run'
        },
        yarn: {
            install: 'yarn install',
            update: 'yarn upgrade',
            outdated: 'yarn outdated --json',
            audit: 'yarn audit --json',
            dedupe: 'yarn dedupe --dry-run'
        },
        pnpm: {
            install: 'pnpm install',
            update: 'pnpm update',
            outdated: 'pnpm outdated --format json',
            audit: 'pnpm audit --json',
            dedupe: 'pnpm dedupe --dry-run'
        },
        bun: {
            install: 'bun install',
            update: 'bun update',
            outdated: 'bun outdated --json || bun pm ls --all',
            audit: 'bun audit --json || npm audit --json',
            dedupe: 'bun install --no-save'
        }
    };

    return commands[pm] || commands.npm;
}

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
 * Pregunta al usuario si desea continuar (modo interactivo)
 */
function askUserConfirmation(question) {
    if (!CONFIG.interactiveMode) return Promise.resolve(true);

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`${question} (y/N): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}

/**
 * Actualiza el package.json con las nuevas versiones
 */
function updatePackageJsonVersions(updates, strategy = 'minor') {
    console.log(chalk.cyan('\n📝 Actualizando versiones en package.json...'));

    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    let updatedCount = 0;

    for (const update of updates) {
        const { name, current, wanted, latest } = update;

        let targetVersion;
        if (strategy === 'patch') {
            targetVersion = wanted || current;
        } else if (strategy === 'minor') {
            targetVersion = wanted || latest;
        } else if (strategy === 'major') {
            targetVersion = latest;
        }

        // Actualizar en dependencies
        if (packageJson.dependencies && packageJson.dependencies[name]) {
            packageJson.dependencies[name] = `^${targetVersion}`;
            updatedCount++;
            console.log(chalk.green(`  ✓ ${name}: ^${targetVersion} (dependencies)`));
        }

        // Actualizar en devDependencies
        if (packageJson.devDependencies && packageJson.devDependencies[name]) {
            packageJson.devDependencies[name] = `^${targetVersion}`;
            updatedCount++;
            console.log(chalk.green(`  ✓ ${name}: ^${targetVersion} (devDependencies)`));
        }

        // Actualizar en peerDependencies si existe
        if (packageJson.peerDependencies && packageJson.peerDependencies[name]) {
            packageJson.peerDependencies[name] = `^${targetVersion}`;
            updatedCount++;
            console.log(chalk.green(`  ✓ ${name}: ^${targetVersion} (peerDependencies)`));
        }
    }

    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
    console.log(chalk.green(`\n✅ package.json actualizado con ${updatedCount} cambios`));

    return packageJson;
}

/**
 * Verifica dependencias desactualizadas
 */
async function checkOutdatedDependencies() {
    console.log(chalk.cyan('\n🔍 Verificando dependencias desactualizadas...'));

    const pm = detectPackageManager();
    const commands = getPackageManagerCommands(pm);

    console.log(chalk.dim(`Usando ${pm} como package manager`));

    try {
        let outdatedOutput;
        let outdated = {};

        if (pm === 'bun') {
            try {
                outdatedOutput = execSync('bun outdated --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                outdated = JSON.parse(outdatedOutput);
            } catch {
                try {
                    outdatedOutput = execSync('npm outdated --json', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
                    outdated = JSON.parse(outdatedOutput);
                } catch (npmError) {
                    if (npmError.stdout) {
                        outdated = JSON.parse(npmError.stdout.toString());
                    }
                }
            }
        } else {
            outdatedOutput = execSync(commands.outdated, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
            outdated = JSON.parse(outdatedOutput);
        }

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
            let updateType = 'patch';

            if (versionDiff > 0) {
                severity = versionDiff === 1 ? 'MEDIUM' : 'HIGH';
                updateType = 'major';
            } else if (wanted !== current) {
                updateType = 'minor';
            }

            pendingUpdates[updateType].push({
                name: dep,
                current,
                wanted,
                latest
            });

            addIssue(
                'outdated',
                `${dep}: ${current} → ${latest} (${versionDiff > 0 ? `${versionDiff} versiones major` : 'actualizaciones menores'})`,
                severity,
                { name: dep, current, wanted, latest, updateType, packageManager: pm }
            );
        }

    } catch (error) {
        if (error.stdout) {
            try {
                const outdated = JSON.parse(error.stdout.toString());
                const outdatedDeps = Object.keys(outdated);

                for (const dep of outdatedDeps) {
                    if (CONFIG.ignoreDependencies.includes(dep)) continue;
                    if (CONFIG.ignoreDevDependencies && isDevDependency(dep)) continue;

                    const { current, wanted, latest } = outdated[dep];
                    const currentMajor = parseInt(current.split('.')[0]);
                    const latestMajor = parseInt(latest.split('.')[0]);
                    const versionDiff = latestMajor - currentMajor;

                    let severity = 'LOW';
                    let updateType = 'patch';

                    if (versionDiff > 0) {
                        severity = versionDiff === 1 ? 'MEDIUM' : 'HIGH';
                        updateType = 'major';
                    } else if (wanted !== current) {
                        updateType = 'minor';
                    }

                    pendingUpdates[updateType].push({
                        name: dep,
                        current,
                        wanted,
                        latest
                    });

                    addIssue(
                        'outdated',
                        `${dep}: ${current} → ${latest} (${versionDiff > 0 ? `${versionDiff} versiones major` : 'actualizaciones menores'})`,
                        severity,
                        { name: dep, current, wanted, latest, updateType, packageManager: pm }
                    );
                }
            } catch (parseError) {
                addIssue('errors', `Error al verificar dependencias desactualizadas: ${error.message}`, 'HIGH');
            }
        } else {
            addIssue('errors', `Error al verificar dependencias desactualizadas: ${error.message}`, 'HIGH');
        }
    }
}

/**
 * Actualiza las dependencias según la estrategia configurada
 */
async function updateDependencies() {
    const totalUpdates = pendingUpdates.patch.length + pendingUpdates.minor.length + pendingUpdates.major.length;

    if (totalUpdates === 0) {
        console.log(chalk.green('\n✓ No hay actualizaciones pendientes'));
        return;
    }

    console.log(chalk.cyan(`\n🔄 Actualizaciones disponibles (${totalUpdates} paquetes):`));

    if (pendingUpdates.patch.length > 0) {
        console.log(chalk.blue(`  📦 Patches: ${pendingUpdates.patch.length} paquetes`));
        pendingUpdates.patch.forEach(pkg => console.log(chalk.blue(`    - ${pkg.name}: ${pkg.current} → ${pkg.wanted || pkg.latest}`)));
    }
    if (pendingUpdates.minor.length > 0) {
        console.log(chalk.yellow(`  🔧 Menores: ${pendingUpdates.minor.length} paquetes`));
        pendingUpdates.minor.forEach(pkg => console.log(chalk.yellow(`    - ${pkg.name}: ${pkg.current} → ${pkg.wanted || pkg.latest}`)));
    }
    if (pendingUpdates.major.length > 0) {
        console.log(chalk.red(`  🚨 Mayores: ${pendingUpdates.major.length} paquetes (pueden requerir cambios en el código)`));
        pendingUpdates.major.forEach(pkg => console.log(chalk.red(`    - ${pkg.name}: ${pkg.current} → ${pkg.latest}`)));
    }

    if (!CONFIG.autoUpdate) {
        if (CONFIG.interactiveMode) {
            const shouldUpdate = await askUserConfirmation('\n¿Deseas proceder con las actualizaciones?');
            if (!shouldUpdate) {
                console.log(chalk.yellow('⚠ Actualizaciones canceladas por el usuario'));
                return;
            }
        } else {
            console.log(chalk.yellow('⚠ Actualizaciones disponibles pero modo automático desactivado'));
            return;
        }
    }

    const pm = detectPackageManager();
    const commands = getPackageManagerCommands(pm);

    const updateStrategies = {
        patch: [...pendingUpdates.patch],
        minor: [...pendingUpdates.patch, ...pendingUpdates.minor],
        major: [...pendingUpdates.patch, ...pendingUpdates.minor, ...pendingUpdates.major]
    };

    const updatesToApply = updateStrategies[CONFIG.updateStrategy] || updateStrategies.minor;

    if (updatesToApply.length === 0) {
        console.log(chalk.green('✓ No hay actualizaciones que aplicar con la estrategia actual'));
        return;
    }

    console.log(chalk.cyan(`\n🚀 Aplicando ${updatesToApply.length} actualizaciones con estrategia '${CONFIG.updateStrategy}'...`));

    const packageJsonBackup = fs.readFileSync('package.json', 'utf-8');
    const backupPath = `package.json.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, packageJsonBackup);
    console.log(chalk.dim(`📄 Backup creado: ${backupPath}`));

    let successCount = 0;
    let errorCount = 0;

    try {
        updatePackageJsonVersions(updatesToApply, CONFIG.updateStrategy);

        console.log(chalk.cyan('\n📦 Instalando dependencias actualizadas...'));

        if (pm === 'bun') {
            execSync('bun install', { stdio: 'inherit' });
            console.log(chalk.green('✅ Dependencias instaladas con Bun'));
        } else if (pm === 'npm') {
            execSync('npm install', { stdio: 'inherit' });
            console.log(chalk.green('✅ Dependencias instaladas con npm'));
        } else if (pm === 'yarn') {
            execSync('yarn install', { stdio: 'inherit' });
            console.log(chalk.green('✅ Dependencias instaladas con Yarn'));
        } else if (pm === 'pnpm') {
            execSync('pnpm install', { stdio: 'inherit' });
            console.log(chalk.green('✅ Dependencias instaladas con pnpm'));
        }

        successCount = updatesToApply.length;
        console.log(chalk.green(`\n✅ Actualizaciones completadas exitosamente: ${successCount} paquetes actualizados`));

        console.log(chalk.cyan('\n📋 Resumen de actualizaciones aplicadas:'));
        updatesToApply.forEach(update => {
            const targetVersion = CONFIG.updateStrategy === 'major' ? update.latest : (update.wanted || update.latest);
            console.log(chalk.green(`  ✓ ${update.name}: ${update.current} → ${targetVersion}`));
        });

        fs.unlinkSync(backupPath);
        console.log(chalk.dim('\n🗑️  Backup eliminado (actualizaciones exitosas)'));

    } catch (error) {
        console.log(chalk.red(`\n❌ Error durante las actualizaciones: ${error.message}`));
        console.log(chalk.yellow(`🔄 Restaurando desde backup: ${backupPath}`));

        fs.writeFileSync('package.json', packageJsonBackup);
        console.log(chalk.green('✓ package.json restaurado desde backup'));

        try {
            console.log(chalk.cyan('📦 Restaurando dependencias...'));
            execSync(commands.install, { stdio: 'inherit' });
            console.log(chalk.green('✓ Dependencias restauradas'));
        } catch (restoreError) {
            console.log(chalk.red(`❌ Error restaurando dependencias: ${restoreError.message}`));
        }

        addIssue('errors', `Error durante actualizaciones: ${error.message}`, 'CRITICAL');
        errorCount = updatesToApply.length;
    }

    return { successCount, errorCount };
}

/**
 * Comando específico para actualizar con diferentes estrategias
 */
async function updateWithStrategy(strategy = 'minor') {
    console.log(chalk.cyan(`\n🔄 Ejecutando actualización con estrategia '${strategy}'...`));

    const pm = detectPackageManager();
    console.log(chalk.dim(`Usando ${pm} como package manager`));

    const packageJsonBackup = fs.readFileSync('package.json', 'utf-8');
    const backupPath = `package.json.backup.${Date.now()}`;
    fs.writeFileSync(backupPath, packageJsonBackup);
    console.log(chalk.dim(`📄 Backup creado: ${backupPath}`));

    try {
        if (pm === 'bun') {
            if (strategy === 'major') {
                console.log(chalk.blue('🚀 Actualizando a versiones major (puede romper compatibilidad)...'));
                execSync('bun update --latest', { stdio: 'inherit' });
            } else {
                console.log(chalk.blue('📦 Actualizando dependencias...'));
                execSync('bun update', { stdio: 'inherit' });
            }
        } else if (pm === 'npm') {
            if (strategy === 'major') {
                console.log(chalk.blue('🚀 Actualizando a versiones major con npm-check-updates...'));
                try {
                    execSync('npx npm-check-updates -u', { stdio: 'inherit' });
                    execSync('npm install', { stdio: 'inherit' });
                } catch {
                    console.log(chalk.yellow('⚠ npm-check-updates no disponible, usando npm update'));
                    execSync('npm update', { stdio: 'inherit' });
                }
            } else {
                execSync('npm update', { stdio: 'inherit' });
            }
        } else if (pm === 'yarn') {
            if (strategy === 'major') {
                console.log(chalk.blue('🚀 Actualizando a versiones major...'));
                try {
                    execSync('yarn upgrade --latest', { stdio: 'inherit' });
                } catch {
                    execSync('yarn upgrade', { stdio: 'inherit' });
                }
            } else {
                execSync('yarn upgrade', { stdio: 'inherit' });
            }
        } else if (pm === 'pnpm') {
            if (strategy === 'major') {
                console.log(chalk.blue('🚀 Actualizando a versiones major...'));
                execSync('pnpm update --latest', { stdio: 'inherit' });
            } else {
                execSync('pnpm update', { stdio: 'inherit' });
            }
        }

        console.log(chalk.green('✅ Actualización completada exitosamente'));

        fs.unlinkSync(backupPath);
        console.log(chalk.dim('🗑️  Backup eliminado (actualización exitosa)'));

        return true;

    } catch (error) {
        console.log(chalk.red(`❌ Error durante la actualización: ${error.message}`));
        console.log(chalk.yellow(`🔄 Restaurando desde backup: ${backupPath}`));

        fs.writeFileSync('package.json', packageJsonBackup);
        console.log(chalk.green('✓ package.json restaurado desde backup'));

        const commands = getPackageManagerCommands(pm);
        try {
            console.log(chalk.cyan('📦 Restaurando dependencias...'));
            execSync(commands.install, { stdio: 'inherit' });
            console.log(chalk.green('✓ Dependencias restauradas'));
        } catch (restoreError) {
            console.log(chalk.red(`❌ Error restaurando dependencias: ${restoreError.message}`));
        }

        return false;
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
 * Procesa argumentos de línea de comandos
 */
function processArguments() {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    if (args.includes('--update') || args.includes('-u')) {
        CONFIG.autoUpdate = true;
        CONFIG.interactiveMode = false;
    }

    if (args.includes('--interactive') || args.includes('-i')) {
        CONFIG.interactiveMode = true;
    }

    if (args.includes('--bun')) {
        CONFIG.packageManager = 'bun';
    }

    if (args.includes('--npm')) {
        CONFIG.packageManager = 'npm';
    }

    if (args.includes('--yarn')) {
        CONFIG.packageManager = 'yarn';
    }

    if (args.includes('--pnpm')) {
        CONFIG.packageManager = 'pnpm';
    }

    if (args.includes('--quick-update') || args.includes('-q')) {
        CONFIG.quickUpdate = true;
        CONFIG.autoUpdate = true;
        CONFIG.interactiveMode = false;
    }

    const strategyIndex = args.findIndex(arg => arg === '--strategy');
    if (strategyIndex !== -1 && args[strategyIndex + 1]) {
        const strategy = args[strategyIndex + 1];
        if (['patch', 'minor', 'major'].includes(strategy)) {
            CONFIG.updateStrategy = strategy;
        }
    }
}

/**
 * Muestra ayuda
 */
function showHelp() {
    console.log(chalk.cyan('📋 Analizador de Dependencias\n'));
    console.log('Uso: node dependency-analyzer.js [opciones]\n');
    console.log('Opciones:');
    console.log('  -h, --help              Muestra esta ayuda');
    console.log('  -u, --update            Actualiza automáticamente las dependencias');
    console.log('  -i, --interactive       Modo interactivo (pregunta antes de actualizar)');
    console.log('  -q, --quick-update      Actualización rápida sin análisis detallado');
    console.log('  --bun                   Fuerza el uso de Bun como package manager');
    console.log('  --npm                   Fuerza el uso de npm como package manager');
    console.log('  --yarn                  Fuerza el uso de Yarn como package manager');
    console.log('  --pnpm                  Fuerza el uso de pnpm como package manager');
    console.log('  --strategy [patch|minor|major]  Estrategia de actualización');
    console.log('\nEjemplos:');
    console.log('  node dependency-analyzer.js                    # Solo analizar');
    console.log('  node dependency-analyzer.js --update --bun     # Actualizar con Bun');
    console.log('  node dependency-analyzer.js -q --bun          # Actualización rápida con Bun');
}

/**
 * Muestra el resumen final
 */
function showSummary() {
    const totalIssues = Object.values(issues).reduce((acc, arr) => acc + arr.length, 0);
    const totalUpdates = pendingUpdates.patch.length + pendingUpdates.minor.length + pendingUpdates.major.length;

    console.log(chalk.cyan('\n📊 Resumen de análisis:'));
    console.log(`Package Manager: ${detectPackageManager()}`);
    console.log(`Total de problemas: ${totalIssues}`);

    if (totalUpdates > 0) {
        console.log(chalk.cyan('\nActualizaciones disponibles:'));
        console.log(`- Patches: ${pendingUpdates.patch.length}`);
        console.log(`- Menores: ${pendingUpdates.minor.length}`);
        console.log(`- Mayores: ${pendingUpdates.major.length}`);
    }

    if (totalIssues > 0) {
        console.log(chalk.yellow('\n⚠ Se encontraron dependencias desactualizadas.'));
        console.log(chalk.cyan('\n🛠️ Comandos útiles:'));
        const pm = detectPackageManager();
        if (pm === 'bun') {
            console.log(chalk.dim('  Actualizar todas: bun update'));
            console.log(chalk.dim('  Actualizar a latest: bun add <package>@latest'));
        } else if (pm === 'npm') {
            console.log(chalk.dim('  Actualizar todas: npm update'));
            console.log(chalk.dim('  Actualizar a major: npx npm-check-updates -u && npm install'));
        }
    } else {
        console.log(chalk.green('\n✅ Todas las dependencias están actualizadas.'));
    }
}

/**
 * Función principal
 */
async function main() {
    processArguments();

    console.log(chalk.cyan('🔍 Iniciando análisis de dependencias...'));
    console.log(chalk.dim(`Package Manager detectado: ${detectPackageManager()}`));

    if (CONFIG.quickUpdate) {
        console.log(chalk.cyan('\n⚡ Modo actualización rápida activado'));
        const success = await updateWithStrategy(CONFIG.updateStrategy);
        if (success) {
            console.log(chalk.green('\n✅ Actualización rápida completada exitosamente'));
        } else {
            console.log(chalk.red('\n❌ Error en actualización rápida'));
            process.exit(1);
        }
        return;
    }

    await checkOutdatedDependencies();

    if (CONFIG.autoUpdate || CONFIG.interactiveMode) {
        await updateDependencies();
    }

    showSummary();

    if (severityCounts.critical > 0) {
        process.exit(1);
    }
}

// Ejecutar análisis
main().catch(error => {
    console.error(`Error en el análisis: ${error.message}`);
    process.exit(1);
});