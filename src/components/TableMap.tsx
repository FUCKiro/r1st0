import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import type { Table } from '@/lib/tables';

interface Props {
  tables: Table[];
  onTableClick: (table: Table) => void;
  onTableMove: (id: number, x: number, y: number) => void;
}

interface Position {
  x: number;
  y: number;
}

export default function TableMap({ tables, onTableClick, onTableMove }: Props) {
  const [positions, setPositions] = useState<Record<number, Position>>({});
  const [dragState, setDragState] = useState<{
    tableId: number | null;
    startX: number;
    startY: number;
    originalX: number;
    originalY: number;
    hasMoved: boolean;
  } | null>(null);

  useEffect(() => {
    const newPositions: Record<number, Position> = {};
    tables.forEach(table => {
      // Usa la posizione dal database se disponibile
      const index = Object.keys(newPositions).length;
      const spacing = 200; // Spazio tra i tavoli
      newPositions[table.id] = {
        x: table.x_position ?? (100 + (index % 3) * spacing),
        y: table.y_position ?? (100 + Math.floor(index / 3) * spacing)
      };
    });
    setPositions(newPositions);
  }, [tables]);

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent, tableId: number) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const currentPosition = positions[tableId];
    if (!currentPosition) return;

    setDragState({
      tableId,
      startX: clientX,
      startY: clientY,
      originalX: currentPosition.x,
      originalY: currentPosition.y,
      hasMoved: false
    });
  }, [positions]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!dragState) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;

    // Se il mouse si è spostato più di 5 pixel, consideriamo che sta trascinando
    if (!dragState.hasMoved && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      setDragState(prev => prev ? { ...prev, hasMoved: true } : null);
    }

    const newX = Math.max(0, dragState.originalX + deltaX);
    const newY = Math.max(0, dragState.originalY + deltaY);

    setPositions(prev => ({
      ...prev,
      [dragState.tableId!]: { x: newX, y: newY }
    }));
  }, [dragState]);

  const handleMouseUp = useCallback(() => {
    if (dragState?.tableId) {
      const position = positions[dragState.tableId];
      if (dragState.hasMoved && position && !isNaN(position.x) && !isNaN(position.y)) {
        onTableMove(dragState.tableId, position.x, position.y);
        // Aggiorna immediatamente lo stato locale con la nuova posizione
        setPositions(prev => ({
          ...prev,
          [dragState.tableId!]: { x: position.x, y: position.y }
        }));
      }
      // Resetta lo stato del trascinamento dopo un breve delay per evitare il click
      setTimeout(() => {
        setDragState(null);
      }, 0);
    } else {
      setDragState(null);
    }
  }, [dragState, positions, onTableMove]);

  const handleMouseLeave = useCallback(() => {
    if (dragState?.tableId) {
      const position = positions[dragState.tableId];
      if (dragState.hasMoved && position && !isNaN(position.x) && !isNaN(position.y)) {
        onTableMove(dragState.tableId, position.x, position.y);
        // Aggiorna immediatamente lo stato locale con la nuova posizione
        setPositions(prev => ({
          ...prev,
          [dragState.tableId!]: { x: position.x, y: position.y }
        }));
      }
      // Resetta lo stato del trascinamento dopo un breve delay per evitare il click
      setTimeout(() => {
        setDragState(null);
      }, 0);
    } else {
      setDragState(null);
    }
  }, [dragState, positions, onTableMove]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchend', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseLeave);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchend', handleMouseUp);
        window.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp, handleMouseLeave]);

  return (
    <div 
      className="relative w-full h-[calc(100vh-12rem)] bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden"
      onMouseLeave={handleMouseLeave}
    >
      {tables.map((table) => {
        const position = positions[table.id] || { x: 0, y: 0 };
        const isDragging = dragState?.tableId === table.id;

        return (
          <div
            key={table.id}
            onMouseDown={(e) => handleMouseDown(e, table.id)}
            onTouchStart={(e) => handleMouseDown(e, table.id)}
            onClick={(e) => {
              // Previeni il click se stiamo trascinando
              if (dragState?.hasMoved) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              onTableClick(table);
            }}
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              position: 'absolute',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: isDragging ? 9999 : 1,
              touchAction: 'none'
            }}
            className={`p-4 rounded-lg shadow-md w-48 ${
              table.status === 'occupied' ? 'bg-red-50 border-2 border-red-500' :
              table.status === 'reserved' ? 'bg-yellow-50 border-2 border-yellow-500' :
              'bg-green-50 border-2 border-green-500'
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Tavolo {table.number}</h3>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  table.status === 'occupied' ? 'bg-red-100 text-red-800' :
                  table.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}
              >
                {table.status === 'occupied' ? 'Occupato' :
                 table.status === 'reserved' ? 'Prenotato' : 'Libero'}
              </span>
            </div>
            <div className="flex items-center text-gray-600 text-sm">
              <Users className="w-4 h-4 mr-1" />
              <span>{table.capacity}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}