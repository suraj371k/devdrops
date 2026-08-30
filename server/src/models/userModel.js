import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
const COLLECTION = "users";
import database from "../db/connection.js";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validateUsername = (username) => {
  return (
    typeof username === "string" &&
    username.length >= 3 &&
    username.length <= 30 &&
    /^[a-zA-Z0-9_]+$/.test(username)
  );
};

const validatePassword = (password) => {
  return typeof password === "string" && password.length >= 6;
};

const getDefaultPreferences = () => ({
  theme: "light",
  defaultVisibility: "private",
  recallInterval: 24,
});

const userModel = {
  async create(userData) {
    const db = database.getDb();
    const collection = db.collection(COLLECTION);

    const { username, email, password } = userData;

    if (!validateUsername(username)) {
      throw new Error(
        "Username must be at least 3 characters, alphanumeric and underscores only",
      );
    }

    if (!validateEmail(email)) {
      throw new Error("Invalid email format");
    }

    if (!validatePassword(password)) {
      throw new Error("Password must be at least 6 characters");
    }

    const existingUser = await collection.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      throw new Error("User with this email or username already exists");
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const now = new Date();
    const user = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      lastLogin: null,
      lastLoginIP: null,
      preferences: getDefaultPreferences(),
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(user);
    return { ...user, _id: result.insertedId, password: undefined };
  },

  async findById(id) {
    const db = database.getDb();
    const collection = db.collection(COLLECTION);
    return collection.findOne(
      { _id: new ObjectId(id) },
      { projection: { password: 0 } },
    );
  },

  async findByEmail(email) {
    const db = database.getDb();
    const collection = db.collection(COLLECTION);
    return collection.findOne({ email: email.toLowerCase() });
  },

  async findByUsername(username) {
    const db = database.getDb();
    const collection = db.collection(COLLECTION);
    return collection.findOne({ username: username.toLowerCase() });
  },

  async findByEmailOrUsername(identifier) {
    const db = database.getDb();
    const collection = db.collection(COLLECTION);
    return collection.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    });
  },

  async updateLastLogin(userId, ip) {
    const db = database.getDb();
    const collection = db.collection(COLLECTION);
    const now = new Date();
    return collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          lastLogin: now,
          lastLoginIP: ip,
          updatedAt: now,
        },
      },
    );
  },

  async updatePreferences(userId, preferences) {
    const db = database.getDb();
    const collection = db.collection(COLLECTION);

    const allowedPrefs = ["theme", "defaultVisibility", "recallInterval"];
    const updates = {};

    for (const key of allowedPrefs) {
      if (preferences[key] !== undefined) {
        if (key === "theme" && !["light", "dark"].includes(preferences[key])) {
          throw new Error("Invalid theme value");
        }
        if (
          key === "defaultVisibility" &&
          !["public", "private"].includes(preferences[key])
        ) {
          throw new Error("Invalid visibility value");
        }
        if (
          key === "recallInterval" &&
          (typeof preferences[key] !== "number" || preferences[key] < 1)
        ) {
          throw new Error("Recall interval must be a positive number");
        }
        updates[`preferences.${key}`] = preferences[key];
      }
    }

    updates.updatedAt = new Date();

    return collection.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $set: updates },
      { returnDocument: "after", projection: { password: 0 } },
    );
  },

  async updatePassword(userId, newPassword) {
    if (!validatePassword(newPassword)) {
      throw new Error("Password must be at least 6 characters");
    }

    const db = database.getDb();
    const collection = db.collection(COLLECTION);
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    return collection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { password: hashedPassword, updatedAt: new Date() } },
    );
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password);
  },

  async getStats(userId) {
    const db = database.getDb();

    const dropsCount = await db
      .collection("drops")
      .countDocuments({ createdBy: new ObjectId(userId) });
    const collectionsCount = await db
      .collection("collections")
      .countDocuments({ createdBy: new ObjectId(userId) });
    const masteredCount = await db.collection("drops").countDocuments({
      createdBy: new ObjectId(userId),
      recallCount: { $gte: 5 },
    });

    const streak = await this.calculateStreak(userId);

    return {
      totalDrops: dropsCount,
      totalCollections: collectionsCount,
      masteredDrops: masteredCount,
      currentStreak: streak,
    };
  },

  async calculateStreak(userId) {
    const db = database.getDb();
    const history = await db
      .collection("recallHistory")
      .find({ userId: new ObjectId(userId) })
      .sort({ recalledAt: -1 })
      .toArray();

    if (history.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const recalledDates = new Set(
      history.map((h) => {
        const d = new Date(h.recalledAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
    );

    while (recalledDates.has(currentDate.getTime())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  },
};

export default userModel;
