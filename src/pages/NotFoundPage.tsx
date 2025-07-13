import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Search, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <div className="max-w-md w-full text-center space-y-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20 
          }}
          className="relative mx-auto"
        >
          <motion.div 
            className="absolute inset-0 rounded-full bg-primary/10 blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
          <div className="relative">
            <motion.div
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="mb-6"
            >
              <Search className="mx-auto h-20 w-20 text-primary/80" />
            </motion.div>
            
            <motion.h1 
              className="text-8xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
              animate={{ 
                scale: [1, 1.03, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              404
            </motion.h1>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Page Not Found</h2>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild variant="default" size="lg" className="gap-2">
              <Link to="/">
                Return Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="#" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4" /> Go Back
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground pt-6">
            Need help? <a href="mailto:support@rentify.com" className="text-primary hover:underline">Contact support</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage; 