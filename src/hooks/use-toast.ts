"use client";
import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type Toast = Omit<ToastProps, "id"> & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

type ToasterToast = Toast;

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

let toastCount = 0;

type State = { toasts: ToasterToast[] };

const listeners: ((state: State) => void)[] = [];
let memoryState: State = { toasts: [] };

function dispatch(state: State) {
  memoryState = state;
  listeners.forEach((l) => l(state));
}

function toast(props: Omit<ToasterToast, "id">) {
  const id = String(++toastCount);
  const newToast = { id, ...props };
  dispatch({ toasts: [newToast, ...memoryState.toasts].slice(0, TOAST_LIMIT) });
  setTimeout(() => {
    dispatch({ toasts: memoryState.toasts.filter((t) => t.id !== id) });
  }, TOAST_REMOVE_DELAY);
  return id;
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const idx = listeners.indexOf(setState);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);
  return { ...state, toast, dismiss: (id: string) => dispatch({ toasts: memoryState.toasts.filter((t) => t.id !== id) }) };
}

export { useToast, toast };
