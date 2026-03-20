'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

const cardVariants = {
  rest: { 
    scale: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
  hover: { 
    scale: 1.02,
    transition: { duration: 0.3, ease: [0.34, 1.56, 0.64, 1] },
  },
};

const innerVariants = {
  rest: { 
    transition: { duration: 0.2 },
  },
  hover: { 
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    transition: { duration: 0.2 },
  },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  className = '',
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return TrendingUp;
    if (trend.value < 0) return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover="hover"
      className={`group ${className}`}
    >
      <motion.div
        variants={cardVariants}
        className="glass-card rounded-2xl p-6 relative overflow-hidden"
      >
        <motion.div
          variants={innerVariants}
          className="glass-card-inner rounded-xl p-5 relative z-10"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-slate-400">
                {label}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-3xl font-bold text-white tracking-tight">
              {value}
            </p>

            {trend && (
              <div className="flex items-center gap-2">
                <span 
                  className={`
                    inline-flex items-center gap-1 text-sm font-medium
                    ${isPositive ? 'text-emerald-400' : ''}
                    ${isNegative ? 'text-red-400' : ''}
                    ${!isPositive && !isNegative ? 'text-slate-400' : ''}
                  `}
                >
                  {TrendIcon && <TrendIcon className="w-4 h-4" />}
                  {Math.abs(trend.value)}%
                  {trend.label && (
                    <span className="text-slate-500 font-normal">
                      {trend.label}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </motion.div>
    </motion.div>
  );
}
