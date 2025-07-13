import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { Categories as CategoryOptions } from '../lib/categories';
export const Categories = ({ selected, onSelect }) => {
    const containerRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const scroll = (direction) => {
        if (containerRef.current) {
            const { current: container } = containerRef;
            const scrollAmount = container.clientWidth * 0.5;
            if (direction === 'left') {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            }
            else {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };
    const handleScroll = () => {
        if (containerRef.current) {
            const { current: container } = containerRef;
            const isScrolledToStart = container.scrollLeft <= 10;
            const isScrolledToEnd = container.scrollWidth - container.scrollLeft - container.clientWidth <= 10;
            setShowLeftArrow(!isScrolledToStart);
            setShowRightArrow(!isScrolledToEnd);
        }
    };
    useEffect(() => {
        const currentContainer = containerRef.current;
        if (currentContainer) {
            currentContainer.addEventListener('scroll', handleScroll);
            // Initial check
            handleScroll();
        }
        return () => {
            if (currentContainer) {
                currentContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);
    return (_jsxs("div", { className: "relative mt-6 w-full", children: [_jsxs("div", { ref: containerRef, className: "flex items-center gap-3 overflow-x-auto scrollbar-hide py-2 px-1", style: { scrollbarWidth: 'none', msOverflowStyle: 'none' }, onScroll: handleScroll, children: [_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.2 }, children: _jsxs(Button, { onClick: () => onSelect(null), variant: !selected ? "default" : "outline", className: cn("rounded-full text-sm whitespace-nowrap gap-2 shadow-sm", !selected
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-background/80 border-muted-foreground/20"), size: "sm", children: [_jsx(Search, { className: "h-4 w-4" }), " All Categories"] }) }), CategoryOptions.map((category, i) => {
                        const Icon = category.icon;
                        return (_jsx(motion.div, { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.2, delay: i * 0.03 }, children: _jsxs(Button, { onClick: () => onSelect(category.name), variant: selected === category.name ? "default" : "outline", className: cn("rounded-full text-sm whitespace-nowrap gap-2 shadow-sm", selected === category.name
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-background/80 border-muted-foreground/20"), size: "sm", children: [_jsx(Icon, { className: "h-4 w-4" }), " ", category.name] }) }, category.name));
                    })] }), showLeftArrow && (_jsx(Button, { variant: "secondary", size: "icon", className: "absolute left-0 top-1/2 transform -translate-y-1/2 rounded-full shadow-lg bg-background/80 backdrop-blur-sm z-10", onClick: () => scroll('left'), children: _jsx(ChevronLeft, { className: "h-5 w-5" }) })), showRightArrow && (_jsx(Button, { variant: "secondary", size: "icon", className: "absolute right-0 top-1/2 transform -translate-y-1/2 rounded-full shadow-lg bg-background/80 backdrop-blur-sm z-10", onClick: () => scroll('right'), children: _jsx(ChevronRight, { className: "h-5 w-5" }) }))] }));
};
