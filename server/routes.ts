import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertTransactionSchema, insertQualityCheckSchema, insertScanSchema } from "@shared/schema";
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
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid product data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
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

  // Analytics routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
