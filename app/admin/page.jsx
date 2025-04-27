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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-gray-500 text-sm">Total Revenue</p>
            <h3 className="text-2xl font-bold">₹{analytics.metrics.totalRevenue.toLocaleString()}</h3>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>+4.5% from last week</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-gray-500 text-sm">Total Orders</p>
            <h3 className="text-2xl font-bold">{analytics.metrics.totalOrders}</h3>
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>+2.3% from last month</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <Users className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-gray-500 text-sm">Total Users</p>
            <h3 className="text-2xl font-bold">{analytics.metrics.totalUsers}</h3>
            <p className="text-xs text-purple-600 mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>+12% from last month</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-orange-100 text-orange-600">
            <Package className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <p className="text-gray-500 text-sm">Avg. Order Value</p>
            <h3 className="text-2xl font-bold">₹{analytics.metrics.averageOrderValue.toFixed(2)}</h3>
            <p className="text-xs text-orange-600 mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
              <span>+8.1% from last month</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Revenue Trend</h3>
          <div className="flex items-center space-x-2">
            <select className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.dailyRevenue}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ borderRadius: '8px' }} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#6366F1" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6, stroke: '#6366F1', strokeWidth: 2 }}
              fill="url(#colorRevenue)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Sales by Category</h3>
          <div className="flex items-center space-x-2">
            <select className="text-xs border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>All Time</option>
              <option>This Year</option>
              <option>This Month</option>
            </select>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.salesByCategory}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="category" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip contentStyle={{ borderRadius: '8px' }} />
            <Legend />
            <Bar 
              dataKey="sales" 
              fill="url(#colorSales)" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 md:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Top Selling Products</h3>
          <button className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Sold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.topProducts.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.quantity}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₹{product.revenue.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      ↑ 12%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Order Management</h2>
        <div className="flex space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <select className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">Filter by Status</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="In Transit">In Transit</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
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
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-indigo-600">#{order._id.substring(0, 8)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                          <div className="text-sm text-gray-500">{order.customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₹{parseFloat(order.totalAmount).toFixed(2)}</div>
                      <div className="text-xs text-gray-500">{order.products.length} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "Delivered" 
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <select 
                          className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                        <button 
                          className="p-1 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
                          title="View details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <p>No orders found</p>
                      <p className="text-xs text-gray-400 mt-1">Orders will appear here once customers make purchases</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing {orders.length} orders
            </p>
            <div className="flex items-center space-x-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-500 bg-white rounded-md border border-gray-300 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md border border-indigo-600 hover:bg-indigo-700">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto py-6 px-4">
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-xl border border-gray-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
              <p className="text-gray-500 mt-1">Enter your credentials to access the admin dashboard</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@gmail.com"
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 transition duration-200 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Login to Dashboard
              </button>
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500">Demo Credentials: admin@gmail.com / admin</p>
              </div>
            </form>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your products, orders, and users</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm9 1h-2v2h2V4zm0 4h-2v2h2V8zm-2 4h2v2h-2v-2z" clipRule="evenodd" />
                </svg>
                Logout
              </button>
            </div>
            
            <div className="mb-8">
              <nav className="flex border-b border-gray-200 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === "dashboard"
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:border-b-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                    </svg>
                    Dashboard
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("products")}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === "products"
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:border-b-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                    Products
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === "orders"
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:border-b-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                    </svg>
                    Orders
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                    activeTab === "users"
                      ? "border-b-2 border-indigo-500 text-indigo-600"
                      : "text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:border-b-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Users
                  </div>
                </button>
              </nav>
            </div>
            
            {activeTab === "dashboard" && (
              <div className="p-6 space-y-8">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Dashboard Overview</h2>
                  {renderDashboardMetrics()}
                </div>
                
                <div className="space-y-6">
                  {renderAnalyticsCharts()}
                </div>
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-800">User Management</h2>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                            #{user.id.substring(user.id.length - 6)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-medium">{user.name.charAt(0)}</span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.phone || "N/A"}</div>
                            <div className="text-sm text-gray-500">{user.address?.substring(0, 20) || "No address"}{user.address?.length > 20 ? "..." : ""}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</div>
                            <div className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleTimeString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-900 focus:outline-none">
                                View
                              </button>
                              <button className="text-gray-600 hover:text-gray-900 focus:outline-none">
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 mt-4 rounded-b-lg">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Showing {users.length} users
                    </p>
                    <div className="flex items-center space-x-2">
                      <button className="px-4 py-2 text-sm font-medium text-gray-500 bg-white rounded-md border border-gray-300 hover:bg-gray-50">
                        Previous
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md border border-indigo-600 hover:bg-indigo-700">
                        Next
                      </button>
                    </div>
                  </div>
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

