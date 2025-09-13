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
    const user = await storage.createUser(parse.data); // FIXED
    return reply.status(201).send(user);
  });

  app.get("/api/users/:id", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return reply.status(404).send({ message: "User not found" });
    return user;
  });

  // --- Product Routes ---
  app.post("/api/products", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertProductSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid product data", errors: parse.error.format() });
    }
    const product = await storage.createProduct(parse.data); // FIXED
    return reply.status(201).send(product);
  });

  app.get("/api/products/:id", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const product = await storage.getProduct(req.params.id); // FIXED
    if (!product) return reply.status(404).send({ message: "Product not found" });
    return product;
  });

  // --- Transaction Routes ---
  app.post("/api/transactions", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertTransactionSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid transaction data", errors: parse.error.format() });
    }
    const transaction = await storage.createTransaction(parse.data); // FIXED
    return reply.status(201).send(transaction);
  });

  // --- Quality Check Routes ---
  app.post("/api/quality-checks", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertQualityCheckSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid quality check data", errors: parse.error.format() });
    }
    const check = await storage.createQualityCheck(parse.data); // FIXED
    return reply.status(201).send(check);
  });

  // --- Scan Routes ---
  app.post("/api/scans", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertScanSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid scan data", errors: parse.error.format() });
    }
    const scan = await storage.createScan(parse.data); // FIXED
    return reply.status(201).send(scan);
  });

  // --- Ownership Transfer Routes ---
  app.post("/api/ownership-transfers", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertOwnershipTransferSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid ownership transfer data", errors: parse.error.format() });
    }
    const transfer = await storage.createOwnershipTransfer(parse.data); // FIXED
    return reply.status(201).send(transfer);
  });

  // --- Notification Routes ---
  app.post("/api/notifications", async (req: FastifyRequest, reply: FastifyReply) => {
    const parse = insertNotificationSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ message: "Invalid notification data", errors: parse.error.format() });
    }
    const notification = await storage.createNotification(parse.data); // FIXED
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

  // GET route for product owners
  app.get("/api/products/:id/owners", async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const owners = await storage.getProductOwners(req.params.id);
    return reply.send(owners);
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
