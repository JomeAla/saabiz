'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  rightContent,
  className = '',
}: PageHeaderProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 ${className}`}
    >
      <div className="space-y-4 max-w-2xl">
        {eyebrow && (
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              {eyebrow}
            </span>
          </motion.div>
        )}

        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            variants={itemVariants}
            className="text-lg text-slate-400 leading-relaxed max-w-xl"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {rightContent && (
        <motion.div
          variants={itemVariants}
          className="flex-shrink-0"
        >
          {rightContent}
        </motion.div>
      )}
    </motion.div>
  );
}
