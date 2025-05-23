import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // Import ObjectId for handling MongoDB IDs

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db("User");
    
    // Get the email from query parameters
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    
    let query = {};
    
    // If email is provided, filter orders by customer email
    if (email) {
      query = { "customer.email": email };
    }

    // Fetch orders with the applied filter and sort by createdAt in descending order (newest first)
    const orders = await db.collection("orders").find(query).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { message: "Failed to fetch orders", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db("User");

    const { customer, products, totalAmount, paymentMethod } = await req.json();

    if (!customer || !products || !totalAmount || !paymentMethod) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Insert order into the `orders` collection
    const order = await db.collection("orders").insertOne({
      customer,
      products,
      totalAmount,
      paymentMethod,
      status: "Pending",
      statusHistory: [{ status: "Pending", timestamp: new Date() }],
      createdAt: new Date(),
    });

    // Update product stock using MongoDB's `$inc`
    await Promise.all(
      products.map(async (item) => {
        await db.collection("products").updateOne(
          { _id: new ObjectId(item.productId) },
          { $inc: { quantity: -item.quantity } }
        );
      })
    );

    return NextResponse.json(
      { message: "Order created successfully", orderId: order.insertedId },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { message: "Failed to create order", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const client = await clientPromise;
    const db = client.db("User");

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    
    if (!orderId) {
      return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
    }

    const { status } = await req.json();
    
    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    // Validate status
    const validStatuses = ["Pending", "Processing", "In Transit", "Out for Delivery", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    // Update the order status
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { status },
        $push: { statusHistory: { status, timestamp: new Date() }}
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order status updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { message: "Failed to update order status", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    const client = await clientPromise;
    const db = client.db("User");

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");

    if (!orderId) {
      return NextResponse.json({ message: "Order ID is required" }, { status: 400 });
    }

    // Update the order status to "Cancelled"
    const result = await db.collection("orders").updateOne(
      { _id: new ObjectId(orderId) },
      { 
        $set: { status: "Cancelled" },
        $push: { statusHistory: { status: "Cancelled", timestamp: new Date() }}
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ message: "Order not found or already cancelled" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order cancelled successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return NextResponse.json({ message: "Failed to cancel order", error: error.message }, { status: 500 });
  }
}
