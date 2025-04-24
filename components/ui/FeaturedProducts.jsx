import { useEffect, useState } from "react";
import { useCart } from "../../app/contexts/cartContext";

export default function FeaturedProducts() {
    const [products, setProducts] = useState([]);
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
    const [wishlistItems, setWishlistItems] = useState({});
    const { addToCart } = useCart(); // Get addToCart from CartContext
  
    useEffect(() => {
      async function fetchFeaturedProducts() {
        const response = await fetch("/api/featured-products");
        const data = await response.json();
        setProducts(data.products);
      }
  
      fetchFeaturedProducts();
    }, []);
    
    // Function to show toast notification
    const showToast = (message, type = "success") => {
      setToast({ visible: true, message, type });
      setTimeout(() => {
        setToast({ visible: false, message: "", type: "success" });
      }, 3000);
    };
    
    // Handle add to cart with toast notification
    const handleAddToCart = (product) => {
      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image
      });
      showToast("Item added to cart", "cart");
    };

    // Toggle wishlist status for a specific product
    const toggleWishlist = (productId, productName) => {
      setWishlistItems(prev => {
        const newWishlist = { ...prev };
        if (newWishlist[productId]) {
          // If product is already in wishlist, remove it
          delete newWishlist[productId];
          showToast(`Removed from wishlist`, "wishlist-remove");
        } else {
          // If product is not in wishlist, add it
          newWishlist[productId] = true;
          showToast(`Added to wishlist`, "wishlist-add");
        }
        return newWishlist;
      });
    };
  
    return (
      <section className="mb-16 px-4">
        <h2 className="text-5xl font-bold text-center mb-4 animate-in font-poppins">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-600 via-purple-600 to-violet-600">
            Featured Products
          </span>
        </h2>
        <p className="text-center text-gray-700 mb-10 text-lg max-w-2xl mx-auto font-roboto">
          Check out our specially curated selection!
        </p>
  
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div 
              key={product._id} 
              className="group bg-white shadow-lg rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl flex flex-col font-roboto"
            >
              <div className="relative overflow-hidden h-64">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-4 rounded-t-xl transition-transform duration-500 group-hover:scale-105"
                />
                {/* Add wishlist heart icon */}
                <button 
                  className="absolute top-2 left-2 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product._id, product.name);
                  }}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 ${wishlistItems[product._id] ? 'text-pink-600 fill-pink-600' : 'text-gray-500'}`} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={wishlistItems[product._id] ? "0" : "2"}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                
                <div className="absolute top-2 right-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium text-white 
                    ${product.badge === 'New' ? 'bg-gradient-to-r from-pink-500 to-violet-500' : ''} 
                    ${product.badge === 'Bestseller' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : ''} 
                    ${product.badge === 'Limited Edition' ? 'bg-gradient-to-r from-purple-500 to-indigo-500' : ''} 
                    ${product.badge === 'Trending' ? 'bg-gradient-to-r from-red-500 to-pink-500' : ''}`}>
                    {product.badge || "Featured"}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-grow flex flex-col">
                <h3 className="text-xl font-bold text-gray-800 group-hover:text-pink-600 transition-colors duration-300 mb-2 font-poppins">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                <div className="mt-auto">
                  <div className="flex items-center justify-between h-14">
                    <div>
                      <p className="text-xl font-bold text-pink-600 font-poppins">₹{product.price}</p>
                      <p className="text-xs text-gray-500">Inclusive of taxes</p>
                    </div>
                    <button 
                      className="bg-black hover:bg-gradient-to-r hover:from-pink-500 hover:to-violet-500 text-white px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg font-medium"
                      onClick={() => handleAddToCart(product)}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-500 pt-3">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4h1.5l1.8 8.7a2 2 0 002 1.3h8.4a2 2 0 002-1.3L20 4h-1.5l-1.8 8.7a.5.5 0 01-.5.3H7.7a.5.5 0 01-.5-.3L5.5 4z" />
                    </svg>
                    Free Delivery
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    4.5/5
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Toast Notification */}
        {toast.visible && (
          <div className={`fixed bottom-4 right-4 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-slideIn font-poppins
            ${toast.type === 'cart' ? 'bg-gradient-to-r from-green-500 to-emerald-600' : ''}
            ${toast.type === 'wishlist-add' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
            ${toast.type === 'wishlist-remove' ? 'bg-gradient-to-r from-gray-600 to-gray-700' : ''}
          `}>
            {toast.type === 'cart' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill={toast.type === 'wishlist-add' ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={toast.type === 'wishlist-add' ? 1 : 2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
            <span className="font-bold text-lg">{toast.message}</span>
          </div>
        )}
      </section>
    );
  }
  