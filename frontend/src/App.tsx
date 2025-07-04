import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './App.css';
import NotificationSystem from './components/common/NotificationSystem';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Page components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Events = lazy(() => import('./pages/events/Events'));
const EventDetail = lazy(() => import('./pages/events/EventDetail'));
const CreateEvent = lazy(() => import('./pages/events/CreateEvent'));
const Rooms = lazy(() => import('./pages/rooms/Rooms'));
const RoomDetail = lazy(() => import('./pages/rooms/RoomDetail'));
const CreateRoom = lazy(() => import('./pages/rooms/CreateRoom'));
const Profile = lazy(() => import('./pages/profile/Profile'));
const Suggestions = lazy(() => import('./pages/suggestions/Suggestions'));
const Friends = lazy(() => import('./pages/friends/Friends'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RoomPage = lazy(() => import('./pages/room/RoomPage'));

// ChatPage'i GEÇİCİ OLARAK normal import yap
// import ChatPage from './pages/chat/ChatPage';
const ChatPage = lazy(() => import('./pages/chat/ChatPage')); // Eski lazy yüklemeyi yorum satırına al

function App() {
  return (
    <Router>
      <NotificationSystem />
      <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><LoadingSpinner size="lg" /></div>}>
        <Routes>
          {/* Auth Routes - Herkes erişebilir */}
          <Route element={<AuthLayout />}>
            <Route path="/giris" element={<Login />} />
            <Route path="/kayit" element={<Register />} />
          </Route>

          {/* Main Layout Routes */}
          <Route element={<MainLayout />}>
            {/* Genel Rotalar - Herkes erişebilir */}
            <Route path="/" element={<Home />} />
            <Route path="/etkinlikler" element={<Events />} />
            <Route path="/etkinlikler/:id" element={<EventDetail />} />
            <Route path="/odalar" element={<Rooms />} />

            {/* Test için ChatPage'i ProtectedRoute dışına taşıyalım */}
            {/* <Route path="/chat/:chatId" element={<ChatPage />} /> */}

            {/* Korumalı Rotalar - Sadece giriş yapmış kullanıcılar erişebilir */}
            <Route element={<ProtectedRoute />}>
              {/* Dashboard */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Event Routes */}
              <Route path="/etkinlikler/yeni" element={<CreateEvent />} />

              {/* Room Routes */}
              <Route path="/odalar/yeni" element={<CreateRoom />} />
              <Route path="/odalar/:id" element={<RoomDetail />} />
              <Route path="/room/:roomId" element={<RoomPage />} />
              <Route path="/chat/:chatId" element={<ChatPage />} />

              {/* Suggestions */}
              <Route path="/oneriler" element={<Suggestions />} />

              {/* Friends */}
              <Route path="/arkadaslar" element={<Friends />} />

              {/* Profile */}
              <Route path="/profil" element={<Profile />} />
              <Route path="/profil/:id" element={<Profile />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
