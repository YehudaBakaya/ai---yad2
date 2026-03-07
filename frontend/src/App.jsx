import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import Login from './pages/Login';
import Register from './pages/Register';
import MyListings from './pages/MyListings';
import Profile from './pages/Profile';
import DealHistory from './pages/DealHistory';
import Favorites from './pages/Favorites';
import Admin from './pages/Admin';

function App() {
  return (
    <LanguageProvider>
    <ThemeProvider>
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-900">
          <Navbar />
          <Routes>
            {/* ── Public ── */}
            <Route path="/"              element={<Home />} />
            <Route path="/listings"      element={<Listings />} />
            <Route path="/listings/:id"  element={<ListingDetail />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/register"      element={<Register />} />

            {/* ── Protected ── */}
            <Route path="/create" element={
              <ProtectedRoute><CreateListing /></ProtectedRoute>
            } />
            <Route path="/my-listings" element={
              <ProtectedRoute><MyListings /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute><DealHistory /></ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute><Favorites /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute><Admin /></ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
