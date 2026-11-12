#!/bin/sh
set -e
echo "Applying database migrations..."
node /opt/prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
echo "Seeding demo users..."
node prisma/seed.js
echo "Starting server on port ${PORT}..."
exec node server.js
