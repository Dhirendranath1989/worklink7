@echo off
echo Starting WorkLink Production Deployment...
echo.

echo Setting environment variables...
set NODE_ENV=production

echo.
echo Building frontend for production...
cd frontend
call npm run build:prod
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)

echo.
echo Frontend build completed successfully!
echo Built files are in frontend/dist directory

echo.
echo Starting backend in production mode...
cd ../backend
call npm run start:prod

echo.
echo Production deployment completed!
pause