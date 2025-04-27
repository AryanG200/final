"use client";

import { useState, useEffect } from "react";
import { Plus, TrendingUp, Users, Package, ShoppingCart } from "lucide-react";
import Header from "../head/foot/Header";
import Footer from "../head/foot/Footer";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    category: "",
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formTitle, setFormTitle] = useState("Add New Product");
  const [submitButtonText, setSubmitButtonText] = useState("Add Product");
  const [analytics, setAnalytics] = useState({
    dailyRevenue: [],
    topProducts: [],
    salesByCategory: [],
    metrics: {
      totalRevenue: 0,
      totalOrders: 0,
      totalUsers: 0,
      averageOrderValue: 0,
    }
  });
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      fetchUsers();
      fetchProducts();
      fetchOrders();
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      calculateAnalytics();
    }
  }, [orders, products, users]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      if (data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
  
      // Check if response is OK (200-299)
      if (!response.ok) {
        console.error("API Error:", response.status, response.statusText);
        return;
      }
  
      // Check if response has content before parsing JSON
      const text = await response.text();
      if (!text) {
        console.warn("Empty response from API");
        return;
      }
  
      // Parse JSON safely
      const data = JSON.parse(text);
  
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === "admin@gmail.com" && password === "admin") {
      setIsLoggedIn(true);
      localStorage.setItem("isAdminLoggedIn", "true");
      setError("");
    } else {
      setError("Invalid credentials");
    }
  };

  const handleImageChange = (file) => {
    if (file) {
      setProductData({ ...productData, image: file });
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("name", productData.name);
      formData.append("description", productData.description);
      formData.append("price", productData.price);
      formData.append("quantity", productData.quantity);
      formData.append("category", productData.category);

      // Append image if it's a File
      if (productData.image instanceof File) {
        formData.append("image", productData.image);
      } else {
        console.warn("Image is not a File. Value:", productData.image);
      }

      let response;
      if (isEditing && editingProduct) {
        response = await fetch(`/api/products?id=${editingProduct._id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        response = await fetch("/api/products", {
          method: "POST",
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process product");
      }

      alert(isEditing ? "Product updated successfully" : "Product added successfully");

      // Reset form
      setProductData({
        name: "",
        description: "",
        price: "",
        quantity: "",
        category: "",
        image: null,
      });

      setImagePreview(null);
      fetchProducts();
      setIsEditing(false);
      setEditingProduct(null);
      setFormTitle("Add New Product");
      setSubmitButtonText("Add Product");
    } catch (error) {
      console.error("Error processing product:", error);
      alert("Failed to process product: " + error.message);
    }
  };

  const handleEditProduct = (product) => {
    setIsEditing(true);
    setEditingProduct(product);
    setProductData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      category: product.category,
      image: null,
    });
    setImagePreview(product.image);
    setFormTitle("Edit Product");
    setSubmitButtonText("Update Product");
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/products?id=${productId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete product");
        }

        alert("Product deleted successfully");
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product: " + error.message);
      }
    }
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      setIsLoggedIn(false);
      localStorage.removeItem("isAdminLoggedIn");
      setIsLoggingOut(false);
      setEmail("");
      setPassword("");
    }, 1000);
  };

  const calculateDailyRevenue = (orders) => {
    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      revenue: orders
        .filter(order => order.createdAt.split('T')[0] === date)
        .reduce((sum, order) => sum + (parseFloat(order.totalAmount) || 0), 0)
        .toFixed(2)
    }));
  };

  const calculateTopProducts = (orders) => {
    const productSales = {};
    orders.forEach(order => {
      order.products.forEach(product => {
        if (!productSales[product.productId]) {
          productSales[product.productId] = {
            name: product.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[product.productId].quantity += product.quantity;
        productSales[product.productId].revenue += product.price * product.quantity;
      });
    });
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const calculateSalesByCategory = (products, orders) => {
    const categorySales = {};
    orders.forEach(order => {
      order.products.forEach(orderProduct => {
        const product = products.find(p => p._id === orderProduct.productId);
        if (product) {
          if (!categorySales[product.category]) {
            categorySales[product.category] = 0;
          }
          categorySales[product.category] += orderProduct.quantity;
        }
      });
    });
    return Object.entries(categorySales).map(([category, sales]) => ({
      category,
      sales
    }));
  };

  const calculateAnalytics = () => {
    // Calculate total revenue with proper decimal handling
    const totalRevenue = orders.reduce((sum, order) => {
      const amount = parseFloat(order.totalAmount) || 0;
      return sum + amount;
    }, 0);

    // Calculate average order value with proper decimal handling
    const averageOrderValue = orders.length > 0 
      ? totalRevenue / orders.length 
      : 0;

    // Calculate daily revenue for the past 7 days
    const dailyRevenue = calculateDailyRevenue(orders);

    // Calculate top selling products
    const topProducts = calculateTopProducts(orders);

    // Calculate sales by category
    const salesByCategory = calculateSalesByCategory(products, orders);

    setAnalytics({
      dailyRevenue,
      topProducts,
      salesByCategory,
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalOrders: orders.length,
        totalUsers: users.length,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
      }
    });
  };

  const renderDashboardMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <TrendingUp className="h-8 w-8 text-green-500" />
          <div className="ml-4">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <h3 className="text-2xl font-bold">₹{analytics.metrics.totalRevenue.toLocaleString()}</h3>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <ShoppingCart className="h-8 w-8 text-blue-500" />
          <div className="ml-4">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <h3 className="text-2xl font-bold">{analytics.metrics.totalOrders}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <Users className="h-8 w-8 text-purple-500" />
          <div className="ml-4">
            <p className="text-gray-500 text-sm">Total Users</p>
            <h3 className="text-2xl font-bold">{analytics.metrics.totalUsers}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center">
          <Package className="h-8 w-8 text-orange-500" />
          <div className="ml-4">
            <p className="text-gray-500 text-sm">Avg. Order Value</p>
            <h3 className="text-2xl font-bold">₹{analytics.metrics.averageOrderValue.toFixed(2)}</h3>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.dailyRevenue}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#2563eb" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.salesByCategory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#4f46e5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  // Handle order status change
  const handleOrderStatusChange = async (orderId, status) => {
    try {
      const response = await fetch(`/api/orders?id=${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update order status");
      }

      alert("Order status updated successfully");
      fetchOrders(); // Refresh orders after update
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Failed to update order status: " + error.message);
    }
  };

  // New function to render orders management UI
  const renderOrdersManagement = () => (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-6">Order Management</h2>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order._id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                      <div className="text-sm text-gray-500">{order.customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "Delivered" 
                            ? "bg-green-100 text-green-800" 
                            : order.status === "Cancelled" 
                            ? "bg-red-100 text-red-800" 
                            : order.status === "In Transit" 
                            ? "bg-blue-100 text-blue-800" 
                            : order.status === "Out for Delivery" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select 
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={order.status}
                        onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Processing">Processing</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto py-6 px-4">
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
            <h1 className="text-2xl font-semibold mb-6">Admin Login</h1>
            <form onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gmail.com"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
              >
                Login
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
            
            <div className="mb-8">
              <nav className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "dashboard"
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "products"
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Products
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "orders"
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === "users"
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Users
                </button>
              </nav>
            </div>
            
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderDashboardMetrics()}
                {renderAnalyticsCharts()}
              </div>
            )}
            
            {activeTab === "products" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">{formTitle}</h2>
                    <form onSubmit={handleSubmitProduct} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                          <input
                            type="text"
                            value={productData.name}
                            onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                            placeholder="Enter product name"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={productData.description}
                            onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                            placeholder="Enter product description"
                            className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                          <input
                            type="number"
                            value={productData.price}
                            onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                            placeholder="0.00"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={productData.quantity}
                            onChange={(e) => setProductData({ ...productData, quantity: e.target.value })}
                            placeholder="Enter quantity"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                          <input
                            type="text"
                            value={productData.category}
                            onChange={(e) => setProductData({ ...productData, category: e.target.value })}
                            placeholder="Enter category"
                            className="w-full p-2 border border-gray-300 rounded-md"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e.target.files[0])}
                            className="hidden"
                            id="image-upload"
                          />
                          <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center justify-center">
                            {imagePreview ? (
                              <img
                                src={imagePreview || "/placeholder.svg"}
                                alt="Preview"
                                className="max-h-40 object-contain"
                              />
                            ) : (
                              <div className="text-center">
                                <Plus className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-1 text-sm text-gray-500">Upload image</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-green-500 text-white p-3 rounded-md hover:bg-green-600 focus:ring-2 focus:ring-green-300"
                      >
                        {submitButtonText}
                      </button>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false)
                            setEditingProduct(null)
                            setProductData({
                              name: "",
                              description: "",
                              price: "",
                              quantity: "",
                              category: "",
                              image: null,
                            })
                            setImagePreview(null)
                            setFormTitle("Add New Product")
                            setSubmitButtonText("Add Product")
                          }}
                          className="w-full bg-gray-300 text-gray-800 p-3 rounded-md hover:bg-gray-400 focus:ring-2 focus:ring-gray-300 mt-2"
                        >
                          Cancel Editing
                        </button>
                      )}
                    </form>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Product List</h2>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {products.map((product) => (
                            <tr key={product._id}>
                              <td className="px-6 py-4">
                                <img
                                  src={product.image || "/placeholder.svg"}
                                  alt={product.name}
                                  className="h-16 w-16 object-cover rounded"
                                />
                              </td>
                              <td className="px-6 py-4">{product.name}</td>
                              <td className="px-6 py-4">{product.category}</td>
                              <td className="px-6 py-4">₹{product.price}</td>
                              <td className="px-6 py-4">{product.quantity}</td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleEditProduct(product)}
                                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(product._id)}
                                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "orders" && renderOrdersManagement()}
            
            {activeTab === "users" && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">User Management</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4">#{user.id.substring(user.id.length - 6)}</td>
                          <td className="px-6 py-4">{user.name}</td>
                          <td className="px-6 py-4">{user.email}</td>
                          <td className="px-6 py-4">{new Date(user.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

