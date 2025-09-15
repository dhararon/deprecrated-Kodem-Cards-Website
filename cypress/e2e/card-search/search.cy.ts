describe('Búsqueda de Cartas', () => {
    beforeEach(() => {
        // Iniciar sesión antes de cada prueba
        cy.visit('/login');
        cy.get('input[type="email"]').type('test@example.com');
        cy.get('input[type="password"]').type('test123');
        cy.get('button[type="submit"]').click();

        // Esperar a que esté autenticado
        cy.url().should('not.include', '/login');

        // Ir a la página de creación de mazos donde está el componente de búsqueda
        cy.visit('/decks/new');
    });

    it('muestra el componente de búsqueda correctamente', () => {
        // Verificar que los elementos de búsqueda estén presentes
        cy.get('input[placeholder*="buscar"]').should('be.visible');
        cy.get('button').contains(/buscar/i).should('be.visible');

        // Verificar que existan filtros por tipo de carta
        cy.get('[data-testid="type-filters"]').should('exist');
    });

    it('muestra resultados al buscar', () => {
        // Realizar una búsqueda
        cy.get('input[placeholder*="buscar"]').type('test');
        cy.get('button').contains(/buscar/i).click();

        // Esperar que aparezcan resultados
        cy.wait(2000);
        cy.get('[data-testid="search-results"]').should('be.visible');

        // Verificar que se muestren cartas
        cy.get('[data-testid="card-item"]').should('have.length.gt', 0);
    });

    it('filtra por tipo de carta', () => {
        // Seleccionar un tipo específico
        cy.get('[data-testid="type-filters"]').within(() => {
            cy.get('input[type="checkbox"]').first().check();
        });

        // Realizar una búsqueda
        cy.get('input[placeholder*="buscar"]').type('test');
        cy.get('button').contains(/buscar/i).click();

        // Esperar que aparezcan resultados
        cy.wait(2000);

        // Verificar que las cartas que se muestran son del tipo seleccionado
        cy.get('[data-testid="card-item"]').first().should('include.text', 'attack');
    });

    it('permite agregar cartas al mazo', () => {
        // Realizar una búsqueda
        cy.get('input[placeholder*="buscar"]').type('test');
        cy.get('button').contains(/buscar/i).click();

        // Esperar que aparezcan resultados
        cy.wait(2000);

        // Contar inicialmente cuántas cartas hay en el mazo
        cy.get('[data-testid="selected-cards-count"]').then(($count) => {
            const initialCount = parseInt($count.text().split('/')[0]) || 0;

            // Agregar una carta
            cy.get('button[aria-label*="agregar"]').first().click();

            // Verificar que el contador se haya incrementado
            cy.get('[data-testid="selected-cards-count"]').should(($newCount) => {
                const newCount = parseInt($newCount.text().split('/')[0]) || 0;
                expect(newCount).to.be.greaterThan(initialCount);
            });
        });
    });

    it('muestra las cartas ya seleccionadas y permite eliminarlas', () => {
        // Agregar una carta primero
        cy.get('input[placeholder*="buscar"]').type('test');
        cy.get('button').contains(/buscar/i).click();
        cy.wait(2000);
        cy.get('button[aria-label*="agregar"]').first().click();

        // Verificar que la carta aparezca en la lista de seleccionadas
        cy.get('[data-testid="selected-cards-list"]').should('be.visible');
        cy.get('[data-testid="selected-card-item"]').should('have.length.gt', 0);

        // Capturar el conteo actual
        cy.get('[data-testid="selected-cards-count"]').then(($count) => {
            const initialCount = parseInt($count.text().split('/')[0]) || 0;

            // Eliminar la carta
            cy.get('[data-testid="selected-card-item"]').first().within(() => {
                cy.get('button[aria-label*="eliminar"]').click();
            });

            // Verificar que el contador haya disminuido
            cy.get('[data-testid="selected-cards-count"]').should(($newCount) => {
                const newCount = parseInt($newCount.text().split('/')[0]) || 0;
                expect(newCount).to.be.lessThan(initialCount);
            });
        });
    });

    it('respeta el límite máximo de cartas en el mazo', () => {
        // Seleccionar cartas hasta alcanzar el máximo
        cy.get('input[placeholder*="buscar"]').type('test');
        cy.get('button').contains(/buscar/i).click();
        cy.wait(2000);

        // Agregar el máximo de cartas (34)
        for (let i = 0; i < 34; i++) {
            cy.get('button[aria-label*="agregar"]').first().click();
            cy.wait(200);
        }

        // Verificar que el contador muestre el máximo
        cy.get('[data-testid="selected-cards-count"]').should('include.text', '34/34');

        // Verificar que los botones de agregar estén deshabilitados
        cy.get('button[aria-label*="agregar"]').first().should('be.disabled');
    });
}); 