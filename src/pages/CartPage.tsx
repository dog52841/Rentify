import { motion } from 'framer-motion';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const CartPage = () => {
    return (
        <div className="text-center py-20">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="inline-block p-6 bg-primary/10 rounded-full mb-6"
            >
                <ShoppingCart className="h-12 w-12 text-primary" />
            </motion.div>
            <h1 className="text-4xl font-bold mb-4">Your Cart is Empty (For Now!)</h1>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                A dedicated cart for managing your multiple rentals is coming soon! For now, you can book items one by one from their listing page.
            </p>
            <Link to="/browse">
                <Button size="lg">
                    Start Browsing <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>
        </div>
    );
};

export default CartPage; 