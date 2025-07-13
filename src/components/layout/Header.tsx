import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu as MenuIcon, X, User, Search, LogOut, Inbox, Moon, Sun, PlusCircle, Heart, LayoutGrid, Building, UserCircle, Settings, Loader2, ShieldCheck, LifeBuoy, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { useTheme } from '../ui/ThemeProvider';
import Logo from '../../assets/logo.svg?react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "../ui/dropdown-menu";
import { supabase } from '../../lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

const NavLink = ({ href, label, isActive, isScrolled, onClick }: { href: string; label: string; isActive: boolean; isScrolled: boolean, onClick?: () => void }) => (
  <Link
    to={href}
    onClick={onClick}
    className={cn(
      "relative px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300",
      isActive
        ? "text-primary-foreground"
        : "text-muted-foreground hover:text-foreground",
      isScrolled && isActive ? "bg-primary/10 text-primary" : ""
    )}
  >
    {isActive && (
      <motion.div
        layoutId="active-nav-link"
        className="absolute inset-0 bg-primary rounded-full z-0"
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
      />
    )}
    <span className="relative z-10">{label}</span>
  </Link>
);

const ProfileMenu = () => {
    const { profile, signOut, user } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
      const fetchUnreadCount = async () => {
        if (!user) return;
        
        try {
          // Use the get_inbox_unread_counts RPC function instead of direct table query
          const { data, error } = await supabase.rpc('get_inbox_unread_counts');
          
          if (error) {
            console.error('Error fetching unread message count:', error);
          } else if (data) {
            setUnreadCount(data.messages || 0);
          }
        } catch (err) {
          console.error('Exception in fetchUnreadCount:', err);
        }
      };
      
      // Set up message subscription when user is available
      const setupSubscription = () => {
        if (!user) return;
        
        try {
          // Clean up any existing subscription first
          if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
          }
          
          // Create new subscription for messages
          channelRef.current = supabase.channel(`messages:${user.id}`)
            .on('postgres_changes', 
              { 
                event: '*', 
                schema: 'public', 
                table: 'messages', 
                filter: `sender_id=eq.${user.id}` 
              }, 
              () => fetchUnreadCount()
            )
            .subscribe((status) => {
              if (status !== 'SUBSCRIBED' && status !== 'CLOSED') {
                console.warn('Message subscription status:', status);
              }
            });
            
          // Initial fetch
          fetchUnreadCount();
        } catch (err) {
          console.error('Error setting up message subscription:', err);
        }
      };
      
      setupSubscription();
      
      // Cleanup function
      return () => {
        if (channelRef.current) {
          try {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
          } catch (err) {
            console.error('Error removing channel:', err);
          }
        }
      };
    }, [user]);

    const handleSignOut = async () => {
        setIsLoading(true);
        try {
          await signOut();
          navigate('/');
        } catch (err) {
          console.error('Error signing out:', err);
        } finally {
          setIsLoading(false);
        }
    };
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-transparent ring-2 ring-offset-2 ring-offset-background ring-transparent group-hover:ring-primary/50 transition-all">
                        <AvatarImage src={profile?.avatar_url} alt={profile?.full_name || 'User Avatar'} />
                        <AvatarFallback>{profile?.full_name?.charAt(0) || <User/>}</AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{profile?.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email || 'Loading...'}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link to="/dashboard"><LayoutGrid className="mr-2 h-4 w-4" /><span>Dashboard</span></Link>
                    </DropdownMenuItem>
                    {user && (
                      <DropdownMenuItem asChild>
                          <Link to={`/profile/${user.id}`}><User className="mr-2 h-4 w-4" /><span>My Profile</span></Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link to="/dashboard" onClick={() => navigate('/dashboard', { state: { tab: 'settings' } })}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/inbox"><Inbox className="mr-2 h-4 w-4" /><span>Inbox</span></Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link to="/list-item"><PlusCircle className="mr-2 h-4 w-4" /><span>List an Item</span></Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/dashboard" onClick={() => navigate('/dashboard', { state: { tab: 'my-listings' } })}>
                            <Building className="mr-2 h-4 w-4" />
                            <span>My Listings</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/dashboard" onClick={() => navigate('/dashboard', { state: { tab: 'my-rentals' } })}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>My Rentals</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link to="/wishlist"><Heart className="mr-2 h-4 w-4" /><span>Wishlist</span></Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleSignOut} 
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  disabled={isLoading}
                >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { session, profile, signOut, loading } = useAuth();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [hasInitialized, setHasInitialized] = useState(false);

  const isLoggedIn = !!session;
  
  // Set initialized after the initial render to prevent loading flicker
  useEffect(() => {
    if (!hasInitialized) {
      const timer = setTimeout(() => {
        setHasInitialized(true);
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [hasInitialized]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // check on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/');
  };
  
  // Only show loading spinner on initial page load
  const showLoadingSpinner = loading && !hasInitialized;

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/browse', label: 'Browse' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/inbox', label: 'Inbox' },
  ];

  return (
    <>
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-xl border-b shadow-sm" 
          : "bg-transparent"
      )}
    >
      <div className={cn("container mx-auto px-4 transition-all duration-300", isScrolled ? "h-20" : "h-24")}>
        <div className="flex items-center justify-between h-full">
          <Link to="/" className="flex items-center gap-2 group">
            <Logo className="h-8 w-8 text-primary group-hover:animate-pulse"/>
            <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">Rentify</span>
          </Link>

          <nav className="hidden md:flex items-center gap-2 bg-background/50 border p-1 rounded-full">
            {navLinks.map((link) => (
              <NavLink 
                key={link.href}
                href={link.href}
                label={link.label}
                isActive={location.pathname === link.href}
                isScrolled={isScrolled}
              />
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle Theme"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
            
            <AnimatePresence mode="wait" initial={false}>
              {showLoadingSpinner ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-10 w-10"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </motion.div>
              ) : isLoggedIn ? (
                  <motion.div
                      key="profile"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2"
                  >
                      {profile?.role === 'admin' && (
                        <Button asChild variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive shadow-sm hover:shadow-destructive/20 transition-all duration-300">
                            <Link to="/admin">
                                <ShieldCheck size={16} className="mr-2" />
                                Admin Panel
                            </Link>
                        </Button>
                      )}
                      <Button asChild variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-px">
                          <Link to="/list-item">
                              <PlusCircle size={16} className="mr-2"/>
                              List an Item
                          </Link>
                      </Button>
                      <ProfileMenu />
                  </motion.div>
              ) : (
                  <motion.div
                      key="auth"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-2"
                  >
                      <Button asChild variant="ghost">
                          <Link to="/auth?mode=login">Sign In</Link>
                      </Button>
                      <Button asChild>
                          <Link to="/auth?mode=signup">Sign Up</Link>
                      </Button>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
      {isMenuOpen && (
        <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-t"
        >
          <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
            <nav className="flex flex-col gap-2">
                {navLinks.map(link => (
                    <NavLink
                        key={`mobile-${link.href}`}
                        href={link.href}
                        label={link.label}
                        isActive={location.pathname === link.href}
                        isScrolled={true}
                        onClick={() => setIsMenuOpen(false)}
                    />
                ))}
            </nav>
            <div className="w-full pt-4 border-t mt-2">
              {isLoggedIn ? (
                  <div className="space-y-4">
                      <ProfileMenu />
                      <Button asChild className="w-full" size="lg">
                        <Link to="/list-item" onClick={() => setIsMenuOpen(false)}>List an Item</Link>
                      </Button>
                      <Button variant="outline" onClick={handleSignOut} className="w-full" size="lg">
                          <LogOut size={18} className="mr-2"/> Sign Out
                      </Button>
                  </div>
              ) : (
                <div className="space-y-3">
                  <Button asChild className="w-full" size="lg">
                    <Link to="/auth?mode=login" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                  </Button>
                   <Button asChild variant="outline" className="w-full" size="lg">
                    <Link to="/auth?mode=signup" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-center pt-4">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle Theme"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                    <Sun className="h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                </Button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
    {/* Add a spacer to prevent content from being hidden behind the fixed header */}
    <div className={cn("transition-all duration-300", isScrolled ? "pt-20" : "pt-24")} />
    </>
  );
};

export default Header; 