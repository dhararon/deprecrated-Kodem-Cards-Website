// Importar comandos de Cypress
import './commands';

// Ocultar las advertencias de XHR en las pruebas
const resizeObserverLoopError = /^[^(ResizeObserver loop limit exceeded)]/;
Cypress.on('uncaught:exception', (err) => {
    if (resizeObserverLoopError.test(err.message)) {
        return false;
    }
});

// Configuración de Firebase para pruebas
beforeEach(() => {
    cy.intercept('POST', /^https:\/\/identitytoolkit\.googleapis\.com\/.*/, (req) => {
        // Mock de autenticación exitosa
        if (req.body.email === 'test@example.com' && req.body.password === 'test123') {
            req.reply({
                statusCode: 200,
                body: {
                    kind: 'identitytoolkit#VerifyPasswordResponse',
                    localId: 'testUserId123',
                    email: 'test@example.com',
                    displayName: 'Test User',
                    idToken: 'fake-id-token',
                    registered: true,
                    refreshToken: 'fake-refresh-token',
                    expiresIn: '3600'
                }
            });
        } else {
            // Mock de error de autenticación
            req.reply({
                statusCode: 400,
                body: {
                    error: {
                        code: 400,
                        message: 'INVALID_PASSWORD',
                        errors: [
                            {
                                message: 'INVALID_PASSWORD',
                                domain: 'global',
                                reason: 'invalid'
                            }
                        ]
                    }
                }
            });
        }
    });

    // Mock para colección de mazos
    cy.intercept('GET', /^https:\/\/firestore\.googleapis\.com\/.*\/decks.*/, {
        statusCode: 200,
        body: {
            documents: [
                {
                    name: 'projects/kodem-cards/databases/(default)/documents/decks/deck1',
                    fields: {
                        name: { stringValue: 'Test Deck 1' },
                        description: { stringValue: 'This is a test deck' },
                        userId: { stringValue: 'testUserId123' },
                        isPublic: { booleanValue: true },
                        cards: { arrayValue: { values: [] } },
                        createdAt: { timestampValue: '2023-01-01T00:00:00Z' },
                        updatedAt: { timestampValue: '2023-01-01T00:00:00Z' }
                    },
                    createTime: '2023-01-01T00:00:00Z',
                    updateTime: '2023-01-01T00:00:00Z'
                }
            ]
        }
    });

    // Mock para colección de cartas
    cy.intercept('GET', /^https:\/\/firestore\.googleapis\.com\/.*\/cards.*/, {
        statusCode: 200,
        body: {
            documents: [
                {
                    name: 'projects/kodem-cards/databases/(default)/documents/cards/card1',
                    fields: {
                        name: { stringValue: 'Test Card 1' },
                        type: { stringValue: 'attack' },
                        imageUrl: { stringValue: 'http://example.com/card1.jpg' },
                        description: { stringValue: 'This is test card 1' }
                    },
                    createTime: '2023-01-01T00:00:00Z',
                    updateTime: '2023-01-01T00:00:00Z'
                },
                {
                    name: 'projects/kodem-cards/databases/(default)/documents/cards/card2',
                    fields: {
                        name: { stringValue: 'Test Card 2' },
                        type: { stringValue: 'defense' },
                        imageUrl: { stringValue: 'http://example.com/card2.jpg' },
                        description: { stringValue: 'This is test card 2' }
                    },
                    createTime: '2023-01-01T00:00:00Z',
                    updateTime: '2023-01-01T00:00:00Z'
                }
            ]
        }
    });
}); 