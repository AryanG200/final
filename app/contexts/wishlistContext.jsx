"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

/**
 * @typedef {Object} WishlistItem
 * @property {string} id
 * @property {string} name
 * @property {number} price
 * @property {string} image
 * @property {string} stock
 */

/**
 * @typedef {Object} WishlistContextType
 * @property {WishlistItem[]} wishlist
 * @property {(product: WishlistItem) => void} toggleWishlistItem
 * @property {(productId: string) => void} removeFromWishlist
 * @property {() => void} clearWishlist
 * @property {(productId: string) => boolean} isInWishlist
 */

/**
 * @param {{ children: React.ReactNode }} props
 */
export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  // Load wishlist from localStorage on initial render
  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlistItem = (product) => {
    // Ensure product has a unique ID
    const productWithId = {
      ...product,
      id: product.id || `product-${Date.now()}`,
    };
    
    setWishlist((prev) => {
      const isInWishlist = prev.some((item) => item.id === productWithId.id);
      
      if (isInWishlist) {
        return prev.filter((item) => item.id !== productWithId.id);
      } else {
        return [...prev, { ...productWithId }];
      }
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const clearWishlist = () => {
    setWishlist([]);
  };

  const isInWishlist = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  /** @type {WishlistContextType} */
  const contextValue = {
    wishlist,
    toggleWishlistItem,
    removeFromWishlist,
    clearWishlist,
    isInWishlist
  };

  return (
    <WishlistContext.Provider value={contextValue}>
      {children}
    </WishlistContext.Provider>
  );
}

/**
 * @returns {WishlistContextType}
 */
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
} 