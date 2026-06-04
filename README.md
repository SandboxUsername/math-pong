# Math Pong

Juego web mobile-first hecho con Next.js, TypeScript y Tailwind. En vez de mover la paleta con flechas, resuelves operaciones mentales en tiempo real mientras la pelota sigue en movimiento.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Abre `http://localhost:3000`.

## Checks

```bash
pnpm typecheck
pnpm build
```

El script `build` ejecuta `next build --webpack`.

## Deploy en Vercel

1. Sube el repositorio a GitHub, GitLab o Bitbucket.
2. En Vercel, crea un nuevo proyecto e importa el repositorio.
3. Mantén los defaults de Next.js.
4. Usa `pnpm build` como comando de build si Vercel no lo detecta automáticamente.
5. Publica el proyecto.

No hay backend ni variables de entorno requeridas.
