import { 
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type Transaction, type InsertTransaction,
  type QualityCheck, type InsertQualityCheck,
  type Scan, type InsertScan
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Product operations
  getProduct(id: string): Promise<Product | undefined>;
  getProductByBatchId(batchId: string): Promise<Product | undefined>;
  getProductsByUser(userId: string): Promise<Product[]>;
  getAllProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined>;

  // Transaction operations
  getTransaction(id: string): Promise<Transaction | undefined>;
  getTransactionsByProduct(productId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Quality check operations
  getQualityChecksByProduct(productId: string): Promise<QualityCheck[]>;
  createQualityCheck(qualityCheck: InsertQualityCheck): Promise<QualityCheck>;

  // Scan operations
  createScan(scan: InsertScan): Promise<Scan>;
  getRecentScans(userId?: string, limit?: number): Promise<(Scan & { product: Product })[]>;

  // Analytics
  getStats(): Promise<{
    totalProducts: number;
    verifiedBatches: number;
    activeShipments: number;
    averageQualityScore: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private qualityChecks: Map<string, QualityCheck> = new Map();
  private scans: Map<string, Scan> = new Map();

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "farmer",
      profileImage: insertUser.profileImage || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByBatchId(batchId: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.batchId === batchId);
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.ownerId === userId);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const batchId = this.generateBatchId(insertProduct.category);
    const qrCode = this.generateQRCode(batchId);
    
    const product: Product = {
      ...insertProduct,
      id,
      batchId,
      qrCode,
      blockchainHash: this.generateBlockchainHash(),
      description: insertProduct.description || null,
      certifications: insertProduct.certifications || null,
      status: insertProduct.status || "registered",
      createdAt: new Date()
    };
    
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionsByProduct(productId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.productId === productId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      location: insertTransaction.location || null,
      fromUserId: insertTransaction.fromUserId || null,
      toUserId: insertTransaction.toUserId || null,
      coordinates: insertTransaction.coordinates || null,
      temperature: insertTransaction.temperature || null,
      humidity: insertTransaction.humidity || null,
      notes: insertTransaction.notes || null,
      blockchainHash: this.generateBlockchainHash(),
      verified: true,
      timestamp: new Date()
    };
    
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getQualityChecksByProduct(productId: string): Promise<QualityCheck[]> {
    return Array.from(this.qualityChecks.values())
      .filter(check => check.productId === productId)
      .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
  }

  async createQualityCheck(insertQualityCheck: InsertQualityCheck): Promise<QualityCheck> {
    const id = randomUUID();
    const qualityCheck: QualityCheck = {
      ...insertQualityCheck,
      id,
      notes: insertQualityCheck.notes || null,
      certificationUrl: insertQualityCheck.certificationUrl || null,
      verified: true,
      timestamp: new Date()
    };
    
    this.qualityChecks.set(id, qualityCheck);
    return qualityCheck;
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = randomUUID();
    const scan: Scan = {
      ...insertScan,
      id,
      location: insertScan.location || null,
      userId: insertScan.userId || null,
      coordinates: insertScan.coordinates || null,
      timestamp: new Date()
    };
    
    this.scans.set(id, scan);
    return scan;
  }

  async getRecentScans(userId?: string, limit: number = 10): Promise<(Scan & { product: Product })[]> {
    let scans = Array.from(this.scans.values());
    
    if (userId) {
      scans = scans.filter(scan => scan.userId === userId);
    }
    
    scans.sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime());
    
    return scans
      .slice(0, limit)
      .map(scan => {
        const product = this.products.get(scan.productId);
        return { ...scan, product: product! };
      })
      .filter(scan => scan.product);
  }

  async getStats(): Promise<{
    totalProducts: number;
    verifiedBatches: number;
    activeShipments: number;
    averageQualityScore: number;
  }> {
    const totalProducts = this.products.size;
    const verifiedBatches = Array.from(this.products.values())
      .filter(product => product.blockchainHash).length;
    
    const activeShipments = Array.from(this.transactions.values())
      .filter(transaction => transaction.transactionType === "shipment").length;
    
    const qualityChecks = Array.from(this.qualityChecks.values());
    const averageQualityScore = qualityChecks.length > 0
      ? qualityChecks.reduce((sum, check) => sum + Number(check.score), 0) / qualityChecks.length
      : 0;
    
    return {
      totalProducts,
      verifiedBatches,
      activeShipments,
      averageQualityScore
    };
  }

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

export const storage = new MemStorage();
