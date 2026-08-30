import { MongoClient } from 'mongodb'

class Database {
  constructor() {
    this.client = null
    this.db = null
    this.isConnected = false
  }

  async connect() {
    if (this.isConnected && this.db) {
      return this.db
    }

    const uri = process.env.MONGODB_URI
    const dbName = process.env.MONGODB_DB_NAME || 'devdrops'

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required')
    }

    try {
      this.client = new MongoClient(uri, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })

      await this.client.connect()
      this.db = this.client.db(dbName)
      this.isConnected = true

      console.log(`Connected to MongoDB: ${dbName}`)
      return this.db
    } catch (error) {
      console.error('MongoDB connection error:', error.message)
      throw error
    }
  }

  getDb() {
    if (!this.isConnected || !this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  async disconnect() {
    if (this.client) {
      await this.client.close()
      this.isConnected = false
      this.db = null
      console.log('Disconnected from MongoDB')
    }
  }

  getCollection(name) {
    return this.getDb().collection(name)
  }
}

const database = new Database()

export default database