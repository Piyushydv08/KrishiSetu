import { 
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type Transaction, type InsertTransaction,
  type QualityCheck, type InsertQualityCheck,
  type Scan, type InsertScan,
  type OwnershipTransfer, type InsertOwnershipTransfer,
  type Notification, type InsertNotification,
  ProductOwner, InsertProductOwner, ProductComment, InsertProductComment
} from "@shared/schema";
import 'dotenv/config';
// Use uuid for compatibility
import { randomUUID } from "crypto";
import { MongoClient } from "mongodb";
console.log("DEBUG MONGO_URI:", process.env.MONGO_URI);
console.log("DEBUG MONGO_DB_NAME:", process.env.MONGO_DB_NAME);
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB_NAME || "farmtrace";
const client = new MongoClient(uri);

let didLogMongoConnection = false;

async function getDb() {
  await client.connect();
  if (!didLogMongoConnection) {
    console.log(`[MongoDB] Connected to: ${uri} (database: ${dbName})`);
    didLogMongoConnection = true;
  }
  return client.db(dbName);
}

export class MongoStorage {
  // ----------------- User operations -----------------
  async getUser(id: string): Promise<User | undefined> {
    const db = await getDb();
    const user = await db.collection<User>("users").findOne({ id });
    return user ?? undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await getDb();
    const user = await db.collection<User>("users").findOne({ email });
    return user ?? undefined;
  }

  async getUserByUsername(username: string) {
    const db = await getDb();
    return db.collection("users").findOne({ username });
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const db = await getDb();
    const user = await db.collection<User>("users").findOne({ firebaseUid });
    return user ?? undefined;
  }

  async getUserByEmailOrFirebaseUid(email: string, firebaseUid: string) {
    const db = await getDb();
    return db.collection("users").findOne({
      $or: [{ email }, { firebaseUid }]
    });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await getDb();
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      username: insertUser.username,
      role: insertUser.role || "farmer",
      profileImage: insertUser.profileImage || null,
      phone: insertUser.phone || null,
      company: insertUser.company || null,
      location: insertUser.location || null,
      bio: insertUser.bio || null,
      website: insertUser.website || null,
      roleSelected: insertUser.roleSelected || false,
      language: insertUser.language || "en",
      notificationsEnabled: insertUser.notificationsEnabled !== false,
      createdAt: new Date()
    };
    await db.collection<User>("users").insertOne(user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const db = await getDb();
    const result = await db.collection<User>("users").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    // result can be null, so check result and result.value
    return result ?? undefined;
  }

  // ----------------- Product operations -----------------
  async getProduct(id: string): Promise<Product | undefined> {
    const db = await getDb();
    const product = await db.collection<Product>("products").findOne({ id });
    return product ?? undefined;
  }

  async getProductByBatchId(batchId: string): Promise<Product | undefined> {
    const db = await getDb();
    const product = await db.collection<Product>("products").findOne({ batchId });
    return product ?? undefined;
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    const db = await getDb();
    return await db.collection<Product>("products").find({ ownerId: userId }).toArray();
  }

  async getAllProducts(): Promise<Product[]> {
    const db = await getDb();
    return await db.collection<Product>("products").find({}).toArray();
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const db = await getDb();
    const product: Product = {
      ...insertProduct,
      quantity: String(insertProduct.quantity),
      id: randomUUID(),
      batchId: (insertProduct as any).batchId || null,
      qrCode: (insertProduct as any).qrCode || null,
      blockchainHash: (insertProduct as any).blockchainHash || null,
      description: insertProduct.description || null,
      certifications: insertProduct.certifications || null,
      status: insertProduct.status || "registered",
      ownerId: insertProduct.ownerId, // Ensure ownerId is properly set
      createdAt: new Date()
    };
    await db.collection<Product>("products").insertOne(product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const db = await getDb();
    const result = await db.collection<Product>("products").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    return result ?? undefined;
  }

  // ----------------- Transaction operations -----------------
  async getTransaction(id: string): Promise<Transaction | undefined> {
    const db = await getDb();
    const transaction = await db.collection<Transaction>("transactions").findOne({ id });
    return transaction ?? undefined;
  }

  async getTransactionsByProduct(productId: string): Promise<Transaction[]> {
    const db = await getDb();
    return await db.collection<Transaction>("transactions")
      .find({ productId })
      .sort({ timestamp: -1 })
      .toArray();
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const db = await getDb();
    const transaction: Transaction = {
      ...insertTransaction,
      id: randomUUID(),
      location: insertTransaction.location || null,
      fromUserId: insertTransaction.fromUserId || null,
      toUserId: insertTransaction.toUserId || null,
      coordinates: insertTransaction.coordinates || null,
      temperature: insertTransaction.temperature || null,
      humidity: insertTransaction.humidity || null,
      notes: insertTransaction.notes || null,
      blockchainHash: (insertTransaction as any).blockchainHash || null,
      verified: true,
      timestamp: new Date()
    };
    await db.collection<Transaction>("transactions").insertOne(transaction);
    return transaction;
  }

  // ----------------- QualityCheck operations -----------------
  async getQualityChecksByProduct(productId: string): Promise<QualityCheck[]> {
    const db = await getDb();
    return await db.collection<QualityCheck>("qualitychecks").find({ productId }).toArray();
  }

  async createQualityCheck(insertQualityCheck: InsertQualityCheck): Promise<QualityCheck> {
    const db = await getDb();
    const qualityCheck: QualityCheck = {
      ...insertQualityCheck,
      id: randomUUID(),
      notes: insertQualityCheck.notes || null,
      certificationUrl: insertQualityCheck.certificationUrl || null,
      verified: true,
      timestamp: new Date()
    };
    await db.collection<QualityCheck>("qualitychecks").insertOne(qualityCheck);
    return qualityCheck;
  }

  // ----------------- Scan operations -----------------
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const db = await getDb();
    const scan: Scan = {
      ...insertScan,
      id: randomUUID(),
      location: insertScan.location || null,
      userId: insertScan.userId || null,
      coordinates: insertScan.coordinates || null,
      timestamp: new Date()
    };
    await db.collection<Scan>("scans").insertOne(scan);
    return scan;
  }

  async getRecentScans(userId?: string, limit: number = 10): Promise<(Scan & { product: Product })[]> {
    const db = await getDb();
    const query = userId ? { userId } : {};
    const scans = await db.collection<Scan>("scans").find(query).sort({ timestamp: -1 }).limit(limit).toArray();
    const productIds = scans.map(s => s.productId);
    const products = await db.collection<Product>("products").find({ id: { $in: productIds } }).toArray();
    const productMap = new Map(products.map(p => [p.id, p]));
    return scans
      .map(scan => ({
        ...scan,
        product: productMap.get(scan.productId)!
      }))
      .filter(scan => scan.product);
  }

  // ----------------- OwnershipTransfer operations -----------------
  async getOwnershipTransfer(id: string): Promise<OwnershipTransfer | undefined> {
    const db = await getDb();
    return await db.collection<OwnershipTransfer>("ownershiptransfers").findOne({ id }) ?? undefined;
  }

  async getOwnershipTransfersByProduct(productId: string): Promise<OwnershipTransfer[]> {
    const db = await getDb();
    return await db.collection<OwnershipTransfer>("ownershiptransfers").find({ productId }).toArray();
  }

  async getOwnershipTransfersByUser(userId: string, type?: "from" | "to"): Promise<OwnershipTransfer[]> {
    const db = await getDb();
    const query = type === "from" ? { fromUserId: userId }
                : type === "to" ? { toUserId: userId }
                : { $or: [{ fromUserId: userId }, { toUserId: userId }] };
    return await db.collection<OwnershipTransfer>("ownershiptransfers").find(query).toArray();
  }

  async createOwnershipTransfer(insertTransfer: InsertOwnershipTransfer): Promise<OwnershipTransfer> {
    const db = await getDb();
    const transfer: OwnershipTransfer = {
      ...insertTransfer,
      id: randomUUID(),
      status: insertTransfer.status || "pending",
      notes: insertTransfer.notes || null,
      expectedDelivery: insertTransfer.expectedDelivery || null,
      actualDelivery: insertTransfer.actualDelivery || null,
      blockchainHash: this.generateBlockchainHash(),
      timestamp: new Date()
    };
    await db.collection<OwnershipTransfer>("ownershiptransfers").insertOne(transfer);
    return transfer;
  }

  async updateOwnershipTransfer(id: string, updates: Partial<OwnershipTransfer>): Promise<OwnershipTransfer | undefined> {
    const db = await getDb();
    await db.collection<OwnershipTransfer>("ownershiptransfers").updateOne({ id }, { $set: updates });
    return await db.collection<OwnershipTransfer>("ownershiptransfers").findOne({ id }) ?? undefined;
  }

  // ----------------- Notification operations -----------------
  async getNotifications(userId: string): Promise<Notification[]> {
    const db = await getDb();
    return await db.collection<Notification>("notifications").find({ userId }).sort({ createdAt: -1 }).toArray();
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const db = await getDb();
    const notification: Notification = {
      ...insertNotification,
      id: randomUUID(),
      read: insertNotification.read || false,
      productId: insertNotification.productId || null,
      createdAt: new Date()
    };
    await db.collection<Notification>("notifications").insertOne(notification);
    return notification;
  }

  async markNotificationRead(id: string): Promise<void> {
    const db = await getDb();
    await db.collection<Notification>("notifications").updateOne({ id }, { $set: { read: true } });
  }

  // ----------------- Analytics operations -----------------
  async getStats(): Promise<{ totalProducts: number; verifiedBatches: number; activeShipments: number; averageQualityScore: number }> {
    const db = await getDb();
    const products = await db.collection<Product>("products").find().toArray();
    const transactions = await db.collection<Transaction>("transactions").find().toArray();
    const qualityChecks = await db.collection<QualityCheck>("qualitychecks").find().toArray();
    return {
      totalProducts: products.length,
      verifiedBatches: products.filter(p => p.blockchainHash).length,
      activeShipments: transactions.filter(t => t.transactionType === "shipment").length,
      averageQualityScore: qualityChecks.length > 0
        ? qualityChecks.reduce((sum, check) => sum + Number((check as any).score ?? 0), 0) / qualityChecks.length
        : 0
    };
  }

  async getUserStats(userId: string): Promise<{ totalProducts: number; activeTransfers: number; completedTransfers: number; averageRating: number }> {
    const db = await getDb();
    const products = await db.collection<Product>("products").find({ ownerId: userId }).toArray();
    const transfers = await db.collection<OwnershipTransfer>("ownershiptransfers").find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    }).toArray();
    const activeTransfers = transfers.filter(t => t.status !== "completed").length;
    const completedTransfers = transfers.filter(t => t.status === "completed").length;
    return {
      totalProducts: products.length,
      activeTransfers,
      completedTransfers,
      averageRating: 4.5 // Placeholder
    };
  }

  // ----------------- Ownership management -----------------
  async addProductOwner(insertOwner: InsertProductOwner): Promise<ProductOwner> {
    const db = await getDb();
    const owner: ProductOwner = {
      ...insertOwner,
      id: randomUUID(),
      createdAt: new Date(),
    };
    await db.collection<ProductOwner>("product_owners").insertOne(owner);
    return owner;
  }

  async getProductOwners(productId: string): Promise<ProductOwner[]> {
    const db = await getDb();
    return await db.collection<ProductOwner>("product_owners").find({ productId }).toArray();
  }

  async getOwnerByUsername(username: string): Promise<ProductOwner | undefined> {
    const db = await getDb();
    return await db.collection<ProductOwner>("product_owners").findOne({ username }) ?? undefined;
  }

  // ----------------- Comments/communication -----------------
  async addProductComment(insertComment: InsertProductComment): Promise<ProductComment> {
    const db = await getDb();
    const comment: ProductComment = {
      ...insertComment,
      id: randomUUID(),
      createdAt: new Date(),
    };
    await db.collection<ProductComment>("product_comments").insertOne(comment);
    return comment;
  }

  async getProductComments(productId: string): Promise<ProductComment[]> {
    const db = await getDb();
    return await db.collection<ProductComment>("product_comments").find({ productId }).sort({ createdAt: 1 }).toArray();
  }

  // ----------------- Helper methods -----------------
  private generateBatchId(category: string): string {
    const prefix = category.substring(0, 3).toUpperCase();
    const year = new Date().getFullYear();
    const id = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
    return `${prefix}-${year}-${id}`;
  }

  private generateQRCode(batchId: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`farmtrace://${batchId}`)}`;
  }

  private generateBlockchainHash(): string {
    return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }
}

export const storage = new MongoStorage();
