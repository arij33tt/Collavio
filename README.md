# Collavio

**Collavio** is a collaborative video platform that enables teams to work together on video projects with seamless integration to YouTube Clone platform.

## Features

- 🎥 **Video Upload & Management** - Upload and organize videos with Firebase Storage
- 👥 **Workspace Collaboration** - Create workspaces and invite team members
- 🔗 **YouTube Clone Integration** - Connect and publish directly to YouTube Clone platform
- 🔐 **Secure Authentication** - Firebase Auth with Google Sign-in support
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Clean, intuitive interface built with React

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks and context
- **React Router** - Client-side routing
- **Styled Components** - CSS-in-JS styling
- **Firebase SDK** - Authentication and storage
- **React Player** - Video playback component

### Backend
- **Node.js & Express** - RESTful API server
- **Firebase Admin** - Server-side Firebase integration
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing

### Infrastructure
- **Firebase Storage** - Video and thumbnail storage
- **Firebase Auth** - User authentication
- **Vercel** - Frontend deployment
- **Railway** - Backend deployment

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Storage and Auth enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arij33tt/Collavio.git
   cd Collavio
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   
   Create `.env` files in both `client` and `server` directories:
   
   **Client (.env)**
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_YTCLONE_BASE=http://localhost:6323
   ```
   
   **Server (.env)**
   ```env
   PORT=5000
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your_project.iam.gserviceaccount.com
   STORAGE_PROVIDER=firebase
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```
   
   This starts both client (http://localhost:3000) and server (http://localhost:5000)

## Project Structure

```
Collavio/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── config/        # Firebase config
│   │   └── styles/        # Global styles
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── routes/        # API routes
│   │   └── config/        # Server configuration
│   └── package.json
├── railway.json          # Railway deployment config
├── vercel.json           # Vercel deployment config
└── package.json          # Root package.json
```

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `cd client && npm run build`
3. Set output directory: `client/build`
4. Add environment variables in Vercel dashboard

### Backend (Railway)
1. Connect your GitHub repository to Railway
2. Railway will automatically detect the `railway.json` configuration
3. Add environment variables in Railway dashboard

## API Endpoints

### Authentication
- `POST /api/auth/verify` - Verify Firebase token

### Videos
- `POST /api/videos/upload` - Upload video
- `GET /api/videos/workspace/:id` - Get workspace videos
- `DELETE /api/videos/:id` - Delete video

### Workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/user/:userId` - Get user workspaces
- `POST /api/workspaces/:id/members` - Add workspace member

### Integrations
- `POST /api/integrations/youtube-clone/connect` - Connect YouTube Clone
- `POST /api/integrations/youtube-clone/publish` - Publish to YouTube Clone

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@collavio.com or create an issue in this repository.