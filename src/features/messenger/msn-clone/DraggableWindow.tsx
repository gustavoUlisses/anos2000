"use client";

import type { ReactNode } from "react";
import { useRef, useState } from "react";

type DraggableWindowProps = {
  children: ReactNode;
  initialX: number;
  initialY: number;
};

export function DraggableWindow({ children, initialX, initialY }: DraggableWindowProps) {
  const dragRef = useRef({
    offsetX: 0,
    offsetY: 0,
    pointerId: 0,
  });
  const [position, setPosition] = useState({ x: initialX, y: initialY });

  function startDrag(event: React.PointerEvent<HTMLDivElement>) {
    const dragHandle = (event.target as HTMLElement).closest(".handle");

    if (!dragHandle) {
      return;
    }

    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    dragRef.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      pointerId: event.pointerId,
    };
    target.setPointerCapture(event.pointerId);
  }

  function drag(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(dragRef.current.pointerId)) {
      return;
    }

    const parent = event.currentTarget.parentElement?.getBoundingClientRect();
    const bounds = parent ?? { left: 0, top: 0 };

    setPosition({
      x: event.clientX - bounds.left - dragRef.current.offsetX,
      y: event.clientY - bounds.top - dragRef.current.offsetY,
    });
  }

  function stopDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      className="msn-draggable-window"
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={stopDrag}
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
    >
      {children}
    </div>
  );
}
