# Campus Teranga Backend - Render Deployment Guide

This guide will help you deploy the Campus Teranga backend API to Render.

## Prerequisites

1. **MongoDB Atlas Account**: You'll need a MongoDB Atlas cluster for production database
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Deployment Steps

### 1. Prepare Your Database

1. Create a MongoDB Atlas account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string (it should look like: `mongodb+srv://username:password@cluster.mongodb.net/campus_teranga`)

### 2. Deploy to Render

#### Option A: Using render.yaml (Recommended)
1. Push your code to your Git repository
2. In Render dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect the `render.yaml` file
5. Update the environment variables in the `render.yaml` file:
   ```yaml
   envVars:
     - key: MONGODB_URI
       value: mongodb+srv://username:password@cluster.mongodb.net/campus_teranga
     - key: JWT_SECRET
       value: your_strong_jwt_secret_here
     - key: FRONTEND_URL
       value: https://your-frontend-url.com
   ```

#### Option B: Manual Setup
1. In Render dashboard, click "New +" → "Web Service"
2. Connect your Git repository
3. Configure the service:
   - **Name**: campus-teranga-backend
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

### 3. Environment Variables

Set these environment variables in Render:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `10000` (Render default) |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/campus_teranga` |
| `JWT_SECRET` | JWT signing secret | `your_strong_jwt_secret_here` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://your-frontend-url.com` |
| `SEED_ON_START` | Auto-seed database on startup | `true` (optional) |
| `ALLOW_DATA_RESET` | Allow database reset in production | `false` (optional) |

### 4. Domain and SSL

Render automatically provides:
- HTTPS with SSL certificates
- A custom domain (you can also add your own)
- Automatic deployments from your Git repository

### 5. Monitoring

The deployment includes:
- Health check endpoint at `/health`
- Automatic restarts on crashes
- Logs available in Render dashboard

## Local Development

To run locally with production-like settings:

1. Copy `.env.example` to `.env`
2. Update the values in `.env`
3. Run `npm install`
4. Run `npm start`

## Database Seeding

### Automatic Seeding
Set `SEED_ON_START=true` to automatically seed the database when the server starts.

### Manual Seeding
Use the seeding endpoints to manage your database:

#### Check Database Statistics
```bash
GET https://your-app-name.onrender.com/api/seed/stats
```

#### Seed Production Data
```bash
POST https://your-app-name.onrender.com/api/seed/seed
```

#### Reset Database (Development Only)
```bash
POST https://your-app-name.onrender.com/api/seed/reset
```

### Seeded Data Includes:
- **Admin Users**: 2 admin accounts with login credentials
- **Formations**: 4 universities (UCAD, UAHB, UPD, ESP)
- **Services**: 8 services (transport, housing, procedures, banking)
- **Events**: 4 sample events (welcome, cultural, career, tourism)

### Admin Login Credentials:
- **Admin**: Phone: `+221771234568`, Password: `admin123`
- **Super Admin**: Phone: `+221771234569`, Password: `superadmin123`

## API Endpoints

Once deployed, your API will be available at:
- Base URL: `https://your-app-name.onrender.com`
- Health Check: `https://your-app-name.onrender.com/health`
- API Routes:
  - `/api/auth/*` - Authentication endpoints
  - `/api/formations/*` - Formation management
  - `/api/services/*` - Services management
  - `/api/events/*` - Events management
  - `/api/admin/*` - Admin endpoints
  - `/api/seed/*` - Database seeding endpoints

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify MongoDB Atlas connection string and network access
3. **CORS Issues**: Update `FRONTEND_URL` environment variable
4. **JWT Errors**: Ensure `JWT_SECRET` is set and consistent

### Logs

Check Render dashboard logs for debugging:
1. Go to your service in Render dashboard
2. Click on "Logs" tab
3. Look for error messages or connection issues

## Security Notes

1. Never commit `.env` files to version control
2. Use strong, unique JWT secrets
3. Configure MongoDB Atlas IP whitelist for Render
4. Use HTTPS in production (automatically provided by Render)

## Support

For issues with this deployment:
1. Check Render documentation: [render.com/docs](https://render.com/docs)
2. Check MongoDB Atlas documentation: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
3. Review application logs in Render dashboard
