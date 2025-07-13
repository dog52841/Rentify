import { jsx as _jsx } from "react/jsx-runtime";
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
export const AnimatedSection = ({ children, className, delay = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.6, -0.05, 0.01, 0.99],
                delay,
            },
        },
    };
    return (_jsx(motion.section, { ref: ref, className: className, variants: sectionVariants, initial: "hidden", animate: isInView ? 'visible' : 'hidden', children: children }));
};
