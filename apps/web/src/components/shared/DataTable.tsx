'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from 'lucide-react';
import { ReactNode, useState, useMemo } from 'react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  onRowClick?: (row: T) => void;
  className?: string;
  variant?: 'default' | 'minimal';
}

type SortDirection = 'asc' | 'desc' | null;

const iconVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
  hover: {
    backgroundColor: 'rgba(16, 185, 129, 0.03)',
    transition: { duration: 0.15 },
  },
};

const skeletonRowVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon: EmptyIcon = Inbox,
  onRowClick,
  className = '',
  variant = 'default',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (key: string) => {
    if (sortKey !== key) {
      return (
        <motion.div
          initial="hidden"
          animate="hidden"
          className="text-slate-500"
        >
          <ChevronsUpDown className="w-4 h-4" />
        </motion.div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        {sortDirection === 'asc' ? (
          <motion.div
            key="asc"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={iconVariants}
            transition={{ duration: 0.15 }}
            className="text-emerald-400"
          >
            <ChevronUp className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="desc"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={iconVariants}
            transition={{ duration: 0.15 }}
            className="text-emerald-400"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  const skeletonRows = Array.from({ length: 5 }, (_, i) => i);

  return (
    <div className={`w-full ${className}`}>
      <div className={`overflow-hidden ${variant === 'default' ? 'rounded-xl' : 'rounded-lg'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {variant === 'default' ? (
                <tr className="border-b border-white/5">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`
                        px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider
                        text-slate-400
                        ${column.sortable ? 'cursor-pointer select-none hover:text-slate-200 transition-colors' : ''}
                        ${column.className || ''}
                      `}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.header}
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              ) : (
                <tr className="bg-transparent">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`
                        px-4 py-2 text-left text-xs font-medium uppercase tracking-wider
                        text-slate-500
                        ${column.sortable ? 'cursor-pointer select-none hover:text-slate-300 transition-colors' : ''}
                        ${column.className || ''}
                      `}
                      style={{ width: column.width }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.header}
                        {column.sortable && getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              )}
            </thead>
            <tbody>
              {loading ? (
                skeletonRows.map((i) => (
                  <motion.tr
                    key={`skeleton-${i}`}
                    custom={i}
                    variants={skeletonRowVariants}
                    initial="hidden"
                    animate="visible"
                    className="border-b border-white/[0.03]"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-4">
                        <div className="h-5 w-24 animate-shimmer rounded" />
                      </td>
                    ))}
                  </motion.tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                        <EmptyIcon className="w-6 h-6 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-slate-300 font-medium">{emptyMessage}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row, index) => (
                  <motion.tr
                    key={String(row[keyField])}
                    custom={index}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    onClick={() => onRowClick?.(row)}
                    className={`
                      border-b border-white/[0.03] transition-colors
                      ${index % 2 === 1 ? 'bg-slate-900/30' : 'bg-transparent'}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`
                          px-4 py-4 text-sm text-slate-300
                          ${column.className || ''}
                        `}
                      >
                        {column.render
                          ? column.render(row, index)
                          : String(row[column.key] ?? '')}
                      </td>
                    ))}
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
