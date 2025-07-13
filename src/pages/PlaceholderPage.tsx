import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => {
  return (
    <div className="text-center py-20">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="inline-block p-6 bg-muted/50 rounded-full mb-6"
      >
        <Wrench className="h-12 w-12 text-primary" />
      </motion.div>
      <h1 className="text-4xl font-bold mb-4">{title}</h1>
      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        {description || `This page is currently under construction. Check back soon for exciting updates!`}
      </p>
      <Link 
        to="/"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default PlaceholderPage; 