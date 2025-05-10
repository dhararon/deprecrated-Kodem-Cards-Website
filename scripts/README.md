# Scripts de utilidad

Este directorio contiene scripts de utilidad para el proyecto Kodem Cards.

## Inserción de usuarios en emulador de Firebase

El script `seed-firebase-users.ts` permite insertar usuarios de prueba con diferentes roles en el emulador de Firebase.

### Requisitos previos

1. Tener los emuladores de Firebase en ejecución:
   ```
   # Si estás usando Docker:
   docker-compose up
   
   # Si estás ejecutando localmente:
   npm run emulators
   # o
   bun run emulators
   ```

2. (Opcional) Archivo `.env` con la variable `VITE_FIREBASE_PROJECT_ID`:
   - El script intentará leer esta variable para el ID del proyecto.
   - Si no existe el archivo o la variable, usará 'kodemcards' como valor predeterminado.

### Ejecución

Para ejecutar el script:

```
# Ejecución local
npm run seed:users
# o
bun run seed:users
```

### Configuración para entornos Docker

Si estás utilizando Docker (como está configurado en el proyecto), asegúrate de que:

1. Los contenedores de Docker estén en ejecución (`docker ps`).
2. Los puertos de los emuladores estén correctamente mapeados en el `docker-compose.yml`:
   - Auth: 9099
   - Firestore: 8080
   - UI de Emuladores: 4000

3. Si ejecutas el script **desde tu máquina host** (fuera de Docker):
   - El script siempre intentará conectarse a `localhost` y los puertos correspondientes.
   - Asegúrate de que los puertos están expuestos correctamente del contenedor a la máquina host.

4. Si ejecutas el script **dentro del contenedor de Docker**:
   - Establece la variable de entorno `DOCKER_CONTAINER=true` 
   - Usa el nombre del servicio (`firebase-emulators`) como host.

### Solución de problemas de conexión

Si encuentras errores de conexión (ECONNRESET, ECONNREFUSED, etc.), verifica lo siguiente:

1. **Emuladores en ejecución**: Comprueba que los contenedores Docker estén activos:
   ```
   docker ps
   ```

2. **Puertos correctos**: Por defecto, el script espera que los emuladores estén en:
   - Auth: http://localhost:9099
   - Firestore: http://localhost:8080

3. **Network Bridge**: Los contenedores deben estar en la misma red para comunicarse por nombre:
   ```
   networks:
     kodem-network:
       driver: bridge
   ```

4. **ProjectID correcto**: El ProjectID (`VITE_FIREBASE_PROJECT_ID`) debe ser el mismo que está configurado en los emuladores.

5. **Timeout**: Si los emuladores tardan en inicializarse, intenta ejecutar el script después de unos segundos.

### Usuarios generados

El script creará los siguientes usuarios:

| Email | Contraseña | Rol | Nombre |
|-------|------------|-----|--------|
| admin@example.com | Password123! | admin | Admin Usuario |
| user@example.com | Password123! | user | Usuario Regular |
| grader@example.com | Password123! | grader | Grader Usuario |
| user2@example.com | Password123! | user | Usuario Secundario |

### Estructura de datos

Para cada usuario, el script crea:

1. Un registro en la autenticación de Firebase con email/contraseña
2. Un documento en la colección `users` con datos básicos
3. Un documento en la colección `userData` con datos adicionales como:
   - Preferencias de usuario
   - Un deck de ejemplo
   - Una lista de favoritos vacía

### Personalización

Puedes modificar los usuarios y sus roles editando el array `testUsers` al inicio del script. 