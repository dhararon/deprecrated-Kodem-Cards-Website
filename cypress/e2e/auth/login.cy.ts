describe('Autenticación', () => {
    beforeEach(() => {
        // Visitar la página de inicio de sesión antes de cada prueba
        cy.visit('/login');
    });

    it('muestra el formulario de inicio de sesión', () => {
        // Verificar que existan los elementos del formulario
        cy.get('input[type="email"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
        cy.get('button[type="submit"]').should('be.visible');
    });

    it('muestra un error cuando los campos están vacíos', () => {
        // Hacer clic en el botón de inicio de sesión sin llenar los campos
        cy.get('button[type="submit"]').click();

        // Verificar que se muestre un mensaje de error
        cy.contains(/todos los campos son obligatorios|campos requeridos/i).should('be.visible');
    });

    it('muestra un error con credenciales incorrectas', () => {
        // Llenar el formulario con credenciales incorrectas
        cy.get('input[type="email"]').type('wrong@example.com');
        cy.get('input[type="password"]').type('wrongpassword');
        cy.get('button[type="submit"]').click();

        // Verificar que se muestre un mensaje de error
        cy.contains(/credenciales inválidas|contraseña incorrecta/i, { timeout: 10000 }).should('be.visible');
    });

    it('inicia sesión correctamente y redirige', () => {
        // Llenar el formulario con credenciales correctas
        cy.get('input[type="email"]').type('test@example.com');
        cy.get('input[type="password"]').type('test123');
        cy.get('button[type="submit"]').click();

        // Verificar que se redirige a la página principal o dashboard
        cy.url().should('not.include', '/login');

        // Verificar que se muestre algún elemento que indique que ha iniciado sesión
        cy.contains(/bienvenido|perfil|logout/i, { timeout: 10000 }).should('be.visible');
    });

    it('permite cerrar sesión', () => {
        // Iniciar sesión primero
        cy.get('input[type="email"]').type('test@example.com');
        cy.get('input[type="password"]').type('test123');
        cy.get('button[type="submit"]').click();

        // Esperar a estar autenticado
        cy.url().should('not.include', '/login');

        // Buscar y hacer clic en el botón/enlace de cerrar sesión
        cy.contains(/cerrar sesión|logout|salir/i).click();

        // Verificar que se haya cerrado sesión (redireccionado a login o muestra un botón de login)
        cy.url().should('include', '/login').or('contain', '/auth');
    });
}); 