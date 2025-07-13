import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
export const AnimatedGradient = ({ className }) => {
    return (_jsx("div", { className: cn("absolute inset-0 overflow-hidden -z-10", className), children: _jsx(motion.div, { className: "absolute inset-[-200%] w-[400%] h-[400%]", animate: {
                x: ['-50%', '0%', '-50%'],
                y: ['0%', '-50%', '0%'],
            }, transition: {
                duration: 30,
                repeat: Infinity,
                ease: 'linear',
            }, style: {
                backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(var(--primary)/0.1), transparent 40%), radial-gradient(circle at 20% 80%, hsl(var(--secondary)/0.1), transparent 40%), radial-gradient(circle at 80% 30%, hsl(var(--accent)/0.1), transparent 40%)',
            } }) }));
};
