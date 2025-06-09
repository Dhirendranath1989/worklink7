# WorkLink Frontend

**Connecting Skills with Needs** - A modern React-based platform for connecting local workers with opportunities.

## 🚀 Features

- **Modern UI/UX**: Built with React 18, Tailwind CSS, and Headless UI
- **Real-time Communication**: Socket.io integration for instant messaging
- **Advanced Search**: Filter by skills, location, rating, and availability
- **User Roles**: Separate interfaces for Workers and Owners
- **Mobile Responsive**: Optimized for all device sizes
- **Progressive Web App**: Service worker support for offline functionality
- **Firebase Integration**: Authentication, real-time database, and push notifications
- **State Management**: Redux Toolkit with persistence
- **Modern Routing**: React Router v6 with protected routes

## 🛠️ Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons
- **State Management**: Redux Toolkit, Redux Persist
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Real-time**: Socket.io Client
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd worklink6/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   - Firebase credentials
   - API endpoints
   - Third-party service keys

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (Navbar, Footer, etc.)
│   ├── forms/          # Form components
│   └── ui/             # Basic UI components
├── features/           # Redux slices and feature-specific logic
│   ├── auth/           # Authentication
│   ├── jobs/           # Job management
│   ├── profiles/       # User profiles
│   ├── chat/           # Real-time messaging
│   └── notifications/  # Notifications
├── pages/              # Page components
│   ├── auth/           # Authentication pages
│   ├── worker/         # Worker-specific pages
│   ├── owner/          # Owner-specific pages
│   └── admin/          # Admin panel
├── services/           # API and external services
├── store/              # Redux store configuration
├── utils/              # Utility functions
└── assets/             # Static assets
```

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

- **Firebase**: API keys and configuration
- **API**: Backend server URLs
- **Optional**: Google Maps, Payment gateways, Analytics

## 🌟 Key Features Implementation

### User Authentication
- Phone number verification with OTP
- Role-based access (Worker/Owner/Admin)
- Protected routes and persistent sessions

### Real-time Features
- Live chat between workers and owners
- Real-time notifications
- Online status indicators
- Typing indicators

### Advanced Search & Filtering
- Skill-based search with autocomplete
- Location-based filtering
- Rating and experience filters
- Availability calendar integration

### Worker Features
- Profile management with portfolio
- Job alerts and notifications
- Earnings tracker
- Badge system (Gold/Silver)
- Availability calendar

### Owner Features
- Post job requirements
- Search and filter workers
- Saved searches
- Review and rating system
- Auto-recommendations

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📱 Progressive Web App

The application includes PWA features:
- Service worker for offline functionality
- App manifest for installation
- Push notifications support
- Responsive design for mobile devices

## 🔧 Development Guidelines

- Follow React best practices and hooks patterns
- Use TypeScript for type safety (optional)
- Implement responsive design with Tailwind CSS
- Write clean, maintainable code with proper comments
- Use Redux Toolkit for state management
- Implement proper error handling and loading states

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**WorkLink** - Empowering local communities through skill-based connections.