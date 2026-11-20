import { createContext, useContext, useState, useCallback } from 'react';

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const openLogin = useCallback(() => setLoginOpen(true), []);
  const closeLogin = useCallback(() => setLoginOpen(false), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);
  const toggleCatalog = useCallback(() => setCatalogOpen((v) => !v), []);
  const closeCatalog = useCallback(() => setCatalogOpen(false), []);

  return (
    <UiContext.Provider
      value={{
        loginOpen,
        cartOpen,
        catalogOpen,
        openLogin,
        closeLogin,
        openCart,
        closeCart,
        toggleCatalog,
        closeCatalog,
        setCatalogOpen,
      }}
    >
      {children}
    </UiContext.Provider>
  );
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used within UiProvider');
  return ctx;
}
