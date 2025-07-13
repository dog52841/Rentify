"use client"

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface LightboxProps {
  images: string[]
  selectedIndex: number
  onClose: () => void
  onNext: () => void
  onPrev: () => void
}

const Lightbox: React.FC<LightboxProps> = ({ images, selectedIndex, onClose, onNext, onPrev }) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') onNext()
    if (e.key === 'ArrowLeft') onPrev()
    if (e.key === 'Escape') onClose()
  }

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onNext, onPrev, onClose])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Main Content */}
        <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/10 hover:text-white"
            onClick={onClose}
          >
            <X size={24} />
          </Button>

          {/* Prev Button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/10 hover:text-white h-14 w-14"
              onClick={onPrev}
            >
              <ChevronLeft size={32} />
            </Button>
          )}

          {/* Image Display */}
          <div className="relative w-[90%] h-[90%] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedIndex}
                src={images[selectedIndex]}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="max-h-full max-w-full object-contain"
              />
            </AnimatePresence>
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/10 hover:text-white h-14 w-14"
              onClick={onNext}
            >
              <ChevronRight size={32} />
            </Button>
          )}
          
          {/* Index Counter */}
          {images.length > 1 && (
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1.5 rounded-full">
                {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default Lightbox 