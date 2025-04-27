"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiShoppingBag, FiSettings, FiLogOut, FiEdit2, FiBell, FiPhone, FiMapPin, FiXCircle } from "react-icons/fi";
import Header from "@/app/head/foot/Header";
import Footer from "@/app/head/foot/Footer";
import styles from "../../../styles/UserDashboard.module.css";
import Link from "next/link";

export default function UserDashboard() {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [profileData, setProfileData] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [updateStatus, setUpdateStatus] = useState("");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || "",
        phone: session.user.phone || "",
        address: session.user.address || "",
      });
    }
  }, [session]);

  useEffect(() => {
    if (activeTab === "orders" && session?.user?.email) {
      fetchOrders();
    }
  }, [activeTab, session]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?email=${session.user.email}`);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data.orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      alert("Failed to fetch orders: " + error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        console.log("Cancelling order:", orderId);
        const response = await fetch(`/api/orders?id=${orderId}`, {
          method: "DELETE",
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to cancel order");
        }
  
        alert("Order cancelled successfully");
        fetchOrders();
      } catch (error) {
        console.error("Error cancelling order:", error);
        alert("Failed to cancel order: " + error.message);
      }
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/" });
  };

  const handleProfileUpdate = async () => {
    try {
      setUpdateStatus("");

      if (!profileData.phone || !profileData.address) {
        setUpdateStatus("Phone number and address are required");
        return;
      }

      const response = await fetch("/api/user/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          phone: profileData.phone,
          address: profileData.address,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setUpdateStatus("Profile updated successfully");
        setIsEditing(false);

        await update({
          ...session,
          user: {
            ...session?.user,
            phone: profileData.phone,
            address: profileData.address,
          },
        });
      } else {
        setUpdateStatus(data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setUpdateStatus("Error connecting to server. Please try again.");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: <FiUser /> },
    { id: "orders", label: "Order History", icon: <FiShoppingBag /> },
    { id: "settings", label: "Settings", icon: <FiSettings /> },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const renderOrderHistory = () => {
    if (orders.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <FiShoppingBag className="text-6xl mb-4 text-indigo-300" />
            <h3 className="text-2xl font-medium text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">
              Start shopping to see your orders here
            </p>
            <Link href="/products" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="overflow-auto">
          {orders.map((order) => (
            <div
              key={order._id}
              className="mb-6 bg-white shadow-md rounded-xl overflow-hidden border border-gray-100"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <span className="text-xs text-gray-500">Order ID: {order._id}</span>
                    <h3 className="text-lg font-semibold mt-1">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </h3>
                  </div>
                  <div className="mt-2 sm:mt-0 flex items-center">
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-medium 
                        ${order.status === "Delivered" 
                          ? "bg-green-100 text-green-800" 
                          : order.status === "Cancelled" 
                          ? "bg-red-100 text-red-800" 
                          : order.status === "In Transit" 
                          ? "bg-blue-100 text-blue-800" 
                          : order.status === "Out for Delivery" 
                          ? "bg-purple-100 text-purple-800" 
                          : order.status === "Processing" 
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {order.status}
                    </span>
                    
                    {order.status === "Pending" && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        className="ml-3 text-red-600 hover:text-red-800 text-sm"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Order Details</h4>
                      <div className="space-y-1">
                        {order.products.map((product) => (
                          <div key={product.productId} className="flex justify-between text-sm">
                            <span>{product.name} × {product.quantity}</span>
                            <span className="font-medium">₹{(product.price * product.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-medium">
                          <span>Total</span>
                          <span>₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Shipping Address</h4>
                      <p className="text-sm">{order.customer.address}</p>
                      
                      {/* Order Status Timeline */}
                      <h4 className="text-sm font-medium text-gray-500 mt-4 mb-2">Order Status Timeline</h4>
                      <div className="space-y-2">
                        {order.statusHistory && order.statusHistory.length > 0 ? (
                          order.statusHistory.map((history, index) => (
                            <div key={index} className="flex items-start">
                              <div className="h-4 w-4 rounded-full bg-indigo-400 mt-1 mr-2"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{history.status}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(history.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">Status history not available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-violet-100 relative">
      {/* Enhanced background blur elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-20 -left-40 w-96 h-96 bg-violet-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed"></div>
        <div className="absolute bottom-40 right-40 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-slow"></div>
      </div>

      <Header />
      <main className="container mx-auto px-4 py-8 relative">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center py-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600">
            Your Dashboard
          </h1>
          <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
            Manage your profile, view orders, and update your preferences
          </p>
        </motion.section>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-xl overflow-hidden mb-16"
        >
          <div className="flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <motion.div className="md:w-64 bg-gradient-to-b from-violet-600/90 via-purple-600/90 to-pink-600/90 text-white p-6">
              <motion.div 
                initial={{ scale: 0.9 }} 
                animate={{ scale: 1 }} 
                className="flex flex-col items-center mb-8"
              >
                <h3 className="text-xl font-semibold">{session?.user?.name}</h3>
                <p className="text-white/80 text-sm">{session?.user?.email}</p>
                <div className="flex gap-6 mt-4">
                  <div className="text-center">
                    <span className="block text-2xl font-bold">{orders.length}</span>
                    <span className="text-xs text-white/80">Orders</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-2xl font-bold">0</span>
                    <span className="text-xs text-white/80">Reviews</span>
                  </div>
                </div>
              </motion.div>

              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      activeTab === tab.id 
                        ? "bg-white/20 font-semibold" 
                        : "hover:bg-white/10"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/90 hover:bg-white/10 transition-colors mt-6"
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  <FiLogOut />
                  <span>{isLoading ? "Signing out..." : "Sign Out"}</span>
                </motion.button>
              </nav>
            </motion.div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeTab} 
                className="flex-1 p-8"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "profile" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600">
                        Profile Information
                      </h2>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gradient-to-r from-violet-600 to-pink-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-shadow"
                        onClick={() => (isEditing ? handleProfileUpdate() : setIsEditing(true))}
                      >
                        <FiEdit2 className="inline mr-2" /> {isEditing ? "Save Changes" : "Edit Profile"}
                      </motion.button>
                    </div>
                    
                    {updateStatus && (
                      <div
                        className={`mb-6 p-4 rounded-xl ${
                          updateStatus.includes("Error") 
                            ? "bg-red-100/80 text-red-700" 
                            : "bg-green-100/80 text-green-700"
                        }`}
                      >
                        {updateStatus}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <motion.div 
                        className="backdrop-blur-xl bg-white/50 rounded-2xl p-6 shadow-md"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Personal Details</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            ) : (
                              <p className="text-gray-800">{profileData.name}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                            <p className="text-gray-800">{session?.user?.email}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              <FiPhone className="inline mr-1" /> Phone Number
                            </label>
                            {isEditing ? (
                              <input
                                type="tel"
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter your phone number"
                              />
                            ) : (
                              <p className="text-gray-800">{profileData.phone || "Not provided"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              <FiMapPin className="inline mr-1" /> Address
                            </label>
                            {isEditing ? (
                              <textarea
                                value={profileData.address}
                                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter your address"
                                rows={3}
                              />
                            ) : (
                              <p className="text-gray-800">{profileData.address || "Not provided"}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                      
                      <motion.div 
                        className="backdrop-blur-xl bg-white/50 rounded-2xl p-6 shadow-md"
                        whileHover={{ y: -4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <h3 className="text-xl font-semibold mb-4 text-gray-800">Account Statistics</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-4 rounded-xl">
                            <FiShoppingBag className="text-purple-600 text-xl mb-2" />
                            <div>
                              <span className="block text-2xl font-bold text-gray-800">{orders.length}</span>
                              <span className="text-sm text-gray-600">Total Orders</span>
                            </div>
                          </div>
                          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl">
                            <FiBell className="text-pink-600 text-xl mb-2" />
                            <div>
                              <span className="block text-2xl font-bold text-gray-800">Active</span>
                              <span className="text-sm text-gray-600">Notification Status</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}

                {activeTab === "orders" && (
                  <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600 mb-6">
                      Order History
                    </h2>
                    
                    {renderOrderHistory()}
                  </div>
                )}

                {activeTab === "settings" && (
                  <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-pink-600 mb-6">
                      Account Settings
                    </h2>
                    
                    <motion.div 
                      className="backdrop-blur-xl bg-white/50 rounded-2xl p-6 shadow-md"
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <h3 className="text-xl font-semibold mb-4 text-gray-800">Notification Preferences</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-4 py-3 bg-white/70 rounded-xl">
                          <span className="font-medium">Email Notifications</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifications}
                              onChange={() => setNotifications(!notifications)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-pink-600"></div>
                          </label>
                        </div>
                        
                        <div className="flex items-center justify-between px-4 py-3 bg-white/70 rounded-xl">
                          <span className="font-medium">Order Updates</span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={orderUpdates}
                              onChange={() => setOrderUpdates(!orderUpdates)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-violet-600 peer-checked:to-pink-600"></div>
                          </label>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}