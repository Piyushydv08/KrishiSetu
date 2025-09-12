import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  role: text("role").notNull().default("farmer"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  profileImage: text("profile_image"),
  phone: text("phone"),
  company: text("company"),
  location: text("location"),
  bio: text("bio"),
  website: text("website"),
  roleSelected: boolean("role_selected").default(false),
  language: text("language").default("en"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  quantity: decimal("quantity").notNull(),
  unit: text("unit").notNull(),
  farmName: text("farm_name").notNull(),
  location: text("location").notNull(),
  harvestDate: timestamp("harvest_date").notNull(),
  certifications: text("certifications").array(),
  qrCode: text("qr_code").notNull(),
  batchId: text("batch_id").notNull().unique(),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  blockchainHash: text("blockchain_hash"),
  status: text("status").notNull().default("registered"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").references(() => users.id),
  transactionType: text("transaction_type").notNull(),
  location: text("location"),
  coordinates: jsonb("coordinates"),
  temperature: decimal("temperature"),
  humidity: decimal("humidity"),
  notes: text("notes"),
  blockchainHash: text("blockchain_hash"),
  verified: boolean("verified").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const qualityChecks = pgTable("quality_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  inspectorId: varchar("inspector_id").references(() => users.id).notNull(),
  checkType: text("check_type").notNull(),
  score: decimal("score").notNull(),
  notes: text("notes"),
  certificationUrl: text("certification_url"),
  verified: boolean("verified").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const scans = pgTable("scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  userId: varchar("user_id").references(() => users.id),
  location: text("location"),
  coordinates: jsonb("coordinates"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const ownershipTransfers = pgTable("ownership_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  fromUserId: varchar("from_user_id").references(() => users.id).notNull(),
  toUserId: varchar("to_user_id").references(() => users.id).notNull(),
  transferType: text("transfer_type").notNull(), // "transportation", "distribution", "retail", "sale"
  status: text("status").notNull().default("pending"), // "pending", "accepted", "completed"
  notes: text("notes"),
  expectedDelivery: timestamp("expected_delivery"),
  actualDelivery: timestamp("actual_delivery"),
  blockchainHash: text("blockchain_hash"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "alert", "price", "transfer", "system"
  read: boolean("read").default(false),
  productId: varchar("product_id").references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productOwners = pgTable("product_owners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  name: text("name").notNull(),
  ownerId: varchar("owner_id").notNull(), // user id
  addedBy: varchar("added_by").notNull(), // user id who added
  role: text("role").notNull(), // e.g. "farmer", "distributor", "retailer"
  canEditFields: text("can_edit_fields").array().notNull(), // e.g. ["quantity", "location"]
  username: text("username").notNull().unique(), // system-generated unique username
  createdAt: timestamp("created_at").defaultNow(),
});

export const productComments = pgTable("product_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  ownerId: varchar("owner_id").notNull(), // user id who commented
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  createdAt: z.coerce.date().optional(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  qrCode: true,
  batchId: true,
  blockchainHash: true,
  createdAt: true,
}).extend({
  qrCode: z.string().optional(),
  batchId: z.string().optional(),
  blockchainHash: z.string().optional(),
  harvestDate: z.coerce.date(),
  createdAt: z.coerce.date().optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  blockchainHash: true,
  verified: true,
  timestamp: true,
}).extend({
  timestamp: z.coerce.date().optional(),
});

export const insertQualityCheckSchema = createInsertSchema(qualityChecks).omit({
  id: true,
  verified: true,
  timestamp: true,
}).extend({
  timestamp: z.coerce.date().optional(),
});

export const insertScanSchema = createInsertSchema(scans).omit({
  id: true,
  timestamp: true,
}).extend({
  timestamp: z.coerce.date().optional(),
});

export const insertOwnershipTransferSchema = createInsertSchema(ownershipTransfers).omit({
  id: true,
  blockchainHash: true,
  timestamp: true,
}).extend({
  expectedDelivery: z.coerce.date().optional(),
  actualDelivery: z.coerce.date().optional(),
  timestamp: z.coerce.date().optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
}).extend({
  createdAt: z.coerce.date().optional(),
});

export const insertProductOwnerSchema = createInsertSchema(productOwners).omit({
  id: true,
  createdAt: true,
}).extend({
  createdAt: z.coerce.date().optional(),
});

export const insertProductCommentSchema = createInsertSchema(productComments).omit({
  id: true,
  createdAt: true,
}).extend({
  createdAt: z.coerce.date().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertQualityCheck = z.infer<typeof insertQualityCheckSchema>;
export type InsertScan = z.infer<typeof insertScanSchema>;
export type InsertOwnershipTransfer = z.infer<typeof insertOwnershipTransferSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertProductOwner = z.infer<typeof insertProductOwnerSchema>;
export type InsertProductComment = z.infer<typeof insertProductCommentSchema>;

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type QualityCheck = typeof qualityChecks.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type OwnershipTransfer = typeof ownershipTransfers.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ProductOwner = typeof productOwners.$inferSelect;
export type ProductComment = typeof productComments.$inferSelect;
