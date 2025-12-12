#!/usr/bin/env node

/**
 * Script para quitar el campo de energía (cardEnergy) de las cartas ROT, IXIM, Protector y BIO
 * 
 * Uso: node scripts/remove-energy-from-card-types.ts
 */

import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    connectFirestoreEmulator, 
    collection, 
    getDocs, 
    updateDoc,
    doc,
    query,
    where,
    or,
    deleteField
} from 'firebase/firestore';

// Configuración de Firebase (usando emulador)
const firebaseConfig = {
    projectId: 'kodemcards',
    authDomain: 'kodemcards.firebaseapp.com',
    storageBucket: 'kodemcards.appspot.com',
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Conectar al emulador de Firestore
try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔥 Conectado al emulador de Firestore');
} catch (error) {
    console.log('⚠️ Ya conectado al emulador o usando producción');
}

// Tipos de cartas a los que se les quitará la energía
const CARD_TYPES_TO_REMOVE_ENERGY = ['rot', 'ixim', 'protector', 'bio'];

async function removeEnergyFromCardTypes() {
    try {
        console.log('🔍 Iniciando script para quitar energía de tipos específicos...');
        console.log(`📋 Tipos de cartas objetivo: ${CARD_TYPES_TO_REMOVE_ENERGY.join(', ')}`);
        
        // Consultar todas las cartas que coincidan con los tipos especificados
        const cardsRef = collection(db, 'cards');
        
        // Crear consulta con OR para obtener cartas de los tipos especificados
        const q = query(
            cardsRef,
            or(
                where('cardType', '==', 'rot'),
                where('cardType', '==', 'ixim'),
                where('cardType', '==', 'protector'),
                where('cardType', '==', 'bio')
            )
        );
        
        console.log('📡 Ejecutando consulta...');
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            console.log('⚠️ No se encontraron cartas con los tipos especificados');
            return;
        }
        
        console.log(`📊 Encontradas ${snapshot.size} cartas para procesar`);
        
        let processedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        // Procesar cada carta
        for (const docSnapshot of snapshot.docs) {
            const cardData = docSnapshot.data();
            const cardId = docSnapshot.id;
            
            console.log(`\n🃏 Procesando carta: ${cardData.name || 'Sin nombre'} (${cardData.cardType})`);
            console.log(`   ID: ${cardId}`);
            
            // Verificar si la carta tiene energía
            if (!cardData.cardEnergy) {
                console.log(`   ⏭️  Ya no tiene energía, omitiendo...`);
                skippedCount++;
                continue;
            }
            
            try {
                // Actualizar la carta para quitar el campo cardEnergy
                const cardRef = doc(db, 'cards', cardId);
                
                // Datos a actualizar: remover cardEnergy y actualizar timestamp
                const updateData: any = {
                    updatedAt: new Date(),
                    cardEnergy: deleteField() // Esto realmente elimina el campo
                };
                
                console.log(`   🔄 Actualizando carta...`);
                await updateDoc(cardRef, updateData);
                
                console.log(`   ✅ Energía removida exitosamente`);
                processedCount++;
                
            } catch (error) {
                console.error(`   ❌ Error al actualizar carta:`, error);
                errorCount++;
            }
        }
        
        console.log('\n📊 Resumen de procesamiento:');
        console.log(`   ✅ Cartas procesadas: ${processedCount}`);
        console.log(`   ⏭️  Cartas omitidas: ${skippedCount}`);
        console.log(`   ❌ Errores: ${errorCount}`);
        console.log(`   📋 Total consultadas: ${snapshot.size}`);
        
        if (errorCount === 0) {
            console.log('\n🎉 ¡Proceso completado exitosamente!');
        } else {
            console.log('\n⚠️ Proceso completado con algunos errores. Revisar logs arriba.');
        }
        
    } catch (error) {
        console.error('💥 Error fatal durante el procesamiento:', error);
        process.exit(1);
    }
}

// Función principal
async function main() {
    console.log('🚀 Iniciando script de actualización masiva...');
    console.log('🎯 Objetivo: Remover energía de cartas ROT, IXIM, Protector y BIO');
    console.log('⚠️ ADVERTENCIA: Esta operación modificará los datos en Firestore');
    
    // Confirmación (comentar esta línea si quieres que se ejecute automáticamente)
    // console.log('👉 Descomenta la línea de confirmación en el código para continuar');
    // return;
    
    await removeEnergyFromCardTypes();
    
    console.log('🏁 Script finalizado');
    process.exit(0);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Error no capturado:', error);
        process.exit(1);
    });
}

export default removeEnergyFromCardTypes;