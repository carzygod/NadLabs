import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Idea, Language } from '../types';
import IdeaCard from './IdeaCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface IdeaCarouselProps {
    ideas: Idea[];
    onVerify: (idea: Idea) => void;
    onViewBlueprint: (idea: Idea) => void;
    onTranslate?: (idea: Idea) => void;
    isTranslating: (id: string) => boolean;
    currentLang?: Language;
    t: any;
}

const IdeaCarousel: React.FC<IdeaCarouselProps> = ({ ideas, onVerify, onViewBlueprint, onTranslate, isTranslating, currentLang, t }) => {
    const [index, setIndex] = useState(0);

    const nextCard = () => {
        setIndex((prev) => (prev + 1) % ideas.length);
    };

    const prevCard = () => {
        setIndex((prev) => (prev - 1 + ideas.length) % ideas.length);
    };

    // Safe check for empty array
    if (!ideas || ideas.length === 0) return null;

    return (
        <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000 overflow-hidden">
            {/* Navigation Buttons */}
            <button
                onClick={prevCard}
                className="absolute left-2 z-30 p-3 bg-black/50 border border-white/10 rounded-full hover:bg-[#8B5CF6]/20 hover:text-[#8B5CF6] transition-all backdrop-blur-sm"
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={nextCard}
                className="absolute right-2 z-30 p-3 bg-black/50 border border-white/10 rounded-full hover:bg-[#8B5CF6]/20 hover:text-[#8B5CF6] transition-all backdrop-blur-sm"
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Carousel Container */}
            <div className="relative w-full max-w-sm h-full flex items-center justify-center">
                <AnimatePresence initial={false}>
                    {ideas.map((idea, i) => {
                        // Calculate position relative to active index
                        // We handle circular index logic visually by limiting render to adjacent cards or using specific z-indexes
                        // For simplicity in a small deck, we render all but animate position based on distance from index

                        let offset = i - index;
                        // Handle wrap-around for smooth infinite loop feeling if needed, 
                        // but for < 10 items, direct calculation is safer for visual stack.
                        // Let's stick to a simple stack logic:
                        // Active: 0, Next: 1, Prev: -1.
                        // If we want true infinite, we need modulo arithmetic on the offset, but React keys make that tricky without duplicating data.
                        // We will just clamp visual rendering to the active one and its neighbors for now or use absolute positioning.

                        // Actually, let's use a "Deck" approach where we only render current, next, and prev with specific logic.
                        // But to support AnimatePresence, we need consistent keys.

                        // Let's allow the user to cycle through.
                        // If ideas.length is small, we can just position them all.

                        if (Math.abs(offset) > 2 && ideas.length > 5) return null; // Optimization

                        // Z-Index logic
                        const isActive = i === index;
                        const zIndex = isActive ? 10 : 10 - Math.abs(offset);
                        const opacity = isActive ? 1 : 0.5 - (Math.abs(offset) * 0.1);
                        const scale = isActive ? 1 : 0.85 - (Math.abs(offset) * 0.05);
                        const x = isActive ? '0%' : offset * 105 + '%';
                        const rotateY = isActive ? 0 : offset > 0 ? -25 : 25;

                        // Only render if within visible range to keep DOM light
                        if (Math.abs(offset) > 1 && !isActive) {
                            // Hide distant cards completely
                            return (
                                <motion.div
                                    key={idea.id}
                                    className="absolute w-full h-full pointer-events-none opacity-0"
                                    animate={{ x, opacity: 0, zIndex }}
                                    transition={{ duration: 0.5 }}
                                />
                            )
                        }

                        return (
                            <motion.div
                                key={idea.id}
                                className="absolute w-full h-[420px] top-[40px]"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{
                                    x: x,
                                    scale: scale,
                                    opacity: Math.abs(offset) <= 1 ? 1 : 0,
                                    rotateY: rotateY,
                                    zIndex: zIndex,
                                    rotateZ: isActive ? 0 : offset * -2
                                }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 20
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={(e, { offset, velocity }) => {
                                    const swipe = offset.x;
                                    if (swipe < -50) nextCard();
                                    else if (swipe > 50) prevCard();
                                }}
                                style={{
                                    transformStyle: "preserve-3d",
                                }}
                            >
                                <div className={`w-full h-full shadow-2xl rounded-xl overflow-hidden ${isActive ? 'ring-2 ring-[#8B5CF6]/50 shadow-[#8B5CF6]/20' : 'brightness-50 grayscale'}`}>
                                    {/* Pass idea card, but we might need to adjust its styling for "Card Mode" vs "Grid Mode" */}
                                    {/* IdeaCard is flex h-full, so it should fill this container */}
                                    <div className="h-full bg-[#050505] relative">
                                        {/* 3D Glass overlay reflection */}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent z-20 pointer-events-none"></div>
                                        <IdeaCard
                                            idea={idea}
                                            onVerify={onVerify}
                                            onViewBlueprint={onViewBlueprint}
                                            onTranslate={onTranslate}
                                            isTranslating={isTranslating(idea.id)}
                                            currentLang={currentLang}
                                            t={t}
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Pagination Dots */}
            <div className="absolute bottom-4 flex gap-2">
                {ideas.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-[#8B5CF6] w-6' : 'bg-gray-600 hover:bg-gray-400'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default IdeaCarousel;
