# Spacecraft Command — Frontend

Frontend en React (Vite) para la API [spacecraftSystem](https://github.com/darwinrocha85/spacecraftSystem): un panel de control con estética espacial para gestionar una flota de naves (listado paginado, búsqueda por nombre, alta, edición y borrado).

## Stack

- React 18 + Vite 5
- Axios para consumir la API REST
- CSS puro (sin frameworks), tema espacial con canvas de estrellas animado
- Firebase Hosting para el despliegue

## Requisitos previos

- Node.js 18+ y npm
- El backend `spacecraftSystem` corriendo (por defecto en `http://localhost:8080`)
- Una cuenta de Firebase con el proyecto ya creado (para el despliegue)

## Puesta en marcha local

```bash
npm install
cp .env.example .env   # ajusta VITE_API_URL si tu backend no corre en localhost:8080
npm run dev
```

Abre `http://localhost:5173`. Antes de esto, arranca el backend:

```bash
# en el repo spacecraftSystem
./mvnw spring-boot:run
```

## ⚠️ Importante: habilitar CORS en el backend

El backend **no tiene configurado CORS** actualmente (no hay ningún `@CrossOrigin` ni `WebMvcConfigurer` en el repo). Mientras el frontend corre en `localhost:5173` y el backend en `localhost:8080` normalmente el navegador lo bloqueará por ser orígenes distintos, y **una vez despliegues el frontend a Firebase Hosting, sus llamadas a tu backend local serán rechazadas si no agregas CORS.**

Solución: agrega esta clase al backend (`src/main/java/com/rocha/spacecraftmanagementsystem/config/CorsConfig.java`):

```java
package com.rocha.spacecraftmanagementsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(
                                "http://localhost:5173",
                                "https://TU-PROYECTO.web.app",
                                "https://TU-PROYECTO.firebaseapp.com"
                        )
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
```

Reemplaza `TU-PROYECTO` por el dominio real que te da Firebase Hosting al desplegar.

## ⚠️ Aviso: el switch "armada" no se guarda al editar (bug del backend)

Revisando `SpacecraftService.updateSpacecraft(...)` en el backend, el método actualiza `name`, `franchise`, `crewCapacity`, `speed` y `spacecraftType`, pero **nunca llama a `spacecraft.setIsArmed(...)`**. Es decir: aunque el frontend envía `isArmed` correctamente en el `PUT`, el backend lo ignora al editar (sí funciona al **crear**, vía `POST`).

Para corregirlo, agrega esta línea en `SpacecraftService.java`, dentro de `updateSpacecraft`, junto a los demás `spacecraft.setX(...)`:

```java
spacecraft.setIsArmed(spacecraftDetails.getIsArmed());
```

El frontend ya está listo para que esto funcione en cuanto lo corrijas — no necesitas cambiar nada aquí.

## Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para servir estáticamente.

## Desplegar en Firebase Hosting

```bash
npm install -g firebase-tools   # si no lo tienes
firebase login
firebase use --add              # selecciona tu proyecto Firebase ya creado
npm run build
firebase deploy --only hosting
```

`firebase.json` ya está configurado para servir `dist/` con rewrite a `index.html` (necesario porque es una SPA). Actualiza `.firebaserc` con el Project ID real antes de desplegar (o usa `firebase use --add`, que lo hace por ti).

Recuerda: como el backend corre en tu máquina (`localhost:8080`), el sitio desplegado en Firebase solo podrá hablar con la API mientras tu backend esté corriendo y accesible desde tu navegador (y con CORS habilitado, ver arriba). Para una demo pública real necesitarías desplegar también el backend en algún servicio con acceso público.

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `VITE_API_URL` | URL base de la API (sin `/` final) | `http://localhost:8080/api` |

## Estructura del proyecto

```
src/
  api/spacecraftApi.js      # cliente axios + adaptadores de respuesta
  components/                # UI: tabla, formulario, paginación, búsqueda, modales
  hooks/useSpacecrafts.js    # estado y lógica de datos (listar/paginar/buscar/CRUD)
  styles/index.css           # tema visual espacial
  App.jsx / main.jsx
```

## Funcionalidades

- Listado paginado (`GET /api/spacecrafts/page`) con orden por columna (nombre, franquicia, tipo, tripulación, velocidad)
- Búsqueda por nombre con debounce (`GET /api/spacecrafts/search`)
- Alta y edición en modal, con switch para `isArmed` (`POST` / `PUT`)
- Borrado con diálogo de confirmación (`DELETE`)
- Manejo de errores del backend (usa el campo `message` del `GlobalExceptionHandler`)
- Diseño responsive, tema espacial (estrellas animadas, tipografía Orbitron/Exo 2)
