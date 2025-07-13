import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
const CartPage = () => {
    return (_jsxs("div", { className: "text-center py-20", children: [_jsx(motion.div, { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { type: 'spring', stiffness: 260, damping: 20 }, className: "inline-block p-6 bg-primary/10 rounded-full mb-6", children: _jsx(ShoppingCart, { className: "h-12 w-12 text-primary" }) }), _jsx("h1", { className: "text-4xl font-bold mb-4", children: "Your Cart is Empty (For Now!)" }), _jsx("p", { className: "text-muted-foreground mb-8 max-w-lg mx-auto", children: "A dedicated cart for managing your multiple rentals is coming soon! For now, you can book items one by one from their listing page." }), _jsx(Link, { to: "/browse", children: _jsxs(Button, { size: "lg", children: ["Start Browsing ", _jsx(ArrowRight, { className: "ml-2 h-5 w-5" })] }) })] }));
};
export default CartPage;
