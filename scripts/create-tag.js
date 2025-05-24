#!/usr/bin/env node

/**
 * Script para generar tags y versiones basados en semantic commit
 * 
 * Ejecutar con: bun run tag
 * 
 * Opciones:
 * --create: Crear el tag automáticamente
 * --push: Hacer push del tag al repositorio remoto
 * --force: Forzar la creación del tag incluso si hay problemas con tags pendientes
 * --release: Crear un release en GitHub para el tag (requiere token de GitHub)
 * --prerelease: Marcar el release como prelanzamiento
 * --last-tag: Usar el último tag existente en lugar de crear uno nuevo
 */

import { execSync } from 'child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Función para ejecutar comandos y obtener su salida
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' }).trim();
  } catch (error) {
    console.error(chalk.red(`Error ejecutando comando: ${command}`));
    console.error(chalk.red(error.message));
    return '';
  }
}

// Obtener la última versión desde los tags
function obtenerUltimaVersion() {
  try {
    const ultimaVersion = execCommand('git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0"');
    console.log(chalk.blue(`Última versión: ${ultimaVersion}`));
    return ultimaVersion;
  } catch (error) {
    console.log(chalk.yellow('No se encontraron tags previos. Usando v0.0.0 como inicio.'));
    return 'v0.0.0';
  }
}

// Extraer los números de versión
function extraerNumerosVersion(version) {
  const match = version.match(/v?(\d+)\.(\d+)\.(\d+)/);
  if (match) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10)
    };
  }
  console.log(chalk.yellow('Formato de versión no reconocido. Usando 0.0.0.'));
  return { major: 0, minor: 0, patch: 0 };
}

// Obtener commits desde la última versión
function obtenerCommits(ultimaVersion) {
  const commits = execCommand(`git log ${ultimaVersion}..HEAD --pretty=format:"%s"`);
  if (!commits) {
    console.log(chalk.yellow('No se encontraron nuevos commits desde la última versión.'));
    return [];
  }
  return commits.split('\n');
}

// Analizar los commits para determinar el tipo de cambio
function analizarCommits(commits) {
  let tieneBreaking = false;
  let tieneFeat = false;
  let tieneFix = false;
  const commitsRelevantes = [];

  for (const commit of commits) {
    if (commit.includes('BREAKING CHANGE') || commit.includes('!:')) {
      tieneBreaking = true;
      console.log(chalk.red(`✓ Detectado cambio importante: ${commit}`));
      commitsRelevantes.push(commit);
    } else if (commit.startsWith('feat')) {
      tieneFeat = true;
      console.log(chalk.green(`✓ Detectada nueva característica: ${commit}`));
      commitsRelevantes.push(commit);
    } else if (commit.startsWith('fix')) {
      tieneFix = true;
      console.log(chalk.cyan(`✓ Detectada corrección: ${commit}`));
      commitsRelevantes.push(commit);
    }
  }

  return { tieneBreaking, tieneFeat, tieneFix, commitsRelevantes };
}

// Determinar la nueva versión
function determinarNuevaVersion(version, analisis) {
  const { tieneBreaking, tieneFeat, tieneFix } = analisis;
  let { major, minor, patch } = version;
  let tipoCambio = '';

  if (tieneBreaking) {
    major += 1;
    minor = 0;
    patch = 0;
    tipoCambio = 'MAJOR';
  } else if (tieneFeat) {
    minor += 1;
    patch = 0;
    tipoCambio = 'MINOR';
  } else if (tieneFix) {
    patch += 1;
    tipoCambio = 'PATCH';
  } else {
    console.log(chalk.yellow('No se detectaron cambios que requieran nueva versión.'));
    process.exit(0);
  }

  const nuevaVersion = `v${major}.${minor}.${patch}`;
  console.log(chalk.blue(`Nueva versión (${tipoCambio}): ${nuevaVersion}`));
  return nuevaVersion;
}

// Verificar si hay tags pendientes de push
function verificarTagsPendientes() {
  try {
    // Obtener tags locales
    const tagsLocales = execCommand('git tag').split('\n').filter(Boolean);
    if (tagsLocales.length === 0) {
      return [];
    }

    // Verificar para cada tag si existe en el remoto
    const tagsPendientes = [];
    for (const tag of tagsLocales) {
      // Verificar si el tag existe en el remoto
      const resultado = execCommand(`git ls-remote --tags origin refs/tags/${tag}`);
      if (!resultado) {
        tagsPendientes.push(tag);
      }
    }

    return tagsPendientes;
  } catch (error) {
    console.error(chalk.red('Error al verificar tags pendientes:', error.message));
    return [];
  }
}

// Enviar tags pendientes
function enviarTagsPendientes(tagsPendientes) {
  if (tagsPendientes.length === 0) {
    return true;
  }

  console.log(chalk.yellow(`\n⚠️ Se encontraron ${tagsPendientes.length} tags pendientes de push:`));
  tagsPendientes.forEach(tag => console.log(chalk.yellow(`   - ${tag}`)));
  
  console.log(chalk.blue('\nEnviando tags pendientes...'));
  
  try {
    // Enviar todos los tags pendientes
    for (const tag of tagsPendientes) {
      console.log(chalk.blue(`Enviando tag: ${tag}`));
      execCommand(`git push origin ${tag}`);
    }
    
    console.log(chalk.green('✅ Todos los tags pendientes han sido enviados correctamente.'));
    return true;
  } catch (error) {
    console.error(chalk.red('❌ Error al enviar tags pendientes:', error.message));
    return false;
  }
}

// Obtener información del repositorio
function obtenerInfoRepositorio() {
  try {
    // Obtener la URL del origen remoto
    const remoteUrl = execCommand('git config --get remote.origin.url');
    
    // Extraer el nombre del propietario y repositorio de la URL
    // Soporta formatos: https://github.com/propietario/repositorio.git o git@github.com:propietario/repositorio.git
    let propietario, repositorio;
    
    if (remoteUrl.includes('github.com')) {
      if (remoteUrl.startsWith('https://')) {
        const match = remoteUrl.match(/https:\/\/github\.com\/([^\/]+)\/([^.]+)(\.git)?/);
        if (match) {
          propietario = match[1];
          repositorio = match[2];
        }
      } else if (remoteUrl.includes('git@github.com:')) {
        const match = remoteUrl.match(/git@github\.com:([^\/]+)\/([^.]+)(\.git)?/);
        if (match) {
          propietario = match[1];
          repositorio = match[2];
        }
      }
    }
    
    if (!propietario || !repositorio) {
      throw new Error('No se pudo determinar el propietario o repositorio de GitHub.');
    }
    
    return { propietario, repositorio };
  } catch (error) {
    console.error(chalk.red('Error al obtener información del repositorio:', error.message));
    return null;
  }
}

// Leer token de GitHub desde archivo de configuración o variable de entorno
function obtenerGithubToken() {
  // Primero intentar desde variable de entorno
  let token = process.env.GITHUB_TOKEN;
  if (token) {
    return token;
  }
  
  // Luego intentar desde archivo de configuración en el directorio home del usuario
  try {
    const homedir = process.env.HOME || process.env.USERPROFILE;
    const tokenFilePath = path.join(homedir, '.github_token');
    
    if (fs.existsSync(tokenFilePath)) {
      token = fs.readFileSync(tokenFilePath, 'utf8').trim();
      if (token) {
        return token;
      }
    }
  } catch (error) {
    console.error(chalk.yellow('No se pudo leer el token de GitHub desde el archivo de configuración.'));
  }
  
  return null;
}

// Verificar si un tag ya tiene un release en GitHub
async function verificarReleaseExistente(tag) {
  const token = obtenerGithubToken();
  if (!token) {
    console.error(chalk.red('❌ No se encontró un token de GitHub. Se requiere para verificar releases.'));
    return null;
  }
  
  const repoInfo = obtenerInfoRepositorio();
  if (!repoInfo) {
    console.error(chalk.red('❌ No se pudo obtener información del repositorio de GitHub.'));
    return null;
  }
  
  const { propietario, repositorio } = repoInfo;
  
  console.log(chalk.blue(`Verificando si existe release para el tag ${tag}...`));
  
  const url = `https://api.github.com/repos/${propietario}/${repositorio}/releases/tags/${tag}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Kodem-Cards-Release-Script',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
      },
      redirect: 'follow' // Sigue redirecciones automáticamente
    });
    const responseData = await response.text();
    if (response.status === 200) {
      const data = JSON.parse(responseData);
      console.log(chalk.yellow(`⚠️ El tag ${tag} ya tiene un release en GitHub.`));
      console.log(chalk.yellow(`🔗 URL: ${data.html_url}`));
      return data;
    } else if (response.status === 404) {
      console.log(chalk.blue(`El tag ${tag} no tiene un release en GitHub.`));
      return false;
    } else {
      console.error(chalk.red(`❌ Error al verificar release. Código: ${response.status}`));
      console.error(chalk.red(`Respuesta: ${responseData}`));
      return null;
    }
  } catch (error) {
    console.error(chalk.red('❌ Error al comunicarse con la API de GitHub:', error.message));
    return null;
  }
}

// Crear un release en GitHub
async function crearGithubRelease(tag, mensaje, esPrerelease = false) {
  const token = obtenerGithubToken();
  if (!token) {
    console.error(chalk.red('❌ No se encontró un token de GitHub. Se requiere para crear releases.'));
    console.error(chalk.yellow('Por favor, configura tu token de GitHub de una de estas formas:'));
    console.error(chalk.yellow('1. Establece la variable de entorno GITHUB_TOKEN'));
    console.error(chalk.yellow('2. Crea un archivo ~/.github_token con tu token'));
    return false;
  }
  
  const repoInfo = obtenerInfoRepositorio();
  if (!repoInfo) {
    console.error(chalk.red('❌ No se pudo obtener información del repositorio de GitHub.'));
    return false;
  }
  
  const { propietario, repositorio } = repoInfo;
  
  console.log(chalk.blue(`Creando release para ${tag} en ${propietario}/${repositorio}...`));
  
  // Determinar el tipo de release basado en el número de versión
  const version = extraerNumerosVersion(tag);
  let releaseType = 'Versión de mantenimiento';
  
  if (version.minor > 0 && version.patch === 0) {
    releaseType = 'Nueva funcionalidad';
  } else if (version.patch === 0 && version.minor === 0) {
    releaseType = 'Versión mayor';
  }
  
  // Preparar datos del release
  const data = {
    tag_name: tag,
    name: `${releaseType} ${tag}`,
    body: mensaje,
    draft: false,
    prerelease: esPrerelease
  };
  
  try {
    const response = await fetch(`https://api.github.com/repos/${propietario}/${repositorio}/releases`, {
      method: 'POST',
      headers: {
        'User-Agent': 'Kodem-Cards-Release-Script',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
      },
      body: JSON.stringify(data)
    });
    const responseData = await response.text();
    if (response.status >= 200 && response.status < 300) {
      console.log(chalk.green(`✅ Release ${tag} creado exitosamente en GitHub.`));
      console.log(chalk.green(`🔗 URL: https://github.com/${propietario}/${repositorio}/releases/tag/${tag}`));
      return true;
    } else {
      console.error(chalk.red(`❌ Error al crear release en GitHub. Código: ${response.status}`));
      console.error(chalk.red(`Respuesta: ${responseData}`));
      return false;
    }
  } catch (error) {
    console.error(chalk.red('❌ Error al comunicarse con la API de GitHub:', error.message));
    return false;
  }
}

// Generar mensaje para un tag existente
async function generarMensajeParaTagExistente(tag) {
  console.log(chalk.blue(`Generando mensaje para el tag existente ${tag}...`));
  
  // Obtener el mensaje del tag
  const tagMessage = execCommand(`git tag -l --format='%(contents)' ${tag}`);
  if (tagMessage && tagMessage.length > 0) {
    console.log(chalk.blue('Usando mensaje existente del tag.'));
    return tagMessage;
  }
  
  // Si no hay mensaje, intentar generar uno a partir de los commits
  console.log(chalk.yellow('El tag no tiene mensaje. Generando uno a partir de los commits...'));
  
  // Encontrar el commit del tag
  const tagCommit = execCommand(`git rev-list -n 1 ${tag}`);
  if (!tagCommit) {
    console.error(chalk.red(`No se pudo encontrar el commit para el tag ${tag}.`));
    return `Release ${tag}`;
  }
  
  // Encontrar el commit anterior al tag
  const previousTag = execCommand(`git describe --abbrev=0 --tags ${tagCommit}^@ 2>/dev/null || echo ""`);
  
  // Obtener los commits entre el tag anterior y este tag
  let commits;
  if (previousTag) {
    commits = execCommand(`git log ${previousTag}..${tagCommit} --pretty=format:"%s (%h)"`).split('\n');
  } else {
    commits = execCommand(`git log ${tagCommit} --pretty=format:"%s (%h)" -n 10`).split('\n');
  }
  
  // Filtrar commits relevantes (feat, fix, breaking)
  const commitsRelevantes = commits.filter(commit => 
    commit.startsWith('feat') || 
    commit.startsWith('fix') || 
    commit.includes('BREAKING CHANGE') ||
    commit.includes('!:')
  );
  
  // Crear mensaje
  return `Release ${tag}

${commitsRelevantes.map(commit => `- ${commit}`).join('\n')}

Generado automáticamente.`;
}

// Generar el mensaje para el tag
function generarMensajeTag(ultimaVersion, nuevaVersion, commitsRelevantes) {
  const commitFormateados = commitsRelevantes
    .map(commit => {
      const hash = execCommand(`git log --pretty=format:"%h" --grep="${commit}" -n 1`);
      return `- ${commit} (${hash})`;
    })
    .join('\n');

  return `Version ${nuevaVersion}

${commitFormateados}

Generado automáticamente desde commits semánticos.`;
}

// Verificar si el tag existe en el repositorio local
function verificarTagLocal(tag) {
  const resultado = execCommand(`git tag -l "${tag}"`);
  return !!resultado;
}

// Verificar si el tag existe en el repositorio remoto
function verificarTagRemoto(tag) {
  const resultado = execCommand(`git ls-remote --tags origin refs/tags/${tag}`);
  return !!resultado;
}

// Función principal
async function main() {
  console.log(chalk.bold('🏷️  Generador de Tags y Releases basado en Semantic Commit 🏷️\n'));
  
  // Verificar si estamos en modo "usar último tag existente"
  const usarUltimoTag = process.argv.includes('--last-tag');
  
  // Obtener el último tag
  const ultimoTag = obtenerUltimaVersion();
  
  // Si solo queremos crear un release para el último tag existente
  if (usarUltimoTag && process.argv.includes('--release')) {
    // Verificar si el tag existe en el repositorio remoto
    const tagExisteRemoto = verificarTagRemoto(ultimoTag);
    
    if (!tagExisteRemoto) {
      console.log(chalk.yellow(`El tag ${ultimoTag} no existe en el repositorio remoto. Se hará push antes de crear el release.`));
      execCommand(`git push origin ${ultimoTag}`);
      console.log(chalk.green(`✅ Tag ${ultimoTag} publicado exitosamente.`));
    }
    
    // Verificar si ya existe un release para este tag
    const releaseExistente = await verificarReleaseExistente(ultimoTag);
    
    if (releaseExistente === null) {
      console.error(chalk.red('No se pudo verificar si existe un release para el tag.'));
      process.exit(1);
    } else if (releaseExistente) {
      console.log(chalk.yellow(`Ya existe un release para el tag ${ultimoTag}. No se creará uno nuevo.`));
      process.exit(0);
    }
    
    // Generar mensaje para el release
    const mensaje = await generarMensajeParaTagExistente(ultimoTag);
    
    // Crear el release
    const esPrerelease = process.argv.includes('--prerelease');
    const exito = await crearGithubRelease(ultimoTag, mensaje, esPrerelease);
    
    if (!exito) {
      console.error(chalk.red('No se pudo crear el release.'));
      process.exit(1);
    }
    
    process.exit(0);
  }

  // Si usamos --push, primero verificar si hay tags pendientes
  if (process.argv.includes('--push')) {
    console.log(chalk.blue('Verificando tags pendientes de push...'));
    const tagsPendientes = verificarTagsPendientes();
    
    if (tagsPendientes.length > 0) {
      const resultado = enviarTagsPendientes(tagsPendientes);
      if (!resultado) {
        console.error(chalk.red('❌ No se pudieron enviar todos los tags pendientes. Soluciona los problemas antes de continuar.'));
        // Dependiendo de la política, podrías hacer exit aquí o continuar
        if (!process.argv.includes('--force')) {
          console.log(chalk.yellow('Usa la opción --force para continuar a pesar de los errores.'));
          process.exit(1);
        }
      }
    } else {
      console.log(chalk.green('✅ No hay tags pendientes de push.'));
    }
  }

  // Verificar si hay cambios sin commit
  const cambiosPendientes = execCommand('git status --porcelain');
  if (cambiosPendientes) {
    console.log(chalk.yellow('⚠️  Advertencia: Tienes cambios sin commit. Considera hacer commit antes de crear un tag.'));
    console.log(cambiosPendientes);
    console.log('');
  }

  // Obtener la última versión y sus números
  const version = extraerNumerosVersion(ultimoTag);
  console.log(chalk.blue(`Versión actual: ${version.major}.${version.minor}.${version.patch}`));

  // Obtener y analizar commits
  console.log(chalk.blue(`\nAnalizando commits desde ${ultimoTag}...`));
  const commits = obtenerCommits(ultimoTag);
  
  if (commits.length === 0) {
    console.log(chalk.yellow('No hay commits nuevos desde la última versión.'));
    
    // Si no hay commits nuevos pero se pidió crear un release, intentar crear para el último tag
    if (process.argv.includes('--release')) {
      console.log(chalk.blue(`No hay commits nuevos, pero se solicitó crear un release para el último tag ${ultimoTag}.`));
      
      // Verificar si ya existe un release para este tag
      const releaseExistente = await verificarReleaseExistente(ultimoTag);
      
      if (releaseExistente === null) {
        console.error(chalk.red('No se pudo verificar si existe un release para el tag.'));
        process.exit(1);
      } else if (releaseExistente) {
        console.log(chalk.yellow(`Ya existe un release para el tag ${ultimoTag}. No se creará uno nuevo.`));
        process.exit(0);
      }
      
      // Generar mensaje para el release
      const mensaje = await generarMensajeParaTagExistente(ultimoTag);
      
      // Verificar si el tag está en el remoto
      const tagExisteRemoto = verificarTagRemoto(ultimoTag);
      if (!tagExisteRemoto) {
        console.log(chalk.yellow(`El tag ${ultimoTag} no existe en el repositorio remoto. Se hará push antes de crear el release.`));
        execCommand(`git push origin ${ultimoTag}`);
        console.log(chalk.green(`✅ Tag ${ultimoTag} publicado exitosamente.`));
      }
      
      // Crear el release
      const esPrerelease = process.argv.includes('--prerelease');
      const exito = await crearGithubRelease(ultimoTag, mensaje, esPrerelease);
      
      if (!exito) {
        console.error(chalk.red('No se pudo crear el release.'));
        process.exit(1);
      }
    }
    
    process.exit(0);
  }
  
  const analisis = analizarCommits(commits);

  // Determinar nueva versión
  const nuevaVersion = determinarNuevaVersion(version, analisis);

  // Generar mensaje para el tag
  const mensajeTag = generarMensajeTag(ultimoTag, nuevaVersion, analisis.commitsRelevantes);

  // Mostrar resultado
  console.log(chalk.bold('\n===== MENSAJE DEL TAG ====='));
  console.log(mensajeTag);
  console.log(chalk.bold('==========================\n'));

  console.log(chalk.bold('Para crear el tag, ejecuta:'));
  console.log(chalk.green(`git tag -a ${nuevaVersion} -m "${mensajeTag.replace(/"/g, '\\"')}"`));
  console.log(chalk.green(`git push origin ${nuevaVersion}`));

  // Preguntar si quiere crear el tag automáticamente
  console.log(chalk.bold('\n¿Deseas crear el tag ahora? (s/n)'));
  
  // En un script real se usaría readline, pero por ahora simplemente mostramos cómo se haría
  console.log(chalk.yellow('Para crear el tag automáticamente, ejecuta este script con la opción --create'));
  console.log(chalk.yellow('Ejemplo: bun run tag --create'));
  
  // Si se pasa el argumento --create, crear el tag automáticamente
  if (process.argv.includes('--create')) {
    console.log(chalk.green('\nCreando tag automáticamente...'));
    try {
      execCommand(`git tag -a ${nuevaVersion} -m "${mensajeTag.replace(/"/g, '\\"')}"`);
      console.log(chalk.green(`✅ Tag ${nuevaVersion} creado exitosamente.`));
      
      let tagPusheado = false;
      
      // Hacer push del tag si se solicita
      if (process.argv.includes('--push')) {
        execCommand(`git push origin ${nuevaVersion}`);
        console.log(chalk.green(`✅ Tag ${nuevaVersion} publicado exitosamente.`));
        tagPusheado = true;
      } else {
        console.log(chalk.blue('\n¿Deseas hacer push del tag? (s/n)'));
        console.log(chalk.yellow('Para hacer push automáticamente, ejecuta con la opción --push'));
      }
      
      // Crear release en GitHub si se solicita
      if (process.argv.includes('--release')) {
        // Asegurarse de que el tag esté en el remoto antes de crear el release
        if (!tagPusheado) {
          console.log(chalk.blue('Haciendo push del tag para poder crear el release...'));
          execCommand(`git push origin ${nuevaVersion}`);
          console.log(chalk.green(`✅ Tag ${nuevaVersion} publicado exitosamente.`));
        }
        
        // Crear el release
        const esPrerelease = process.argv.includes('--prerelease');
        const exito = await crearGithubRelease(nuevaVersion, mensajeTag, esPrerelease);
        
        if (!exito) {
          console.log(chalk.yellow('No se pudo crear el release en GitHub, pero el tag fue creado correctamente.'));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error al crear el tag: ${error.message}`));
    }
  }
}

// Ejecutar el script
main().catch(error => {
  console.error(chalk.red(`Error: ${error.message}`));
  process.exit(1);
}); 