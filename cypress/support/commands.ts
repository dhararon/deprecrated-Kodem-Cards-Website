// Agregar comandos personalizados de Cypress

// -- Comando para el inicio de sesión --
Cypress.Commands.add('login', (email = 'test@example.com', password = 'test123') => {
    cy.visit('/login');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Esperar a que se redirija a la página principal después del inicio de sesión
    cy.url().should('not.include', '/login');
});

// -- Comando para crear un nuevo mazo --
Cypress.Commands.add('createDeck', (name = 'Test Deck', description = 'Cypress test deck') => {
    cy.visit('/decks/new');
    cy.get('input[name="name"]').type(name);
    cy.get('textarea[name="description"]').type(description);

    // Buscar y añadir algunas cartas
    cy.get('input[placeholder*="buscar"]').type('test');
    cy.get('button[aria-label*="buscar"]').click();

    // Esperar a que aparezcan los resultados y agregar al menos 16 cartas
    cy.get('button[aria-label*="agregar"]').first().click();

    // Completar la creación del mazo
    cy.contains('button', /crear|guardar/i).click();

    // Esperar a que se redirija a la página de detalles del mazo
    cy.url().should('include', '/decks/');
});

// -- Comando para eliminar un mazo --
Cypress.Commands.add('deleteDeck', (deckId) => {
    cy.visit(`/decks/${deckId}`);
    cy.contains('button', /eliminar/i).click();
    cy.contains('button', /confirmar/i).click();

    // Esperar a que se redirija a la página de mazos
    cy.url().should('include', '/decks');
    cy.url().should('not.include', deckId);
});

// Declarar los tipos para los comandos personalizados
declare global {
    namespace Cypress {
        interface Chainable {
            /**
             * Inicia sesión con el usuario y contraseña proporcionados
             * @param email - Email del usuario (por defecto: test@example.com)
             * @param password - Contraseña del usuario (por defecto: test123)
             */
            login(email?: string, password?: string): Chainable<void>;

            /**
             * Crea un nuevo mazo con el nombre y descripción proporcionados
             * @param name - Nombre del mazo (por defecto: Test Deck)
             * @param description - Descripción del mazo (por defecto: Cypress test deck)
             */
            createDeck(name?: string, description?: string): Chainable<void>;

            /**
             * Elimina un mazo con el ID proporcionado
             * @param deckId - ID del mazo a eliminar
             */
            deleteDeck(deckId: string): Chainable<void>;
        }
    }
} 