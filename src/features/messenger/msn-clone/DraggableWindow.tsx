"use client";

import Draggable from "react-draggable";
import type { ReactNode } from "react";
import { useRef } from "react";

type DraggableWindowProps = {
  children: ReactNode;
  initialX: number;
  initialY: number;
};

export function DraggableWindow({ children, initialX, initialY }: DraggableWindowProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  return (
    <Draggable
      defaultPosition={{ x: initialX, y: initialY }}
      handle=".handle"
      nodeRef={nodeRef}
    >
      <div className="msn-draggable-window" ref={nodeRef}>
        {children}
      </div>
    </Draggable>
  );
}
