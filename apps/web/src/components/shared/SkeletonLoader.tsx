'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SkeletonLoaderProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'table' | 'chart';
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  animation?: 'shimmer' | 'pulse' | 'none';
}

const shimmerVariants = {
  initial: { backgroundPosition: '-200% 0' },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

const pulseVariants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: 1,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export function SkeletonText({ 
  lines = 3, 
  className = '',
  lastLineWidth = '60%',
}: { 
  lines?: number; 
  className?: string; 
  lastLineWidth?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="h-4 rounded animate-shimmer"
          style={{ 
            width: i === lines - 1 ? lastLineWidth : '100%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite linear',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCircular({ 
  size = 40, 
  className = '',
}: { 
  size?: number; 
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-full ${className}`}
      style={{ 
        width: size, 
        height: size,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
      }}
    />
  );
}

export function SkeletonRectangular({ 
  width = '100%', 
  height = 100, 
  borderRadius = 8,
  className = '',
}: { 
  width?: string | number; 
  height?: string | number;
  borderRadius?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
      style={{ 
        width, 
        height,
        borderRadius,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear',
      }}
    />
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <SkeletonCircular size={48} />
        <div className="flex-1 space-y-3">
          <SkeletonRectangular width="60%" height={16} borderRadius={4} />
          <SkeletonRectangular width="40%" height={12} borderRadius={4} />
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <SkeletonRectangular width="100%" height={12} borderRadius={4} />
        <SkeletonRectangular width="100%" height={12} borderRadius={4} />
        <SkeletonRectangular width="75%" height={12} borderRadius={4} />
      </div>
    </motion.div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className = '',
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`overflow-hidden rounded-xl ${className}`}
    >
      <div className="border-b border-white/5 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: columns }, (_, i) => (
            <div
              key={i}
              className="h-3 rounded animate-shimmer flex-1"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
              }}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className="border-b border-white/[0.03] px-4 py-4"
        >
          <div className="flex gap-4">
            {Array.from({ length: columns }, (_, i) => (
              <div
                key={i}
                className="h-4 rounded animate-shimmer flex-1"
                style={{
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
                  backgroundSize: '200% 100%',
                  animation: `shimmer 1.5s ${rowIndex * 0.05}s infinite linear`,
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-card rounded-2xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <SkeletonRectangular width={120} height={16} borderRadius={4} />
        <SkeletonRectangular width={80} height={12} borderRadius={4} />
      </div>
      <div className="flex items-end gap-2 h-40">
        {[65, 45, 80, 55, 90, 70, 85, 60, 75, 95].map((height, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-t"
            style={{
              background: 'linear-gradient(180deg, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.1) 100%)',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

export function SkeletonAvatarWithText({ 
  avatarSize = 40,
  className = '',
}: { 
  avatarSize?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`flex items-center gap-3 ${className}`}
    >
      <SkeletonCircular size={avatarSize} />
      <div className="space-y-2">
        <SkeletonRectangular width={120} height={14} borderRadius={4} />
        <SkeletonRectangular width={80} height={10} borderRadius={4} />
      </div>
    </motion.div>
  );
}

export default function SkeletonLoader({
  variant = 'text',
  width,
  height,
  className = '',
  lines = 3,
  showAvatar = false,
  animation = 'shimmer',
}: SkeletonLoaderProps) {
  const animationVariants = animation === 'shimmer' 
    ? shimmerVariants 
    : animation === 'pulse' 
      ? pulseVariants 
      : { initial: {}, animate: {} };

  if (variant === 'text') {
    return (
      <div className={className}>
        <SkeletonText lines={lines} />
      </div>
    );
  }

  if (variant === 'circular') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        variants={animationVariants}
        className={`rounded-full ${className}`}
        style={{ 
          width: width || 40, 
          height: width || 40,
          background: animation === 'none' 
            ? 'rgba(255,255,255,0.08)' 
            : undefined,
        }}
      />
    );
  }

  if (variant === 'rectangular') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        variants={animationVariants}
        className={className}
        style={{ 
          width: width || '100%', 
          height: height || 100,
          background: animation === 'none' 
            ? 'rgba(255,255,255,0.08)' 
            : undefined,
        }}
      />
    );
  }

  if (variant === 'card') {
    return <SkeletonCard className={className} />;
  }

  if (variant === 'table') {
    return <SkeletonTable className={className} />;
  }

  if (variant === 'chart') {
    return <SkeletonChart className={className} />;
  }

  return null;
}
