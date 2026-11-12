#!/bin/sh
set -e
echo "Applying database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy
echo "Seeding demo users..."
node prisma/seed.js
echo "Starting server on port ${PORT}..."
exec node server.js
