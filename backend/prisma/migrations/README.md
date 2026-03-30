La carpeta `prisma/migrations` mantiene una unica linea base versionada para el esquema actual del proyecto.

Uso recomendado:

1. Configurar `DATABASE_URL`.
2. En desarrollo, usar `npm run db:migrate` para generar cambios nuevos a partir de esta base.
3. En despliegue o una base vacia, usar `npm run db:deploy`.

Nota:
La carpeta historica `manual-sql` ya no forma parte del flujo versionado de Prisma. No es necesaria para el funcionamiento actual del backend.

Compatibilidad:
Si ya existe una base con el historial anterior en `_prisma_migrations`, esta consolidacion requiere reconciliar ese historial antes de desplegar. Para entornos locales suele ser suficiente recrear la base; para entornos persistentes conviene resolver o baselinar el estado antes de ejecutar `db:deploy`.
