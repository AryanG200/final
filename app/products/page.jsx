"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation"; // Import useSearchParams
import Image from "next/image";
import Link from "next/link";
import { Heart, CheckCircle, AlertCircle, ShoppingCart } from "lucide-react";
import { useCart } from "../contexts/cartContext";
import { useWishlist } from "../contexts/wishlistContext";
import Header from "../head/foot/Header";
import Footer from "../head/foot/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const categories = ["Gift-items", "Office-essentials", "School-supplies"];

export default function ProductPage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState([]);
  const [sortOrder, setSortOrder] = useState("default");
  const { cart, addToCart } = useCart();
  const { wishlist, toggleWishlistItem, isInWishlist } = useWishlist();
  const [popup, setPopup] = useState({ visible: false, message: "" });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [cartAnimations, setCartAnimations] = useState({});
  const [productQuantities, setProductQuantities] = useState({});

  // Use useSearchParams to read the category query parameter
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  useEffect(() => {
    // Fetch products
    fetch("/api/prod_page")
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched products:", data.products); // Debugging
        // Ensure each product has a unique ID
        const productsWithIds = (data.products || []).map(product => ({
          ...product,
          id: product.id || `product-${Math.random().toString(36).substr(2, 9)}`
        }));
        setProducts(productsWithIds);
      })
      .catch((error) => console.error("Error fetching products:", error));
  }, []);

  // Set the filter based on the category query parameter
  useEffect(() => {
    if (category) {
      setFilters([category]);
    }
  }, [category]);

  const handleFilterChange = (category) => {
    setFilters(category === "All" ? [] : [category]);
  };

  const handleWishlistToggle = (product) => {
    toggleWishlistItem(product);
    
    const message = isInWishlist(product.id) 
      ? "Item removed from your wishlist."
      : "Item added to your wishlist.";
    
    showPopup(message);
  };

  const showPopup = (message) => {
    setPopup({ visible: true, message });
    setTimeout(() => setPopup({ visible: false, message: "" }), 3000);
  };

  const filteredProducts = products.filter(
    (product) => filters.length === 0 || filters.includes(product.category)
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === "priceLowToHigh") return a.price - b.price;
    if (sortOrder === "priceHighToLow") return b.price - a.price;
    return 0;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const handleAddToCart = (product, isIncrement = true) => {
    const productWithId = {
      ...product,
      id: product.id || `product-${Date.now()}`,
    };
    
    // Update quantities
    setProductQuantities(prev => ({
      ...prev,
      [productWithId.id]: (prev[productWithId.id] || 0) + (isIncrement ? 1 : -1)
    }));

    // Start the animation
    setCartAnimations(prev => ({
      ...prev,
      [productWithId.id]: isIncrement ? '+1' : '-1'
    }));

    // Add/remove from cart
    addToCart(productWithId, isIncrement);
    
    // Show toast notification
    if (isIncrement) {
      showPopup("Item added to your cart.");
    } else if (productQuantities[productWithId.id] > 1) {
      showPopup("Item quantity updated.");
    }

    // Reset animation after 1 second
    setTimeout(() => {
      setCartAnimations(prev => ({
        ...prev,
        [productWithId.id]: false
      }));
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white relative">
      {/* Toast Notification */}
      {popup.visible && (
        <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slideIn">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">{popup.message}</span>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setSelectedImage(0);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close modal"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 flex flex-col gap-4">
                  <div className="relative aspect-square bg-white rounded-xl overflow-hidden">
                    <div className="absolute inset-0 p-8">
                      <Image
                        src={selectedProduct.images?.[selectedImage] || "/placeholder.svg"}
                        alt={`${selectedProduct.name} - View ${selectedImage + 1}`}
                        layout="fill"
                        objectFit="contain"
                        className="transition-transform duration-500 hover:scale-105"
                        style={{ 
                          mixBlendMode: 'multiply',
                          filter: 'contrast(1.05) brightness(1.05)'
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {selectedProduct.images?.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`relative aspect-square bg-white rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                          selectedImage === index ? 'ring-2 ring-purple-600 ring-offset-2' : 'border border-gray-200'
                        }`}
                      >
                        <div className="absolute inset-0 p-2">
                          <Image
                            src={img || "/placeholder.svg"}
                            alt={`${selectedProduct.name} - Thumbnail ${index + 1}`}
                            layout="fill"
                            objectFit="contain"
                            style={{ mixBlendMode: 'multiply' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-600 mb-4 text-sm">{selectedProduct.description}</p>
                  <p className="text-lg font-bold mb-4">{formatPrice(selectedProduct.price)}</p>
                  <button
                    onClick={() => {
                      const productWithId = {
                        ...selectedProduct,
                        id: selectedProduct.id || `product-${Date.now()}`,
                      };
                      handleAddToCart(productWithId);
                      setSelectedProduct(null);
                      setSelectedImage(0);
                    }}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 px-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12 sticky top-0 bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm">
          <nav aria-label="Breadcrumb" className="hidden sm:block">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link href="/" className="text-gray-500 hover:text-gray-700">Home</Link></li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-900 font-medium">Products</li>
            </ol>
          </nav>
          
          <div className="flex gap-4">
            <select
              value={filters[0] || "All"}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              aria-label="Filter by category"
            >
              <option value="All">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              aria-label="Sort products"
            >
              <option value="default">Sort By</option>
              <option value="priceLowToHigh">Price: Low to High</option>
              <option value="priceHighToLow">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 container mx-auto px-4 py-12">
          {sortedProducts.map((product) => (
            <Card key={product.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-full flex flex-col">
              <CardContent className="p-0 flex-1">
                <div 
                  className="relative aspect-square bg-white cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details of ${product.name}`}
                >
                  <div className="absolute inset-0 p-6">
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.name}
                      layout="fill"
                      objectFit="contain"
                      className="transition-transform duration-500 group-hover:scale-110"
                      style={{ 
                        mixBlendMode: 'multiply',
                        filter: 'contrast(1.05) brightness(1.05)'
                      }}
                    />
                  </div>
                  {product.stock === "Out of Stock" && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                      <p className="text-white font-medium flex items-center px-4 py-2 bg-red-500/80 rounded-lg">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Out of Stock
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="p-6 bg-gradient-to-b from-white to-gray-50/50">
                <div className="w-full space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-purple-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-purple-600 font-bold">{formatPrice(product.price)}</p>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 flex items-center gap-2">
                      {productQuantities[product.id] > 0 ? (
                        <>
                          <Button
                            size="icon"
                            className="bg-purple-600 hover:bg-purple-700 h-10 w-10 relative"
                            onClick={() => handleAddToCart(product, false)}
                          >
                            -
                          </Button>
                          <span className="font-medium">{productQuantities[product.id] || 0}</span>
                          <Button
                            size="icon"
                            className="bg-purple-600 hover:bg-purple-700 h-10 w-10 relative"
                            onClick={() => handleAddToCart(product)}
                          >
                            +
                          </Button>
                        </>
                      ) : (
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 transition-all duration-300 transform hover:scale-105"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === "Out of Stock"}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add to Cart
                        </Button>
                      )}
                      {cartAnimations[product.id] && (
                        <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-ping">
                          {cartAnimations[product.id]}
                        </span>
                      )}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleWishlistToggle(product)}
                      className="border-2 hover:bg-pink-50 transition-colors"
                      aria-label={`Add ${product.name} to wishlist`}
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          isInWishlist(product.id)
                            ? "fill-current text-pink-500"
                            : "text-gray-400"
                        }`}
                      />
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}