import { MongoClient } from "mongodb";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import { config } from "dotenv";
import { 
  User, InsertUser, 
  Product, InsertProduct, 
  Transaction, InsertTransaction, 
  QualityCheck, InsertQualityCheck,
  Scan, InsertScan,
  OwnershipTransfer, InsertOwnershipTransfer,
  Notification, InsertNotification,
  ProductOwner, InsertProductOwner,
  ProductComment, InsertProductComment
} from "@shared/schema";

config();

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB_NAME || "farmtrace";
const client = new MongoClient(uri);

let didLog = false;
async function getDb() {
  await client.connect();
  if (!didLog) {
    console.log(`[MongoDB] Connected to ${uri}, database ${dbName}`);
    didLog = true;
  }
  return client.db(dbName);
}

export class MongoStorage {
  // -------- Helper Methods --------
  private generateOwnershipHash(productId: string, ownerId: string, blockNumber: number, previousHash: string | null): string {
    const data = `${productId}-${ownerId}-${blockNumber}-${previousHash || 'genesis'}`;
    return createHash('sha256').update(data).digest('hex');
  }

  private async getNextBlockNumber(productId: string): Promise<number> {
    const db = await getDb();
    const lastOwner = await db.collection<ProductOwner>("product_owners")
      .findOne({ productId }, { sort: { blockNumber: -1 } });
    return (lastOwner?.blockNumber || 0) + 1;
  }

  private async getLastOwnershipHash(productId: string): Promise<string | null> {
    const db = await getDb();
    const lastOwner = await db.collection<ProductOwner>("product_owners")
      .findOne({ productId }, { sort: { blockNumber: -1 } });
    return lastOwner?.ownershipHash || null;
  }

  // -------- User Operations --------
  async getUser(id: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>("users").findOne({ id });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>("users").findOne({ email });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>("users").findOne({ username });
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>("users").findOne({ firebaseUid });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await getDb();
    const user: User = {
      ...insertUser,
      id: randomUUID(),
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

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const db = await getDb();
    const result = await db.collection<User>("users").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!result) return null;
    return result as User;
  }

  // -------- Product Operations --------
  async getProduct(id: string): Promise<Product | null> {
    const db = await getDb();
    return db.collection<Product>("products").findOne({ id });
  }

  async getProductByBatchId(batchId: string): Promise<Product | null> {
    const db = await getDb();
    return db.collection<Product>("products").findOne({ batchId });
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    const db = await getDb();
    return db.collection<Product>("products").find({ ownerId: userId }).toArray();
  }

  async getAllProducts(): Promise<Product[]> {
    const db = await getDb();
    return db.collection<Product>("products").find({}).toArray();
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const db = await getDb();
    const product: Product = {
      ...insertProduct,
      id: randomUUID(),
      quantity: String(insertProduct.quantity),
      description: insertProduct.description || null,
      certifications: insertProduct.certifications || null,
      status: insertProduct.status || "registered",
      qrCode: insertProduct.qrCode || null,
      batchId: insertProduct.batchId || null,
      blockchainHash: insertProduct.blockchainHash || null,
      createdAt: new Date()
    };
    await db.collection<Product>("products").insertOne(product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const db = await getDb();
    const result = await db.collection<Product>("products").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!result) return null;
    return result as Product;
  }

  // -------- Transaction Operations --------
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
      blockchainHash: insertTransaction.blockchainHash || null,
      verified: insertTransaction.verified ?? false,
      timestamp: new Date()
    };
    await db.collection<Transaction>("transactions").insertOne(transaction);
    return transaction;
  }

  // -------- QualityCheck Operations --------
  async createQualityCheck(insertQualityCheck: InsertQualityCheck): Promise<QualityCheck> {
    const db = await getDb();
    const qualityCheck: QualityCheck = {
      ...insertQualityCheck,
      id: randomUUID(),
      notes: insertQualityCheck.notes || null,
      certificationUrl: insertQualityCheck.certificationUrl || null,
      verified: false,
      timestamp: new Date()
    };
    await db.collection<QualityCheck>("qualitychecks").insertOne(qualityCheck);
    return qualityCheck;
  }

  // -------- Scan Operations --------
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

  // -------- OwnershipTransfer Operations --------
  async createOwnershipTransfer(insertOwnershipTransfer: InsertOwnershipTransfer): Promise<OwnershipTransfer> {
    const db = await getDb();
    const transfer: OwnershipTransfer = {
      ...insertOwnershipTransfer,
      id: randomUUID(),
      status: insertOwnershipTransfer.status || "pending",
      notes: insertOwnershipTransfer.notes || null,
      expectedDelivery: insertOwnershipTransfer.expectedDelivery || null,
      actualDelivery: insertOwnershipTransfer.actualDelivery || null,
      blockchainHash: insertOwnershipTransfer.blockchainHash || null,
      timestamp: new Date()
    };
    await db.collection<OwnershipTransfer>("ownershiptransfers").insertOne(transfer);
    return transfer;
  }

  // -------- Notification Operations --------
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const db = await getDb();
    const notification: Notification = {
      ...insertNotification,
      id: randomUUID(),
      read: insertNotification.read ?? false,
      productId: insertNotification.productId || null,
      createdAt: new Date()
    };
    await db.collection<Notification>("notifications").insertOne(notification);
    return notification;
  }

  // -------- ProductOwner Operations (Blockchain-style) --------
  async addProductOwner(insertProductOwner: InsertProductOwner): Promise<ProductOwner> {
    const db = await getDb();
    
    // Get blockchain-style data
    const blockNumber = await this.getNextBlockNumber(insertProductOwner.productId);
    const previousOwnerHash = await this.getLastOwnershipHash(insertProductOwner.productId);
    const ownershipHash = this.generateOwnershipHash(
      insertProductOwner.productId,
      insertProductOwner.ownerId,
      blockNumber,
      previousOwnerHash
    );

    const owner: ProductOwner = {
      ...insertProductOwner,
      id: randomUUID(),
      blockNumber,
      previousOwnerHash,
      ownershipHash,
      transferType: insertProductOwner.transferType || (blockNumber === 1 ? "initial" : "transfer"),
      createdAt: new Date()
    };
    
    await db.collection<ProductOwner>("product_owners").insertOne(owner);
    return owner;
  }

  async getProductOwners(productId: string): Promise<ProductOwner[]> {
    const db = await getDb();
    return db.collection<ProductOwner>("product_owners")
      .find({ productId })
      .sort({ blockNumber: 1 }) // Sort by blockchain order
      .toArray();
  }

  async getOwnershipChain(productId: string): Promise<ProductOwner[]> {
    return this.getProductOwners(productId); // Same as getProductOwners but with clear naming
  }

  // -------- ProductComment Operations --------
  async addProductComment(insertProductComment: InsertProductComment): Promise<ProductComment> {
    const db = await getDb();
    const comment: ProductComment = {
      ...insertProductComment,
      id: randomUUID(),
      createdAt: new Date()
    };
    await db.collection<ProductComment>("product_comments").insertOne(comment);
    return comment;
  }

  async getProductComments(productId: string): Promise<ProductComment[]> {
    const db = await getDb();
    return db.collection<ProductComment>("product_comments")
      .find({ productId })
      .sort({ createdAt: 1 })
      .toArray();
  }
}

export const storage = new MongoStorage();


