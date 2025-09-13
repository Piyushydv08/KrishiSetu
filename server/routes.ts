import { Express, Request, Response } from "express";
import { createServer } from "http";
import { MongoStorage } from "./storage";
import { z } from "zod";
import {
  insertUserSchema, insertProductSchema, insertTransactionSchema,
  insertQualityCheckSchema, insertScanSchema, insertOwnershipTransferSchema,
  insertNotificationSchema, insertProductOwnerSchema, insertProductCommentSchema
} from "@shared/schema";

// Initialize MongoDB storage
const storage = new MongoStorage();

export async function registerRoutes(app: Express) {
  // --- Authentication Routes ---
  app.post("/api/user/register", async (req: Request, res: Response) => {
    try {
      const { email, name, firebaseUid, profileImage, roleSelected } = req.body;
      
      // Validate required fields
      if (!email || !name || !firebaseUid) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (existingUser) {
        return res.json(existingUser); // Return existing user if already registered
      }
      
      // Create new user with username derived from email
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      const user = await storage.createUser({
        email,
        name,
        username,
        role: "farmer", // default role
        firebaseUid,
        profileImage,
        roleSelected: roleSelected || false,
        language: "en",
        notificationsEnabled: true
      });
      
      return res.status(201).json(user);
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // Get user profile
  app.get("/api/user/profile", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates = req.body;
      // Ensure certain fields cannot be changed
      delete updates.firebaseUid;
      delete updates.id;
      
      const updatedUser = await storage.updateUser(user.id, updates);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // --- User Routes ---
  app.post("/api/users", async (req: Request, res: Response) => {
    const parse = insertUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid user data", errors: parse.error.format() });
    }
    const user = await storage.createUser(parse.data);
    return res.status(201).json(user);
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  });


  app.get("/api/users/search", async (req, res) => {
    try {
      const q = (req.query.q as string || "").trim();
      if (!q) return res.json([]);
      
      const users = await storage.searchUsers(q, 10);
      return res.json(users || []); 
    } catch (error) {
      console.error("User search error:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // --- Product Routes ---
  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const parse = insertProductSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ message: "Invalid product data", errors: parse.error.format() });
      }
      
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const productData = {
        ...parse.data,
        ownerId: user.id
      };
      const product = await storage.createProduct(productData);
      
      await storage.addProductOwner({
        productId: product.id,
        ownerId: user.id,
        username: user.username,
        name: user.name,
        addedBy: user.id,
        role: user.role,
        canEditFields: ["quantity", "location", "description", "certifications"],
        transferType: "initial",
        createdAt: new Date()
      });
      
      return res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      return res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
  });

  // List all products - used by dashboard
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const ownerId = req.query.ownerId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      let products;
      if (ownerId) {
        products = await storage.getProductsByOwner(ownerId);
      } else {
        products = await storage.getAllProducts(limit);
      }
      
      return res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get user's owned products
  app.get("/api/user/products/owned", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const query = req.query.q as string | undefined;
      let products;
      if (query && query.trim()) {
        products = await storage.searchProductsByOwner(user.id, query);
      } else {
        products = await storage.getProductsByOwner(user.id);
      }
      return res.json(products);
    } catch (error) {
      console.error("Error fetching owned products:", error);
      return res.status(500).json({ message: "Failed to fetch owned products" });
    }
  });

  // Get user's scanned products
  app.get("/api/user/products/scanned", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get all scans for this user
      const scans = await storage.getUserScans(user.id);
      
      // Use ES5 object for unique product IDs to avoid Set/ES2015 error
      const productIdMap: Record<string, boolean> = {};
      for (const scan of scans) {
        if (scan.productId) productIdMap[scan.productId] = true;
      }
      const productIds = Object.keys(productIdMap);
      
      // Fetch product details for each scanned product
      const products = [];
      for (const productId of productIds) {
        const product = await storage.getProduct(productId);
        if (product) {
          products.push(product);
        }
      }
      
      return res.json(products);
    } catch (error) {
      console.error("Error fetching scanned products:", error);
      return res.status(500).json({ message: "Failed to fetch scanned products" });
    }
  });

  app.get("/api/products/batch/:batchId", async (req: Request, res: Response) => {
    try {
      const { batchId } = req.params;
      const product = await storage.getProductByBatchId(batchId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.json(product);
    } catch (error) {
      console.error("Error fetching product by batchId:", error);
      return res.status(500).json({ message: "Failed to fetch product by batchId" });
    }
  });

  // --- Transaction Routes ---
  app.post("/api/transactions", async (req: Request, res: Response) => {
    const parse = insertTransactionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid transaction data", errors: parse.error.format() });
    }
    const transaction = await storage.createTransaction(parse.data);
    return res.status(201).json(transaction);
  });

  // --- Quality Check Routes ---
  app.post("/api/quality-checks", async (req: Request, res: Response) => {
    const parse = insertQualityCheckSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid quality check data", errors: parse.error.format() });
    }
    const check = await storage.createQualityCheck(parse.data);
    return res.status(201).json(check);
  });

  // --- Scan Routes ---
  app.post("/api/scans", async (req: Request, res: Response) => {
    const parse = insertScanSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid scan data", errors: parse.error.format() });
    }
    const scan = await storage.createScan(parse.data);
    return res.status(201).json(scan);
  });

  // Recent scans endpoint
  app.get("/api/scans/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const recentScans = await storage.getRecentScans(limit);
      return res.json(recentScans);
    } catch (error) {
      console.error("Error fetching recent scans:", error);
      return res.status(500).json({ message: "Failed to fetch recent scans" });
    }
  });

  // --- Ownership Transfer Routes ---
  app.post("/api/ownership-transfers", async (req: Request, res: Response) => {
    try {
      const parse = insertOwnershipTransferSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ message: "Invalid ownership transfer data", errors: parse.error.format() });
      }
      
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const product = await storage.getProduct(parse.data.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      if (product.ownerId !== user.id) {
        return res.status(403).json({ message: "You are not the current owner of this product" });
      }
      
      const newOwner = await storage.getUser(parse.data.toUserId);
      if (!newOwner) {
        return res.status(404).json({ message: "New owner not found" });
      }
      
      // Create a pending transfer
      const transfer = await storage.createOwnershipTransfer({
        ...parse.data,
        status: "pending" // Set to pending until accepted
      });
      
      // Create notification for the new owner (without transferId)
      await storage.createNotification({
        userId: newOwner.id,
        title: "Ownership Transfer Request",
        message: `${user.name} wants to transfer ownership of ${product.name} to you.`,
        type: "ownership_transfer",
        productId: product.id,
        transferId: transfer.id,
        read: false,
        createdAt: new Date()
      });
      
      return res.status(201).json({
        message: "Transfer request sent. Waiting for acceptance.",
        transferId: transfer.id
      });
    } catch (error) {
      console.error("Error transferring ownership:", error);
      return res.status(500).json({ message: "Failed to transfer ownership" });
    }
  });

  // Add endpoint to accept ownership transfer
  app.put("/api/ownership-transfers/:id/accept", async (req: Request, res: Response) => {
    try {
      const transferId = req.params.id;
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the transfer
      const transfer = await storage.getOwnershipTransfer(transferId);
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      if (transfer.toUserId !== user.id) {
        return res.status(403).json({ message: "You are not the recipient of this transfer" });
      }
      
      if (transfer.status !== "pending") {
        return res.status(400).json({ message: "Transfer is not pending" });
      }
      
      const product = await storage.getProduct(transfer.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Verify ownership chain
      const verificationResult = await storage.verifyOwnershipChain(product.id);
      if (!verificationResult.valid) {
        return res.status(400).json({ 
          message: "Cannot transfer ownership: Blockchain integrity compromised", 
          errors: verificationResult.errors 
        });
      }
      
      // Update transfer status
      await storage.updateOwnershipTransfer(transferId, { status: "completed" });
      
      // Update product owner
      await storage.updateProduct(product.id, { ownerId: user.id });
      
      // Add to product owners blockchain
      const newOwnerBlock = await storage.addProductOwner({
        productId: product.id,
        ownerId: user.id,
        username: user.username,
        name: user.name,
        addedBy: transfer.fromUserId,
        role: user.role,
        canEditFields: ["quantity", "location"],
        transferType: transfer.transferType,
        createdAt: new Date()
      });
      
      // Create notification for the previous owner
      await storage.createNotification({
        userId: transfer.fromUserId,
        title: "Ownership Transfer Completed",
        message: `${user.name} has accepted ownership of ${product.name}.`,
        type: "ownership_transfer_complete",
        productId: product.id,
        read: false,
        createdAt: new Date()
      });
      
      return res.json({
        message: "Ownership transfer completed successfully",
        ownershipBlock: {
          blockNumber: newOwnerBlock.blockNumber,
          ownershipHash: newOwnerBlock.ownershipHash,
          previousOwnerHash: newOwnerBlock.previousOwnerHash
        }
      });
    } catch (error) {
      console.error("Error accepting ownership transfer:", error);
      return res.status(500).json({ message: "Failed to accept ownership transfer" });
    }
  });

  // Add endpoint to reject ownership transfer
  app.put("/api/ownership-transfers/:id/reject", async (req: Request, res: Response) => {
    try {
      const transferId = req.params.id;
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the transfer
      const transfer = await storage.getOwnershipTransfer(transferId);
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      if (transfer.toUserId !== user.id) {
        return res.status(403).json({ message: "You are not the recipient of this transfer" });
      }
      
      if (transfer.status !== "pending") {
        return res.status(400).json({ message: "Transfer is not pending" });
      }
      
      // Update transfer status to rejected
      await storage.updateOwnershipTransfer(transferId, { status: "rejected" });
      
      // Create notification for the previous owner
      const product = await storage.getProduct(transfer.productId);
      if (product) {
        await storage.createNotification({
          userId: transfer.fromUserId,
          title: "Ownership Transfer Rejected",
          message: `${user.name} has rejected the ownership transfer of ${product.name}.`,
          type: "ownership_transfer_rejected",
          productId: product.id,
          read: false,
          createdAt: new Date()
        });
      }
      
      return res.json({ message: "Ownership transfer rejected successfully" });
    } catch (error) {
      console.error("Error rejecting ownership transfer:", error);
      return res.status(500).json({ message: "Failed to reject ownership transfer" });
    }
  });

  // Get pending transfer requests for user
  app.get("/api/ownership-transfers/pending", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const pendingTransfers = await storage.getPendingTransfersForUser(user.id);
      return res.json(pendingTransfers);
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      return res.status(500).json({ message: "Failed to fetch pending transfers" });
    }
  });

  // --- Notification Routes ---
  app.post("/api/notifications", async (req: Request, res: Response) => {
    const parse = insertNotificationSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid notification data", errors: parse.error.format() });
    }
    const notification = await storage.createNotification(parse.data);
    return res.status(201).json(notification);
  });

  // Get user notifications
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const notifications = await storage.getUserNotifications(user.id);
      return res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.put("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const notificationId = req.params.id;
      await storage.markNotificationRead(notificationId);
      return res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // --- Product Owner Routes ---
  app.post("/api/product-owners", async (req: Request, res: Response) => {
    const parse = insertProductOwnerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid product owner data", errors: parse.error.format() });
    }
    const productOwner = await storage.addProductOwner(parse.data);
    return res.status(201).json(productOwner);
  });

  app.get("/api/products/:id/owners", async (req: Request, res: Response) => {
    try {
      const owners = await storage.getProductOwners(req.params.id);
      return res.json(owners);
    } catch (error) {
      console.error("Error fetching product owners:", error);
      return res.status(500).json({ message: "Failed to fetch product owners" });
    }
  });

  app.get("/api/products/:id/ownership-chain", async (req: Request, res: Response) => {
    try {
      const chain = await storage.getOwnershipChain(req.params.id);
      return res.json(chain);
    } catch (error) {
      console.error("Error fetching ownership chain:", error);
      return res.status(500).json({ message: "Failed to fetch ownership chain" });
    }
  });

  app.get("/api/products/:id/verify-ownership", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const verificationResult = await storage.verifyOwnershipChain(productId);
      return res.json({
        productId,
        productName: product.name,
        ownershipValid: verificationResult.valid,
        errors: verificationResult.errors || [],
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error verifying ownership chain:", error);
      return res.status(500).json({ message: "Failed to verify ownership chain" });
    }
  });

  app.get("/api/users/:id/ownership-history", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const history = await storage.getOwnershipHistory(userId);
      return res.json({
        userId,
        userName: user.name,
        ownershipHistory: history,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error fetching user's ownership history:", error);
      return res.status(500).json({ message: "Failed to fetch ownership history" });
    }
  });

  app.get("/api/products/:productId/has-owner/:userId", async (req: Request, res: Response) => {
    try {
      const { productId, userId } = req.params;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const hasOwned = await storage.hasUserOwnedProduct(productId, userId);
      return res.json({
        productId,
        productName: product.name,
        userId,
        userName: user.name,
        hasOwned,
        isCurrentOwner: product.ownerId === userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error checking product ownership:", error);
      return res.status(500).json({ message: "Failed to check product ownership" });
    }
  });

  // --- Product Comment Routes ---
  app.post("/api/product-comments", async (req: Request, res: Response) => {
    const parse = insertProductCommentSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid product comment data", errors: parse.error.format() });
    }
    const comment = await storage.addProductComment(parse.data);
    return res.status(201).json(comment);
  });

  app.get("/api/products/:id/comments", async (req: Request, res: Response) => {
    const comments = await storage.getProductComments(req.params.id);
    return res.json(comments);
  });

  app.get("/api/products/:id/journey", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const journeyLocations = await storage.getProductJourney(productId);
      return res.json(journeyLocations);
    } catch (error) {
      console.error("Error getting product journey:", error);
      if (error instanceof Error && error.message === "Product not found") {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.status(500).json({ message: "Failed to get product journey" });
    }
  });

  // --- Role Selection ---
  app.put("/api/user/role", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(user.id, { 
        role, 
        roleSelected: true 
      });
      
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      return res.status(500).json({ message: "Failed to update role" });
    }
  });

  // --- QR Code Routes ---
  app.get("/api/products/:id/qrcode", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Return QR code data or generate it if not present
      const qrCodeData = product.qrCode || `${req.protocol}://${req.get('host')}/product/${productId}`;
      
      if (!product.qrCode) {
        // Save the QR code URL to the product if it wasn't already set
        await storage.updateProduct(productId, { qrCode: qrCodeData });
      }
      
      return res.json({ qrCodeData });
    } catch (error) {
      console.error("Error getting product QR code:", error);
      return res.status(500).json({ message: "Failed to get QR code" });
    }
  });

  // --- Stats endpoint for dashboard ---
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const productsCount = await storage.countProducts();
      const usersCount = await storage.countUsers();
      const scansCount = await storage.countScans();
      const transfersCount = await storage.countTransfers();
      
      return res.json({
        products: productsCount,
        users: usersCount,
        scans: scansCount,
        transfers: transfersCount,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // --- Search endpoint ---
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      // Implement search across products
      const results = await storage.searchProducts(query);
      return res.json(results);
    } catch (error) {
      console.error("Error searching:", error);
      return res.status(500).json({ message: "Failed to perform search" });
    }
  });

  const server = createServer(app);
  return server;
}
