#!/bin/bash

echo "Starting WorkLink Production Deployment..."
echo

echo "Setting environment variables..."
export NODE_ENV=production

echo
echo "Building frontend for production..."
cd frontend
npm run build:prod
if [ $? -ne 0 ]; then
    echo "Frontend build failed!"
    exit 1
fi

echo
echo "Frontend build completed successfully!"
echo "Built files are in frontend/dist directory"

echo
echo "Starting backend in production mode..."
cd ../backend
npm run start:prod

echo
echo "Production deployment completed!"