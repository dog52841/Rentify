import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import MainLayout from './components/layout/MainLayout';
import PageWrapper from './components/ui/PageWrapper';
import Home from './pages/Home';
import Browse from './pages/Browse';
import AuthPage from './pages/AuthPage';
import RequestPasswordResetPage from './pages/RequestPasswordResetPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ListingPage from './pages/ListingPage';
import ListItemPage from './pages/ListItemPage';
// import EditListingPage from './pages/EditListingPage'; // No longer needed
import DashboardPage from './pages/DashboardPage';
import InboxPage from './pages/InboxPage';
import ConversationPage from './pages/ConversationPage';
import AboutPage from './pages/AboutPage';
import CartPage from './pages/CartPage';
import PricingPage from './pages/PricingPage';
import SafetyTipsPage from './pages/SafetyTipsPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import NotFoundPage from './pages/NotFoundPage';
import WishlistPage from './pages/WishlistPage';
import UserProfilePage from './pages/UserProfilePage';
import MyListingsPage from './pages/MyListingsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DebugPage from './pages/DebugPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MainLayout><PageWrapper><Home /></PageWrapper></MainLayout>} />
        <Route path="/browse" element={<MainLayout><PageWrapper><Browse /></PageWrapper></MainLayout>} />
        <Route path="/auth" element={<PageWrapper><AuthPage /></PageWrapper>} />
        <Route path="/request-password-reset" element={<PageWrapper><RequestPasswordResetPage /></PageWrapper>} />
        <Route path="/update-password" element={<PageWrapper><UpdatePasswordPage /></PageWrapper>} />
        <Route path="/login" element={<PageWrapper><AuthPage /></PageWrapper>} />
        <Route path="/signup" element={<PageWrapper><AuthPage /></PageWrapper>} />
        <Route path="/how-it-works" element={<MainLayout><PageWrapper><HowItWorksPage /></PageWrapper></MainLayout>} />
        <Route path="/about" element={<MainLayout><PageWrapper><AboutPage /></PageWrapper></MainLayout>} />
        <Route path="/debug" element={<MainLayout><PageWrapper><DebugPage /></PageWrapper></MainLayout>} />
        <Route path="/cart" element={<MainLayout><PageWrapper><CartPage /></PageWrapper></MainLayout>} />
        <Route path="/pricing" element={<MainLayout><PageWrapper><PricingPage /></PageWrapper></MainLayout>} />
        <Route path="/safety-tips" element={<MainLayout><PageWrapper><SafetyTipsPage /></PageWrapper></MainLayout>} />
        <Route path="/terms" element={<MainLayout><PageWrapper><TermsPage /></PageWrapper></MainLayout>} />
        <Route path="/privacy" element={<MainLayout><PageWrapper><PrivacyPage /></PageWrapper></MainLayout>} />
        <Route path="/listings/:listingId" element={<MainLayout><PageWrapper><ListingPage /></PageWrapper></MainLayout>} />
        <Route path="/profile/:userId" element={<MainLayout><PageWrapper><UserProfilePage /></PageWrapper></MainLayout>} />

        {/* Protected Routes */}
        <Route path="/listings/:id/edit" element={<ProtectedRoute><MainLayout><PageWrapper><ListItemPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        <Route path="/list-item" element={<ProtectedRoute><MainLayout><PageWrapper><ListItemPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><PageWrapper><DashboardPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><MainLayout><PageWrapper><InboxPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><MainLayout><PageWrapper><WishlistPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        <Route path="/my-listings" element={<ProtectedRoute><MainLayout><PageWrapper><MyListingsPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><MainLayout><PageWrapper><PaymentSuccessPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        <Route path="/payment-cancel" element={<ProtectedRoute><MainLayout><PageWrapper><PaymentCancelPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><MainLayout><PageWrapper><ConversationPage /></PageWrapper></MainLayout></ProtectedRoute>} />
        
        {/* Admin Protected Route */}
        <Route 
            path="/admin" 
            element={
                <ProtectedRoute adminOnly={true}>
                  <MainLayout>
                    <PageWrapper>
                      <AdminDashboardPage />
                    </PageWrapper>
                  </MainLayout>
                </ProtectedRoute>
            } 
        />
        
        <Route path="*" element={<MainLayout><PageWrapper><NotFoundPage /></PageWrapper></MainLayout>} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
