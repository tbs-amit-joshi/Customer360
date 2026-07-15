import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

export interface ResizableColumnConfig {
  id: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
}

type ResizeSession = {
  columnId: string;
  startX: number;
  startWidth: number;
  minWidth: number;
  maxWidth: number;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export function useResizableColumns(columns: ResizableColumnConfig[]) {
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((column) => [column.id, column.width]))
  );
  const sessionRef = useRef<ResizeSession | null>(null);
  const widthsRef = useRef(widths);
  const columnsRef = useRef(columns);

  useEffect(() => {
    widthsRef.current = widths;
  }, [widths]);

  useEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  useEffect(() => {
    setWidths((prev) => {
      let changed = false;
      const next: Record<string, number> = { ...prev };

      columns.forEach((column) => {
        if (next[column.id] === undefined) {
          next[column.id] = column.width;
          changed = true;
        }
      });

      Object.keys(next).forEach((key) => {
        if (!columns.some((column) => column.id === key)) {
          delete next[key];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [columns]);

  const stopResize = useCallback(() => {
    sessionRef.current = null;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const handleResizeMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const session = sessionRef.current;
    if (!session) {
      return;
    }

    event.preventDefault();
    const delta = event.clientX - session.startX;
    const nextWidth = clamp(session.startWidth + delta, session.minWidth, session.maxWidth);

    setWidths((prev) => {
      if (prev[session.columnId] === nextWidth) {
        return prev;
      }

      return {
        ...prev,
        [session.columnId]: nextWidth
      };
    });
  }, []);

  const handleResizeEnd = useCallback(() => {
    if (!sessionRef.current) {
      return;
    }

    stopResize();
  }, [stopResize]);

  useEffect(() => {
    return () => {
      stopResize();
    };
  }, [stopResize]);

  const startResize = useCallback((columnId: string, event: ReactPointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const column = columnsRef.current.find((item) => item.id === columnId);
    if (!column) {
      return;
    }

    const target = event.currentTarget as HTMLElement & {
      setPointerCapture?: (pointerId: number) => void;
    };

    try {
      target.setPointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture is best-effort only.
    }

    sessionRef.current = {
      columnId,
      startX: event.clientX,
      startWidth: widthsRef.current[columnId] ?? column.width,
      minWidth: column.minWidth ?? 64,
      maxWidth: column.maxWidth ?? Number.POSITIVE_INFINITY
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, []);

  const getColumnWidth = useCallback(
    (columnId: string) => widths[columnId] ?? columnsRef.current.find((item) => item.id === columnId)?.width ?? 0,
    [widths]
  );

  const tableWidth = useMemo(() => {
    return columns.reduce((total, column) => total + getColumnWidth(column.id), 0);
  }, [columns, getColumnWidth]);

  const getColStyle = useCallback(
    (columnId: string) => {
      const width = getColumnWidth(columnId);
      return {
        width: `${width}px`,
        minWidth: `${width}px`,
        maxWidth: `${width}px`
      };
    },
    [getColumnWidth]
  );

  return {
    tableWidth,
    getColStyle,
    startResize,
    handleResizeMove,
    handleResizeEnd
  };
}

interface ResizeHandleProps {
  columnId: string;
  onResizeStart: (columnId: string, event: ReactPointerEvent<HTMLElement>) => void;
  onResizeMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onResizeEnd: () => void;
  className?: string;
}

export function ResizeHandle({
  columnId,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  className = ''
}: ResizeHandleProps) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize column"
      className={`absolute right-0 top-0 h-full w-4 cursor-col-resize touch-none select-none ${className}`}
      onPointerDown={(event) => onResizeStart(columnId, event)}
      onPointerMove={onResizeMove}
      onPointerUp={onResizeEnd}
      onPointerCancel={onResizeEnd}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="absolute right-1.5 top-1/2 h-6 w-px -translate-y-1/2 rounded bg-slate-300/0 group-hover:bg-slate-400/70 transition-colors" />
    </span>
  );
}
