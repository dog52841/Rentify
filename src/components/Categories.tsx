import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { Categories as CategoryOptions } from '../lib/categories';

interface CategoriesProps {
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export const Categories = ({ selected, onSelect }: CategoriesProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const { current: container } = containerRef;
      const scrollAmount = container.clientWidth * 0.5;
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
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

  return (
    <div className="relative mt-6 w-full">
      <div
        ref={containerRef}
        className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={handleScroll}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={() => onSelect(null)}
            variant={!selected ? "default" : "outline"}
            className={cn(
              "rounded-full text-sm whitespace-nowrap gap-2 shadow-sm",
              !selected 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-background/80 border-muted-foreground/20"
            )}
            size="sm"
          >
            <Search className="h-4 w-4" /> All Categories
          </Button>
        </motion.div>
        
        {CategoryOptions.map((category, i) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Button
                onClick={() => onSelect(category.name)}
                variant={selected === category.name ? "default" : "outline"}
                className={cn(
                  "rounded-full text-sm whitespace-nowrap gap-2 shadow-sm",
                  selected === category.name 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-background/80 border-muted-foreground/20"
                )}
                size="sm"
              >
                <Icon className="h-4 w-4" /> {category.name}
              </Button>
            </motion.div>
          );
        })}
      </div>
      
      {showLeftArrow && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute left-0 top-1/2 transform -translate-y-1/2 rounded-full shadow-lg bg-background/80 backdrop-blur-sm z-10"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      
      {showRightArrow && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute right-0 top-1/2 transform -translate-y-1/2 rounded-full shadow-lg bg-background/80 backdrop-blur-sm z-10"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}; 