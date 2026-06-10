# Control Horario

App de control horario para empresas de hasta 15 empleados (España).

## Estructura
- `backend/` — NestJS + Prisma + PostgreSQL (API REST)
- `frontend/` — Next.js + Tailwind (web responsive)
- `docs/cumplimiento-legal.md` — análisis de cumplimiento legal y RGPD

## Puesta en marcha (desarrollo)

```bash
# Base de datos
docker compose up -d db

# Backend
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev

# Frontend (en otra terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Login de prueba (creado por el seed): `admin@miempresa.com` / `Admin123!`

## Producción

```bash
docker compose up -d --build
```

Tras levantar los contenedores, ejecutar migraciones y seed dentro del contenedor backend:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run prisma:seed
```
