import { jsx as _jsx } from "react/jsx-runtime";
import { motion } from 'framer-motion';
const pageVariants = {
    initial: {
        opacity: 0,
        x: "-2vw",
    },
    in: {
        opacity: 1,
        x: 0,
    },
    out: {
        opacity: 0,
        x: "2vw",
    }
};
const PageWrapper = ({ children }) => (_jsx(motion.div, { initial: "initial", animate: "in", exit: "out", variants: pageVariants, transition: { type: "tween", ease: "anticipate", duration: 0.4 }, children: children }));
export default PageWrapper;
