import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertTransactionSchema, insertQualityCheckSchema, insertScanSchema, insertProductOwnerSchema, insertProductCommentSchema } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import QRCode from "qrcode";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/user/profile", async (req, res) => {
    try {
      const firebaseUid = req.headers["x-firebase-uid"] as string;
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/register", async (req, res) => {
    try {
      const userData = req.body;
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      let products;
      
      if (userId) {
        products = await storage.getProductsByUser(userId);
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get("/api/products/batch/:batchId", async (req, res) => {
    try {
      const product = await storage.getProductByBatchId(req.params.batchId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    console.log("Request body:", req.body);
    try {
      const productData = insertProductSchema.parse(req.body);

      // Generate batchId if not present
      if (!productData.batchId) {
        productData.batchId = uuidv4();
      }

      // Generate blockchainHash (example: SHA256 of product data)
      if (!productData.blockchainHash) {
        productData.blockchainHash = crypto
          .createHash("sha256")
          .update(JSON.stringify(productData))
          .digest("hex");
      }

      // Generate QR code (as a data URL)
      if (!productData.qrCode) {
        const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/product/${productData.batchId}`;
        productData.qrCode = await QRCode.toDataURL(url);
      }

      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });


app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updated = await storage.updateProduct(id, updateData);

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Notify all owners
    const owners = await storage.getProductOwners(id);
    for (const owner of owners) {
      // Optionally skip notification for the user who made the change:
      if (owner.ownerId === updateData.updatedBy) continue;
      await storage.createNotification({
        userId: owner.ownerId,
        title: "Product Updated",
        message: `A product you own (${updated.name}) was updated.`,
        type: "product-update",
        productId: id,
        read: false,
      });
    }

    res.status(200).json({ message: "Product updated", product: updated });
  } catch (error) {
    res.status(500).json({ message: "Failed to update product" });
  }
});

  // Transaction routes
  app.get("/api/products/:id/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactionsByProduct(req.params.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Quality check routes
  app.get("/api/products/:id/quality-checks", async (req, res) => {
    try {
      const qualityChecks = await storage.getQualityChecksByProduct(req.params.id);
      res.json(qualityChecks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quality checks" });
    }
  });

  app.post("/api/quality-checks", async (req, res) => {
    try {
      const qualityCheckData = insertQualityCheckSchema.parse(req.body);
      const qualityCheck = await storage.createQualityCheck(qualityCheckData);
      res.status(201).json(qualityCheck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid quality check data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create quality check" });
    }
  });

  // Scan routes
  app.post("/api/scans", async (req, res) => {
    try {
      const scanData = insertScanSchema.parse(req.body);
      const scan = await storage.createScan(scanData);
      res.status(201).json(scan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid scan data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to record scan" });
    }
  });

  app.get("/api/scans/recent", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      const limit = parseInt(req.query.limit as string) || 10;
      const scans = await storage.getRecentScans(userId, limit);
      res.json(scans);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent scans" });
    }
  });

  // User profile routes
  app.patch("/api/user/:id", async (req, res) => {
    try {
      const userId = req.params.id;
      const updates = req.body;
      
      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Analytics routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/user/:id/stats", async (req, res) => {
    try {
      const userId = req.params.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Ownership transfer routes
  app.get("/api/ownership-transfers/product/:productId", async (req, res) => {
    try {
      const productId = req.params.productId;
      const transfers = await storage.getOwnershipTransfersByProduct(productId);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ownership transfers" });
    }
  });

  app.get("/api/ownership-transfers/user/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const type = req.query.type as "from" | "to" | undefined;
      const transfers = await storage.getOwnershipTransfersByUser(userId, type);
      res.json(transfers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user ownership transfers" });
    }
  });

  app.post("/api/ownership-transfers", async (req, res) => {
    try {
      const transferData = req.body;
      const transfer = await storage.createOwnershipTransfer(transferData);
      
      // Create notification for recipient
      await storage.createNotification({
        userId: transferData.toUserId,
        title: "Ownership Transfer Received",
        message: `You have received ownership transfer for a product`,
        type: "transfer",
        productId: transferData.productId,
        read: false
      });
      
      res.json(transfer);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ownership transfer" });
    }
  });

  app.patch("/api/ownership-transfers/:id", async (req, res) => {
    try {
      const transferId = req.params.id;
      const updates = req.body;
      const transfer = await storage.updateOwnershipTransfer(transferId, updates);
      
      if (!transfer) {
        return res.status(404).json({ message: "Transfer not found" });
      }
      
      res.json(transfer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ownership transfer" });
    }
  });

  // Notifications routes
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = req.params.id;
      await storage.markNotificationRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Product owners and comments routes
  // Add a product owner
app.post("/api/products/:id/owners", async (req, res) => {
  try {
    const productId = req.params.id;
    const ownerData = insertProductOwnerSchema.parse({ ...req.body, productId });
    // Generate unique username if not provided
    if (!ownerData.username) {
      // Example: "piyush" + first 3 of userId
      ownerData.username = (ownerData.name || "user") + ownerData.ownerId.slice(0, 3);
    }
    const owner = await storage.addProductOwner(ownerData);
    res.status(201).json(owner);
  } catch (error) {
    res.status(400).json({ message: "Failed to add owner", error });
  }
});

// Get all owners for a product
app.get("/api/products/:id/owners", async (req, res) => {
  try {
    const productId = req.params.id;
    const owners = await storage.getProductOwners(productId);
    res.json(owners);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch owners" });
  }
});

// Add a comment
app.post("/api/products/:id/comments", async (req, res) => {
  try {
    const productId = req.params.id;
    const commentData = insertProductCommentSchema.parse({ ...req.body, productId });
    const comment = await storage.addProductComment(commentData);
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: "Failed to add comment", error });
  }
});

// Get all comments for a product
app.get("/api/products/:id/comments", async (req, res) => {
  try {
    const productId = req.params.id;
    const comments = await storage.getProductComments(productId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

  const httpServer = createServer(app);
  return httpServer;
}
