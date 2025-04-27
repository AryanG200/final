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
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <FiShoppingBag className="text-4xl text-indigo-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              When you place orders, they will appear here for you to track
            </p>
            <Link href="/products" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Browse Products
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white rounded-xl overflow-hidden border border-gray-200 transition-shadow hover:shadow-md"
          >
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-4 flex flex-wrap justify-between items-center">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                    Order #{order._id.substring(0, 8)}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mt-1">
                  {order.products.length} {order.products.length === 1 ? 'item' : 'items'} · ₹{parseFloat(order.totalAmount).toFixed(2)}
                </h3>
              </div>
              <div className="flex items-center space-x-3 mt-2 sm:mt-0">
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
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                    }`}
                >
                  {order.status}
                </span>
                
                {order.status === "Pending" && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="text-red-600 hover:text-red-800 text-sm bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row md:space-x-6">
                <div className="flex-1 mb-4 md:mb-0">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Items</h4>
                  <div className="space-y-3">
                    {order.products.map((product) => (
                      <div key={product.productId} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                            <span className="text-gray-500 text-xs">{product.quantity}x</span>
                          </div>
                          <span className="text-sm text-gray-800">{product.name}</span>
                        </div>
                        <span className="text-sm font-medium">₹{(product.price * product.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between font-medium">
                      <span>Total</span>
                      <span>₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Shipping Information</h4>
                  <div className="mb-4">
                    <p className="text-sm text-gray-500">Delivery Address:</p>
                    <p className="text-sm text-gray-800">{order.customer.address}</p>
                  </div>
                  
                  <h4 className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">Status Timeline</h4>
                  <div className="space-y-3">
                    {order.statusHistory && order.statusHistory.length > 0 ? (
                      order.statusHistory.map((history, index) => (
                        <div key={index} className="flex items-start">
                          <div className="relative">
                            <div className="h-4 w-4 rounded-full bg-indigo-500 mt-1"></div>
                            {index !== order.statusHistory.length - 1 && (
                              <div className="absolute top-5 bottom-0 left-2 w-0.5 -ml-px bg-indigo-200"></div>
                            )}
                          </div>
                          <div className="ml-4 pb-5">
                            <p className="text-sm font-medium text-gray-900">{history.status}</p>
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
        ))}
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
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-b from-indigo-100 to-indigo-50 rounded-bl-full opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-t from-purple-100 to-purple-50 rounded-tr-full opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <Header />
      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Dashboard header */}
        <section className="mb-8 text-center py-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">
            Welcome back, <span className="text-indigo-600">{session?.user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage your profile, track orders, and update your preferences
          </p>
        </section>

        {/* Dashboard content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <div className="bg-indigo-600 md:w-64 p-6 md:py-8">
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {session?.user?.name?.charAt(0)}
                </div>
                <h3 className="text-xl font-semibold text-white">{session?.user?.name}</h3>
                <p className="text-indigo-200 text-sm">{session?.user?.email}</p>
                <div className="flex gap-6 mt-5 w-full justify-center">
                  <div className="text-center bg-white/10 rounded-lg px-3 py-2 flex-1">
                    <span className="block text-2xl font-bold text-white">{orders.length}</span>
                    <span className="text-xs text-indigo-200">Orders</span>
                  </div>
                  <div className="text-center bg-white/10 rounded-lg px-3 py-2 flex-1">
                    <span className="block text-2xl font-bold text-white">0</span>
                    <span className="text-xs text-indigo-200">Reviews</span>
                  </div>
                </div>
              </div>

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id 
                        ? "bg-indigo-700 text-white font-medium" 
                        : "text-indigo-100 hover:bg-indigo-700/50"
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-indigo-100 hover:bg-indigo-700/50 transition-colors mt-6 border-t border-indigo-500/30 pt-6"
                  onClick={handleSignOut}
                  disabled={isLoading}
                >
                  <FiLogOut className="text-lg" />
                  <span>{isLoading ? "Signing out..." : "Sign Out"}</span>
                </button>
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 md:p-8">
              {activeTab === "profile" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Profile Information
                    </h2>
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${isEditing 
                        ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"} 
                        transition-colors flex items-center gap-2`}
                      onClick={() => (isEditing ? handleProfileUpdate() : setIsEditing(true))}
                    >
                      <FiEdit2 className="text-current" /> {isEditing ? "Save Changes" : "Edit Profile"}
                    </button>
                  </div>
                  
                  {updateStatus && (
                    <div
                      className={`mb-6 p-4 rounded-lg border ${
                        updateStatus.includes("Error") 
                          ? "bg-red-50 border-red-200 text-red-700" 
                          : "bg-green-50 border-green-200 text-green-700"
                      }`}
                    >
                      {updateStatus}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800 pb-2 border-b border-gray-100">Personal Information</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                          {isEditing ? (
                            <input
                              type="text"
                              value={profileData.name}
                              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          ) : (
                            <p className="text-gray-800 py-2">{profileData.name}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <p className="text-gray-800 py-2">{session?.user?.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FiPhone className="inline mr-2 text-indigo-500" /> Phone Number
                          </label>
                          {isEditing ? (
                            <input
                              type="tel"
                              value={profileData.phone}
                              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter your phone number"
                            />
                          ) : (
                            <p className="text-gray-800 py-2">{profileData.phone || "Not provided"}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FiMapPin className="inline mr-2 text-indigo-500" /> Shipping Address
                          </label>
                          {isEditing ? (
                            <textarea
                              value={profileData.address}
                              onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter your address"
                              rows={3}
                            />
                          ) : (
                            <p className="text-gray-800 py-2">{profileData.address || "Not provided"}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-lg font-semibold mb-4 text-gray-800 pb-2 border-b border-gray-100">Account Statistics</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-indigo-50 p-4 rounded-xl">
                          <FiShoppingBag className="text-indigo-500 text-xl mb-2" />
                          <div>
                            <span className="block text-2xl font-bold text-gray-800">{orders.length}</span>
                            <span className="text-sm text-gray-600">Total Orders</span>
                          </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-xl">
                          <FiBell className="text-purple-500 text-xl mb-2" />
                          <div>
                            <span className="block text-2xl font-bold text-gray-800">Active</span>
                            <span className="text-sm text-gray-600">Notification Status</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-3">Recent Activity</h4>
                        <div className="space-y-2">
                          {orders.length > 0 ? (
                            <div className="bg-gray-50 p-4 rounded-lg text-sm">
                              <p className="font-medium text-gray-900">Order #{orders[0]._id.substring(0, 8)}</p>
                              <p className="text-gray-600 text-xs mt-1">
                                {new Date(orders[0].createdAt).toLocaleDateString()}
                              </p>
                              <p className="mt-2 text-indigo-600 font-medium">{orders[0].status}</p>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500">
                              No recent activity
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "orders" && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                    <div className="text-sm text-gray-500">
                      Total Orders: <span className="font-medium text-indigo-600">{orders.length}</span>
                    </div>
                  </div>
                  
                  {renderOrderHistory()}
                </div>
              )}

              {activeTab === "settings" && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Account Settings
                  </h2>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 pb-2 border-b border-gray-100">Notification Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-800 block mb-1">Email Notifications</span>
                          <span className="text-sm text-gray-500">Receive emails about your orders and account activity</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications}
                            onChange={() => setNotifications(!notifications)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-800 block mb-1">Order Status Updates</span>
                          <span className="text-sm text-gray-500">Get notified when your order status changes</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={orderUpdates}
                            onChange={() => setOrderUpdates(!orderUpdates)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 pb-2 border-b border-gray-100">Security Settings</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-2">Change Password</h4>
                        <p className="text-sm text-gray-500 mb-3">Ensure your account is using a secure password</p>
                        <button className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                          Update Password
                        </button>
                      </div>
                      
                      <div className="p-4 rounded-lg border border-red-100 bg-red-50">
                        <h4 className="font-medium text-gray-700 mb-2">Delete Account</h4>
                        <p className="text-sm text-gray-500 mb-3">Permanently delete your account and all data</p>
                        <button className="bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}