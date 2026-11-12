#!/bin/sh
set -e
echo "Applying database migrations..."
./node_modules/.bin/prisma migrate deploy
echo "Seeding demo users..."
node prisma/seed.js
echo "Starting server on port ${PORT}..."
exec node server.js
