'use client';

import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default function ErrorBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundaryWrapper fallback={fallback}>
      {children}
    </ErrorBoundaryWrapper>
  );
}

function ErrorBoundaryWrapper({ children, fallback }: Props) {
  return <>{children}</>;
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return <Component {...props} />;
  };
}
