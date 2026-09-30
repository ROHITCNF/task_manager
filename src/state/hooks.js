/**
 * React bindings for the vanilla stores. Only tier-3 features use these (HLD §7).
 * The stores object is created in src/app/stores.js and provided via <StoresProvider>.
 */
import { createContext, createElement, useContext } from 'react';
import { useStore } from 'zustand';

const StoresContext = createContext(null);

/** @param {{ stores: object, children: import('react').ReactNode }} props */
export function StoresProvider({ stores, children }) {
  return createElement(StoresContext.Provider, { value: stores }, children);
}

export function useStores() {
  const stores = useContext(StoresContext);
  if (!stores) throw new Error('useStores must be used inside <StoresProvider>');
  return stores;
}

const identity = (s) => s;
const bind = (name) => (selector = identity) => useStore(useStores()[name], selector);

export const useSession = bind('session');
export const useWorkspace = bind('workspace');
export const useTasks = bind('tasks');
export const useCalendar = bind('calendar');
export const useClients = bind('clients');
export const useDashboard = bind('dashboard');
export const useQuickCapture = bind('quickCapture');
export const useUi = bind('ui');
export const useInbox = bind('inbox');
export const useDocs = bind('docs');
export const useTaskDetail = bind('taskDetail');
