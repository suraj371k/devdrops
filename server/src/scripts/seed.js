import 'dotenv/config'
import database from '../db/connection.js'
import userModel from '../models/userModel.js'
import dropModel from '../models/dropModel.js'
import collectionModel from '../models/collectionModel.js'
import recallHistoryModel from '../models/recallHistoryModel.js'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

const SAMPLE_DROPS = [
  {
    title: 'JavaScript Array Methods Cheatsheet',
    content: '```javascript\nconst arr = [1, 2, 3, 4, 5];\n\n// map - transform each element\nconst doubled = arr.map(x => x * 2);\n\n// filter - keep elements that pass test\nconst evens = arr.filter(x => x % 2 === 0);\n\n// reduce - accumulate to single value\nconst sum = arr.reduce((acc, x) => acc + x, 0);\n\n// find - first element matching condition\nconst found = arr.find(x => x > 3);\n\n// some/every - boolean checks\nconst hasLarge = arr.some(x => x > 10);\nconst allPositive = arr.every(x => x > 0);\n```',
    type: 'code',
    language: 'javascript',
    tags: ['javascript', 'array', 'cheatsheet'],
    visibility: 'public',
  },
  {
    title: 'Git Undo Last Commit',
    content: '$ git reset --soft HEAD~1\n\n# Keep changes staged\n$ git reset --mixed HEAD~1\n\n# Unstage changes, keep in working dir\n$ git reset --hard HEAD~1\n\n# Discard all changes (DANGEROUS)',
    type: 'command',
    language: 'bash',
    tags: ['git', 'undo', 'reset'],
    visibility: 'public',
  },
  {
    title: 'React useEffect Cleanup Pattern',
    content: '```javascript\nuseEffect(() => {\n  const subscription = api.subscribe(data => {\n    setData(data);\n  });\n\n  // Cleanup function\n  return () => {\n    subscription.unsubscribe();\n  };\n}, [dependency]);\n```',
    type: 'code',
    language: 'javascript',
    tags: ['react', 'hooks', 'useeffect'],
    visibility: 'public',
  },
  {
    title: 'Docker Multi-stage Build',
    content: '```dockerfile\n# Build stage\nFROM node:18-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\n# Production stage\nFROM nginx:alpine\nCOPY --from=builder /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n```',
    type: 'code',
    language: 'dockerfile',
    tags: ['docker', 'multistage', 'nginx'],
    visibility: 'public',
  },
  {
    title: 'MongoDB Aggregation Pipeline',
    content: '```javascript\ndb.orders.aggregate([\n  { $match: { status: "completed" } },\n  { $group: {\n    _id: "$customerId",\n    totalSpent: { $sum: "$amount" },\n    orderCount: { $sum: 1 }\n  }},\n  { $sort: { totalSpent: -1 } },\n  { $limit: 10 }\n])\n```',
    type: 'code',
    language: 'javascript',
    tags: ['mongodb', 'aggregation', 'pipeline'],
    visibility: 'public',
  },
  {
    title: 'VS Code Keyboard Shortcuts',
    content: 'https://code.visualstudio.com/shortcuts/keyboard-shortcuts-windows.pdf',
    type: 'link',
    tags: ['vscode', 'shortcuts', 'productivity'],
    visibility: 'public',
  },
  {
    title: 'Regex for Email Validation',
    content: '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/',
    type: 'note',
    tags: ['regex', 'email', 'validation'],
    visibility: 'private',
  },
  {
    title: 'Python Virtual Environment Commands',
    content: '$ python -m venv venv\n$ source venv/bin/activate  # Linux/Mac\n$ venv\\Scripts\\activate     # Windows\n$ pip install -r requirements.txt\n$ deactivate',
    type: 'command',
    language: 'bash',
    tags: ['python', 'venv', 'pip'],
    visibility: 'public',
  },
  {
    title: 'CSS Flexbox Centering',
    content: '```css\n.center {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n```',
    type: 'code',
    language: 'css',
    tags: ['css', 'flexbox', 'centering'],
    visibility: 'public',
  },
  {
    title: 'Node.js Event Loop Phases',
    content: 'The event loop has these phases:\n1. Timers - setTimeout/setInterval callbacks\n2. Pending callbacks - I/O callbacks deferred\n3. Idle/prepare - internal use\n4. Poll - retrieve new I/O events\n5. Check - setImmediate callbacks\n6. Close callbacks - socket.on("close", ...)',
    type: 'note',
    tags: ['nodejs', 'event-loop', 'async'],
    visibility: 'public',
  },
  {
    title: 'TypeScript Utility Types',
    content: '```typescript\n// Partial - all properties optional\ninterface User { name: string; age: number; }\nconst user: Partial<User> = { name: "John" };\n\n// Required - all properties required\nconst user2: Required<Partial<User>> = { name: "Jane", age: 25 };\n\n// Pick - select specific properties\nconst user3: Pick<User, "name"> = { name: "Bob" };\n\n// Omit - remove specific properties\nconst user4: Omit<User, "age"> = { name: "Alice" };\n```',
    type: 'code',
    language: 'typescript',
    tags: ['typescript', 'utility-types', 'generics'],
    visibility: 'public',
  },
]

async function seed() {
  try {
    await database.connect()
    const db = database.getDb()

    console.log('🌱 Starting seed...')

    // Clear existing data
    await Promise.all([
      db.collection('users').deleteMany({}),
      db.collection('drops').deleteMany({}),
      db.collection('collections').deleteMany({}),
      db.collection('recallHistory').deleteMany({}),
    ])
    console.log('✓ Cleared existing data')

    // Create test users
    const users = []
    for (let i = 1; i <= 3; i++) {
      const username = `devuser${i}`
      const email = `devuser${i}@example.com`
      const password = 'password123'

      const user = await userModel.create({ username, email, password })
      users.push(user)
      console.log(`✓ Created user: ${username}`)
    }

    const mainUser = users[0]

    // Create drops for main user
    const drops = []
    for (const dropData of SAMPLE_DROPS) {
      const drop = await dropModel.create(dropData, mainUser._id)
      drops.push(drop)
    }
    console.log(`✓ Created ${drops.length} drops`)

    // Add some recalls to simulate spaced repetition
    const dropsToRecall = drops.slice(0, 5)
    for (let i = 0; i < dropsToRecall.length; i++) {
      const drop = dropsToRecall[i]
      const recallCount = i + 1
      await db.collection('drops').updateOne(
        { _id: drop._id },
        { $set: { recallCount, lastRecalled: new Date() } }
      )

      for (let r = 0; r < recallCount; r++) {
        await recallHistoryModel.create({
          dropId: drop._id,
          userId: mainUser._id,
          recallType: r === recallCount - 1 ? 'scheduled' : 'manual',
          confidence: Math.floor(Math.random() * 5) + 1,
        })
      }
    }
    console.log('✓ Added recall history')

    // Create collections
    const collectionsData = [
      { name: 'JavaScript', description: 'JS tips and tricks', color: '#F7DF1E' },
      { name: 'React', description: 'React hooks and patterns', color: '#61DAFB' },
      { name: 'DevOps', description: 'Docker, CI/CD, and more', color: '#2496ED' },
      { name: 'Database', description: 'SQL and NoSQL queries', color: '#47A248' },
    ]

    const collections = []
    for (const colData of collectionsData) {
      const collection = await collectionModel.create(colData, mainUser._id)
      collections.push(collection)
    }
    console.log(`✓ Created ${collections.length} collections`)

    // Add drops to collections
    await collectionModel.addDrop(collections[0]._id, mainUser._id, drops[0]._id) // JS cheatsheet -> JavaScript
    await collectionModel.addDrop(collections[0]._id, mainUser._id, drops[2]._id) // useEffect -> JavaScript
    await collectionModel.addDrop(collections[1]._id, mainUser._id, drops[2]._id) // useEffect -> React
    await collectionModel.addDrop(collections[2]._id, mainUser._id, drops[3]._id) // Docker -> DevOps
    await collectionModel.addDrop(collections[3]._id, mainUser._id, drops[4]._id) // MongoDB -> Database
    console.log('✓ Added drops to collections')

    // Create a public shared collection
    const sharedCollection = await collectionModel.create({
      name: 'Public Resources',
      description: 'Shared learning resources',
      color: '#FF6B6B',
      isShared: true,
    }, mainUser._id)

    await collectionModel.addDrop(sharedCollection._id, mainUser._id, drops[0]._id)
    await collectionModel.addDrop(sharedCollection._id, mainUser._id, drops[1]._id)
    await collectionModel.addDrop(sharedCollection._id, mainUser._id, drops[5]._id) // VS Code shortcuts
    console.log('✓ Created shared collection')

    console.log('\n✅ Seed completed successfully!')
    console.log('\n📋 Test accounts:')
    users.forEach(u => {
      console.log(`   ${u.username} / password123`)
    })
  } catch (error) {
    console.error('❌ Seed failed:', error.message)
    console.error(error.stack)
  } finally {
    await database.disconnect()
    process.exit(0)
  }
}

seed()