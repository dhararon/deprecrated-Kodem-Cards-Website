#!/usr/bin/env node

/**
 * Script simplificado para quitar el campo de energía de cartas específicas
 * Usa Firebase client SDK con configuración de producción
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';

// Configuración directa para producción
const firebaseConfig = {
  apiKey: "AIzaSyBT1lP6O-BzYwB6Urf0xm9wQa6a8t7vfEI",
  authDomain: "kodemcards.firebaseapp.com",
  projectId: "kodemcards",
  storageBucket: "kodemcards.appspot.com",
  messagingSenderId: "233423453438",
  appId: "1:233423453438:web:cea6d6a4fedd8d9e93c8e1",
  measurementId: "G-2FBZM0BGTW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CARD_TYPES_TO_REMOVE_ENERGY = ['rot', 'ixim', 'protector', 'bio'];

async function removeEnergyFromCardTypes() {
    console.log('🔍 Iniciando script simplificado...');
    console.log(`📋 Tipos objetivo: ${CARD_TYPES_TO_REMOVE_ENERGY.join(', ')}`);
    
    try {
        const cardsRef = collection(db, 'cards');
        const snapshot = await getDocs(cardsRef);
        
        console.log(`📊 Total cartas: ${snapshot.size}`);
        
        let processed = 0;
        let skipped = 0;
        let errors = 0;
        
        for (const docSnapshot of snapshot.docs) {
            const cardData = docSnapshot.data();
            const cardId = docSnapshot.id;
            
            // Filtrar solo los tipos que nos interesan
            if (!CARD_TYPES_TO_REMOVE_ENERGY.includes(cardData.cardType)) {
                continue;
            }
            
            console.log(`🃏 ${cardData.cardName || 'Sin nombre'} (${cardData.cardType}) - ID: ${cardId}`);
            
            if (!cardData.cardEnergy && cardData.cardEnergy !== 0) {
                console.log('   ⏭️ Ya no tiene energía');
                skipped++;
                continue;
            }
            
            try {
                await updateDoc(doc(db, 'cards', cardId), {
                    cardEnergy: deleteField()
                });
                console.log('   ✅ Energía eliminada');
                processed++;
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`);
                errors++;
            }
        }
        
        console.log('\n📊 Resumen:');
        console.log(`   ✅ Procesadas: ${processed}`);
        console.log(`   ⏭️ Omitidas: ${skipped}`);
        console.log(`   ❌ Errores: ${errors}`);
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
    
    console.log('🏁 Finalizado');
}

removeEnergyFromCardTypes();