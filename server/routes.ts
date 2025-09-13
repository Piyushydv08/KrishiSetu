import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { MongoStorage } from "./storage";
import {
  insertUserSchema, insertProductSchema, insertTransactionSchema,
  insertQualityCheckSchema, insertScanSchema, insertOwnershipTransferSchema,
  insertNotificationSchema, insertProductOwnerSchema, insertProductCommentSchema
} from "@shared/schema";

// Initialize MongoDB storage
const storage = new MongoStorage();

export async function registerRoutes(app: FastifyInstance) {
  // --- User Routes ---
  app.post("/api/users", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertUserSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid user data", errors: parse.error.format() });
    }
    const user = await storage.createUser(parse.data);
    return reply.status(201).send(user);
  });

  app.get("/api/users/:id", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return reply.status(404).send({ message: "User not found" });
    return user;
  });

  // --- Product Routes ---
  app.post("/api/products", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const parse = insertProductSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.status(400).send({ message: "Invalid product data", errors: parse.error.format() });
      }
      
      // Get current user from auth header or session
      const firebaseUid = req.headers['firebase-uid'] as string;
      if (!firebaseUid) {
        return reply.status(401).send({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }
      
      // Create the product
      const productData = {
        ...parse.data,
        ownerId: user.id // Ensure ownerId is set to current user
      };
      const product = await storage.createProduct(productData);
      
      // Add the initial owner record (Genesis block)
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
      
      return reply.status(201).send(product);
    } catch (error) {
      console.error("Error creating product:", error);
      return reply.status(500).send({ message: "Failed to create product" });
    }
  });

  app.get("/api/products/:id", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) return reply.status(404).send({ message: "Product not found" });
    return product;
  });

  // --- Transaction Routes ---
  app.post("/api/transactions", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertTransactionSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid transaction data", errors: parse.error.format() });
    }
    const transaction = await storage.createTransaction(parse.data);
    return reply.status(201).send(transaction);
  });

  // --- Quality Check Routes ---
  app.post("/api/quality-checks", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertQualityCheckSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid quality check data", errors: parse.error.format() });
    }
    const check = await storage.createQualityCheck(parse.data);
    return reply.status(201).send(check);
  });

  // --- Scan Routes ---
  app.post("/api/scans", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertScanSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid scan data", errors: parse.error.format() });
    }
    const scan = await storage.createScan(parse.data);
    return reply.status(201).send(scan);
  });

  // --- Ownership Transfer Routes ---
  app.post("/api/ownership-transfers", async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const parse = insertOwnershipTransferSchema.safeParse(req.body);
      if (!parse.success) {
        return reply.status(400).send({ message: "Invalid ownership transfer data", errors: parse.error.format() });
      }
      
      // Get current user from auth header or session
      const firebaseUid = req.headers['firebase-uid'] as string;
      if (!firebaseUid) {
        return reply.status(401).send({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return reply.status(404).send({ message: "User not found" });
      }
      
      // Check if user is the current owner
      const product = await storage.getProduct(parse.data.productId);
      if (!product) {
        return reply.status(404).send({ message: "Product not found" });
      }
      
      if (product.ownerId !== user.id) {
        return reply.status(403).send({ message: "You are not the current owner of this product" });
      }
      
      // Get new owner
      const newOwner = await storage.getUser(parse.data.toUserId);
      if (!newOwner) {
        return reply.status(404).send({ message: "New owner not found" });
      }
      
      // Create transfer record
      const transfer = await storage.createOwnershipTransfer(parse.data);
      
      // Update product with new owner
      await storage.updateProduct(product.id, { ownerId: newOwner.id });
      
      // Add new owner to blockchain (product_owners)
      await storage.addProductOwner({
        productId: product.id,
        ownerId: newOwner.id,
        username: newOwner.username,
        name: newOwner.name,
        addedBy: user.id,
        role: newOwner.role,
        canEditFields: ["quantity", "location"],
        transferType: "transfer",
        createdAt: new Date()
      });
      
      // Create notification for new owner
      await storage.createNotification({
        userId: newOwner.id,
        title: "New Product Ownership",
        message: `${user.name} has transferred ownership of ${product.name} to you.`,
        type: "ownership_transfer",
        productId: product.id,
        read: false,
        createdAt: new Date()
      });
      
      return reply.status(201).send(transfer);
    } catch (error) {
      console.error("Error transferring ownership:", error);
      return reply.status(500).send({ message: "Failed to transfer ownership" });
    }
  });

  // --- Notification Routes ---
  app.post("/api/notifications", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertNotificationSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid notification data", errors: parse.error.format() });
    }
    const notification = await storage.createNotification(parse.data);
    return reply.status(201).send(notification);
  });

  // --- Product Owner Routes ---
  app.post("/api/product-owners", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertProductOwnerSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid product owner data", errors: parse.error.format() });
    }
    const productOwner = await storage.addProductOwner(parse.data);
    return reply.status(201).send(productOwner);
  });

  // GET route for product owners (blockchain chain)
  app.get("/api/products/:id/owners", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const productId = req.params.id;
      const owners = await storage.getProductOwners(productId);
      return reply.send(owners);
    } catch (error) {
      console.error("Error fetching product owners:", error);
      return reply.status(500).send({ message: "Failed to fetch product owners" });
    }
  });

  // GET route for ownership chain (blockchain-style)
  app.get("/api/products/:id/ownership-chain", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const productId = req.params.id;
      const chain = await storage.getOwnershipChain(productId);
      return reply.send(chain);
    } catch (error) {
      console.error("Error fetching ownership chain:", error);
      return reply.status(500).send({ message: "Failed to fetch ownership chain" });
    }
  });

  // --- Product Comment Routes ---
  app.post("/api/product-comments", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertProductCommentSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid product comment data", errors: parse.error.format() });
    }
    const comment = await storage.addProductComment(parse.data);
    return reply.status(201).send(comment);
  });

  // GET route for product comments
  app.get("/api/products/:id/comments", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const comments = await storage.getProductComments(req.params.id);
    return reply.send(comments);
  });

  return app;
}
