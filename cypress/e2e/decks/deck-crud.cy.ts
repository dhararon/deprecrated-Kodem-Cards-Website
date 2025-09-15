describe('Operaciones CRUD de Mazos', () => {
    beforeEach(() => {
        // Iniciar sesión antes de cada prueba
        cy.visit('/login');
        cy.get('input[type="email"]').type('test@example.com');
        cy.get('input[type="password"]').type('test123');
        cy.get('button[type="submit"]').click();

        // Esperar a que esté autenticado
        cy.url().should('not.include', '/login');
    });

    it('muestra la lista de mazos del usuario', () => {
        // Visitar la página de mazos
        cy.visit('/decks');

        // Verificar que se muestren los mazos (o un mensaje si no hay)
        cy.contains(/mis mazos/i).should('be.visible');

        // Debería mostrar al menos un mazo o un mensaje que indique que no hay mazos
        cy.get('[data-testid="deck-list"]').then(($list) => {
            if ($list.find('[data-testid="deck-item"]').length > 0) {
                cy.get('[data-testid="deck-item"]').should('be.visible');
            } else {
                cy.contains(/no tienes mazos|crear tu primer mazo/i).should('be.visible');
            }
        });
    });

    it('crea un nuevo mazo correctamente', () => {
        // Visitar la página de creación de mazos
        cy.visit('/decks/new');

        // Llenar el formulario
        const deckName = `Test Deck ${Date.now()}`;
        cy.get('input[name="name"]').type(deckName);
        cy.get('textarea[name="description"]').type('Deck de prueba creado con Cypress');

        // Buscar cartas
        cy.get('input[placeholder*="buscar"]').type('test');
        cy.get('button').contains(/buscar/i).click();

        // Seleccionar suficientes cartas para cumplir con el mínimo
        cy.wait(2000); // Esperar a que aparezcan los resultados

        // Añadir al menos 16 cartas (el requisito mínimo)
        for (let i = 0; i < 16; i++) {
            cy.get('button[aria-label*="agregar"]').first().click();
            cy.wait(200); // Esperar un poco entre clics
        }

        // Guardar el mazo
        cy.contains('button', /crear|guardar/i).click();

        // Verificar que se haya creado correctamente
        cy.url().should('include', '/decks/');
        cy.contains(deckName).should('be.visible');
    });

    it('visualiza los detalles de un mazo', () => {
        // Visitar la página de mazos
        cy.visit('/decks');

        // Hacer clic en el primer mazo
        cy.get('[data-testid="deck-item"]').first().click();

        // Verificar que se muestren los detalles
        cy.get('[data-testid="deck-details"]').should('be.visible');
        cy.get('[data-testid="deck-cards"]').should('be.visible');
    });

    it('edita un mazo existente', () => {
        // Visitar la página de mazos
        cy.visit('/decks');

        // Acceder al primer mazo
        cy.get('[data-testid="deck-item"]').first().click();

        // Hacer clic en el botón de editar
        cy.contains('button', /editar/i).click();

        // Modificar el nombre del mazo
        const newName = `Mazo Editado ${Date.now()}`;
        cy.get('input[name="name"]').clear().type(newName);

        // Guardar los cambios
        cy.contains('button', /guardar|actualizar/i).click();

        // Verificar que los cambios se hayan guardado
        cy.contains(newName).should('be.visible');
    });

    it('elimina un mazo existente', () => {
        // Crear un mazo para eliminar
        const deleteName = `Delete Test ${Date.now()}`;

        // Visitar la página de creación de mazos
        cy.visit('/decks/new');

        // Llenar el formulario
        cy.get('input[name="name"]').type(deleteName);
        cy.get('textarea[name="description"]').type('Mazo para probar eliminación');

        // Buscar y añadir cartas suficientes
        cy.get('input[placeholder*="buscar"]').type('test');
        cy.get('button').contains(/buscar/i).click();
        cy.wait(2000);

        for (let i = 0; i < 16; i++) {
            cy.get('button[aria-label*="agregar"]').first().click();
            cy.wait(200);
        }

        // Guardar el mazo
        cy.contains('button', /crear|guardar/i).click();

        // Verificar creación
        cy.url().should('include', '/decks/');
        cy.contains(deleteName).should('be.visible');

        // Eliminar el mazo
        cy.contains('button', /eliminar/i).click();
        cy.contains('button', /confirmar/i).click();

        // Verificar que el mazo ya no exista
        cy.visit('/decks');
        cy.contains(deleteName).should('not.exist');
    });
}); 