#!/usr/bin/env node

/**
 * Script para quitar el campo de energía (cardEnergy) de las cartas ROT, IXIM, Protector y BIO
 * Usando Firebase Admin SDK con permisos completos
 * 
 * Uso: node scripts/remove-energy-admin.ts
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🔧 Iniciando script con Firebase Admin SDK...');

// Cargar la clave de servicio
const serviceAccountPath = resolve(process.cwd(), 'serviceAccount.json');
console.log(`📁 Buscando archivo en: ${serviceAccountPath}`);

let serviceAccount;

try {
    const fileContent = readFileSync(serviceAccountPath, 'utf8');
    serviceAccount = JSON.parse(fileContent);
    console.log('✅ Archivo serviceAccount.json cargado correctamente');
    console.log(`📋 Project ID: ${serviceAccount.project_id}`);
} catch (error) {
    console.error('❌ Error al cargar serviceAccount.json:', error);
    process.exit(1);
}

// Inicializar Firebase Admin
try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });
        console.log('🔥 Firebase Admin inicializado correctamente');
    }
} catch (error) {
    console.error('❌ Error al inicializar Firebase Admin:', error);
    process.exit(1);
}

const db = admin.firestore();

// Tipos de cartas a los que se les quitará la energía
//const CARD_TYPES_TO_REMOVE_ENERGY = ['rot', 'ixim', 'protector', 'bio'];
const CARD_TYPES_TO_REMOVE_ENERGY = ['token'];

async function testConnection() {
    try {
        console.log('🔧 Probando conexión a Firestore...');
        const testRef = db.collection('cards').limit(1);
        const testSnapshot = await testRef.get();
        console.log('✅ Conexión exitosa a Firestore');
        return true;
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        return false;
    }
}

async function removeEnergyFromCardTypes() {
    try {
        // Probar conexión primero
        const connectionOk = await testConnection();
        if (!connectionOk) {
            console.log('💡 Sugerencia: Verifica que las credenciales en serviceAccount.json sean correctas');
            process.exit(1);
        }
        
        console.log('🔍 Iniciando script para quitar energía de tipos específicos...');
        console.log(`📋 Tipos de cartas objetivo: ${CARD_TYPES_TO_REMOVE_ENERGY.join(', ')}`);
        
        console.log('📡 Obteniendo todas las cartas...');
        
        // Configurar timeout para la conexión
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: conexión a Firestore tardó más de 30 segundos')), 30000);
        });
        
        // Obtener todas las cartas con timeout
        const cardsRef = db.collection('cards');
        const snapshot = await Promise.race([
            cardsRef.get(),
            timeoutPromise
        ]);
        
        console.log(`📊 Total de cartas encontradas: ${(snapshot as any).size}`);
        
        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let totalRelevantCards = 0;
        
        console.log('🔄 Procesando cartas...');
        
        // Procesar cada carta
        for (const docSnapshot of (snapshot as any).docs) {
            const cardData = docSnapshot.data();
            const cardId = docSnapshot.id;
            
            // Verificar si es del tipo que queremos modificar
            if (!CARD_TYPES_TO_REMOVE_ENERGY.includes(cardData.cardType)) {
                continue; // Saltar cartas que no son del tipo objetivo
            }
            
            totalRelevantCards++;
            console.log(`🃏 [${totalRelevantCards}] Procesando: ${cardData.cardName || 'Sin nombre'} (${cardData.cardType}) - ID: ${cardId}`);
            
            // Verificar si tiene el campo de energía
            if (!cardData.cardEnergy && cardData.cardEnergy !== 0) {
                console.log('   ⏭️  Ya no tiene energía, omitiendo...');
                skippedCount++;
                continue;
            }
            
            try {
                console.log(`   🔄 Actualizando carta... (energía actual: ${cardData.cardEnergy})`);
                
                // Remover el campo cardEnergy usando FieldValue.delete()
                await cardsRef.doc(cardId).update({
                    cardEnergy: admin.firestore.FieldValue.delete()
                });
                
                console.log('   ✅ Campo de energía eliminado exitosamente');
                processedCount++;
                
                // Pequeña pausa para evitar rate limiting
                if (processedCount % 10 === 0) {
                    console.log(`   ⏸️  Pausa breve después de ${processedCount} actualizaciones...`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (updateError) {
                console.log('   ❌ Error al actualizar carta:', updateError.message);
                errorCount++;
            }
        }
        
        console.log('\n📊 Resumen de procesamiento:');
        console.log(`   ✅ Cartas procesadas: ${processedCount}`);
        console.log(`   ⏭️  Cartas omitidas: ${skippedCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📋 Total consultadas: ${snapshot.size}`);
        
        if (errorCount > 0) {
            console.log('\n⚠️ Proceso completado con algunos errores. Revisar logs arriba.');
        } else {
            console.log('\n🎉 Proceso completado exitosamente. Todas las cartas fueron actualizadas.');
        }
        
    } catch (error) {
        console.error('❌ Error general en el script:', error);
    } finally {
        console.log('🏁 Script finalizado');
        process.exit(0);
    }
}

// Ejecutar el script
removeEnergyFromCardTypes();