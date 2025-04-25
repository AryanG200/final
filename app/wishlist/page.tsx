"use client";
import Link from "next/link";
import React from "react";
import { Heart, Trash2, ShoppingCart, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import Header from "../head/foot/Header";
import Footer from "../head/foot/Footer";
import { useWishlist } from "../contexts/wishlistContext";
import { useCart } from "../contexts/cartContext";
import Image from "next/image";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  stock?: string;
}

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const handleAddToCart = (product: WishlistItem) => {
    addToCart({
      ...product,
      quantity: 1
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" /> 
            My Wishlist
          </h1>
          <span className="text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-medium">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 mt-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-pink-100 mb-6">
              <Heart className="w-10 h-10 text-pink-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">Start adding items you love to your wishlist to save them for later</p>
            <Link href="/products" passHref>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-6 rounded-xl shadow-md transition-all hover:shadow-lg hover:scale-105">
                Explore Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
            <div className="flex flex-col space-y-4">
              {wishlist.map((item) => (
                <div key={item.id} className="flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors group relative">
                  <div className="flex-shrink-0 relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      layout="fill"
                      objectFit="contain"
                      className="p-2"
                    />
                  </div>
                  
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate pr-20">{item.name}</h3>
                    <p className="text-pink-600 font-semibold">{formatPrice(item.price)}</p>
                    {item.stock === "Out of Stock" && (
                      <span className="inline-flex items-center text-xs text-red-600 mt-1">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Out of Stock
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap"
                      disabled={item.stock === "Out of Stock"}
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Add to Cart</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-pink-50 hover:text-pink-600 transition-colors"
                      onClick={() => removeFromWishlist(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-between items-center border-t border-gray-200 pt-6">
              <Link href="/products" passHref>
                <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                  Continue Shopping
                </Button>
              </Link>
              
              <p className="text-sm text-gray-500">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved in your wishlist
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
