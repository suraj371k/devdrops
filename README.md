# DevDrops

A minimalist developer productivity tool for capturing, organizing, and recalling knowledge drops with smart categorization and spaced repetition.

## Live Demo

- Frontend: [https://devdrops.vercel.app](https://devdrops.vercel.app)
- API Health: [https://devdrops-api.onrender.com/health](https://devdrops-api.onrender.com/health)

## Tech Stack

### Backend
- Node.js 18+
- Express.js 4.18
- MongoDB 7 (Native Driver - No Mongoose)
- JWT Authentication
- bcryptjs for password hashing
- Joi for validation
- Custom rate limiting, logging, error handling

### Frontend
- React 18
- Vite 5
- Redux Toolkit 2 + RTK Query
- React Router 6
- Tailwind CSS 3
- react-hot-toast for notifications
- canvas-confetti for celebrations

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas
- Docker support included

## Features

### Authentication
- JWT-based register/login/logout
- Protected routes
- Password hashing with bcrypt
- Session tracking (last login IP & timestamp)
- Remember me functionality

### Knowledge Drops
- Create, read, update, delete drops
- Auto-categorization (code, command, link, note)
- Markdown support in content
- Tags (max 5, auto-extracted)
- Visibility (public/private)
- Favorites
- Related drops (bidirectional)

### Spaced Repetition (Fibonacci-based)
- Initial recall: 1 hour
- Subsequent recalls: 1h, 2h, 3h, 5h, 8h, 13h, 21h, 34h, 55h...
- Manual and scheduled recall tracking
- Confidence rating (1-5)
- Recall history

### Collections
- Create, rename, delete collections
- Color-coded cards
- Add/remove drops
- Public sharing via share tokens
- Read-only public view

### Dashboard & Stats
- Recall queue with due drops
- Total drops, mastered (≥5 recalls), pending, streak
- Recent drops
- Quick create action

### Recall Mode
- Interactive spaced repetition session
- Reveal content on demand
- Keyboard shortcuts (Space=Reveal, R=Remembered, N=Need Review)
- Progress tracking
- Confetti on mastery (5th recall)

### Explorer
- Search by title, content, tags
- Filter by type, language, visibility
- Sort options
- Pagination (8 per page)

### Profile & Preferences
- Theme toggle (light/dark)
- Default visibility
- Recall interval customization
- Data export (JSON)

### UI/UX
- Mobile-first responsive design
- Dark mode support
- Custom command palette (Ctrl+K)
- Keyboard shortcuts throughout
- Loading skeletons
- Empty states with illustrations
- Toast notifications

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB 7+
- Docker (optional)

### Local Development (Without Docker)

1. Clone the repository:
```bash
git clone <repo-url>
cd devdrops
```

2. Setup backend:
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

3. Setup frontend:
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

4. Seed database (optional):
```bash
cd server
npm run seed
```

5. Create indexes:
```bash
cd server
npm run indexes
```

### Local Development (With Docker)

```bash
docker-compose up --build
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- MongoDB: localhost:27017

### Environment Variables

#### Backend (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | Required |
| MONGODB_DB_NAME | Database name | devdrops |
| JWT_SECRET | JWT signing secret (min 32 chars) | Required |
| JWT_EXPIRES_IN | Token expiration | 7d |
| FRONTEND_URL | CORS origin | http://localhost:5173 |
| LOG_LEVEL | Log level (error, warn, info, debug) | info |

#### Frontend (.env)
| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API URL |

## API Documentation

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT + user data |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/preferences` | Update user preferences |

### Drop Routes (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drops` | Get all drops (filter, paginate) |
| GET | `/api/drops/recall` | Get drops due for recall |
| GET | `/api/drops/related/:id` | Get related drops |
| GET | `/api/drops/stats` | Get recall statistics |
| GET | `/api/drops/:id` | Get single drop |
| POST | `/api/drops` | Create new drop |
| POST | `/api/drops/:id/recall` | Mark drop as recalled |
| POST | `/api/drops/:id/relate` | Add related drop |
| PUT | `/api/drops/:id` | Update drop (owner only) |
| PUT | `/api/drops/:id/favorite` | Toggle favorite |
| DELETE | `/api/drops/:id` | Delete drop (owner only) |

### Collection Routes (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | Get all collections |
| GET | `/api/collections/:id` | Get collection with drops |
| GET | `/api/collections/:id/share` | Generate share link |
| POST | `/api/collections` | Create collection |
| POST | `/api/collections/:id/drops` | Add drop to collection |
| PUT | `/api/collections/:id` | Update collection |
| DELETE | `/api/collections/:id` | Delete collection |
| DELETE | `/api/collections/:id/drops/:dropId` | Remove drop from collection |

### Public Routes (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/share/:token` | View shared collection |
| GET | `/api/public/explore` | Browse public drops |

## Database Schema

### Users
```javascript
{
  username: String,      // unique, min 3 chars
  email: String,         // unique, valid format
  password: String,      // hashed, min 6 chars
  lastLogin: Date,
  lastLoginIP: String,
  preferences: {
    theme: String,           // light/dark
    defaultVisibility: String, // public/private
    recallInterval: Number   // hours, default 24
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Drops
```javascript
{
  title: String,         // required, max 100 chars
  content: String,       // required, markdown supported
  type: String,          // code/command/link/note
  language: String,      // optional, for code type
  tags: [String],        // max 5
  visibility: String,    // public/private
  createdBy: ObjectId,   // ref: User
  isFavorite: Boolean,
  recallCount: Number,
  lastRecalled: Date,
  nextRecallDate: Date,  // Fibonacci-based
  relatedDrops: [ObjectId], // self-ref
  createdAt: Date,
  updatedAt: Date
}
```

### Collections
```javascript
{
  name: String,          // required, unique per user
  description: String,   // max 200 chars
  createdBy: ObjectId,   // ref: User
  drops: [ObjectId],     // ref: Drop
  color: String,         // hex code
  isShared: Boolean,
  shareToken: String,    // for public sharing
  createdAt: Date,
  updatedAt: Date
}
```

### RecallHistory
```javascript
{
  dropId: ObjectId,      // ref: Drop
  userId: ObjectId,      // ref: User
  recalledAt: Date,
  recallType: String,    // manual/scheduled
  confidence: Number     // 1-5
}
```

## Algorithm: Spaced Repetition

The spaced repetition system uses the Fibonacci sequence to calculate recall intervals:

```
Fibonacci: 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144...

Recall #0 (creation):     nextRecall = createdAt + 1h
Recall #1:                nextRecall = now + 1h  
Recall #2:                nextRecall = now + 2h
Recall #3:                nextRecall = now + 3h
Recall #4:                nextRecall = now + 5h
Recall #5:                nextRecall = now + 8h (MASTERED)
...
```

Implementation in `server/src/services/recallService.js`:
- `fibonacci(n)` - memoized Fibonacci calculation
- `calculateNextRecallDate(baseDate, recallCount)` - computes next due date
- `detectType(content)` - auto-categorizes drop type
- `getLanguageFromContent(content, type)` - detects programming language

## Challenges & Solutions

### 1. No Mongoose Constraint
**Challenge**: Required to use native MongoDB driver without ORM/ODM.
**Solution**: Built custom model classes with native driver methods, manual index creation, aggregation pipelines using `$lookup`, `$unwind`, `$group` directly.

### 2. No async/await in Controllers
**Challenge**: Task required callbacks/.then().catch() pattern in controllers.
**Solution**: Refactored all controller methods to use Promise chains instead of async/await, while keeping services and models async/await for readability.

### 3. Custom Markdown Parser
**Challenge**: Could not use existing markdown libraries.
**Solution**: Built lightweight parser supporting headers, bold, italic, code blocks, links, lists, blockquotes using regex replacements.

### 4. Fibonacci Spaced Repetition
**Challenge**: Implement custom spaced repetition algorithm from scratch.
**Solution**: Created memoized Fibonacci function, integrated with drop creation/recall flow, stored nextRecallDate for efficient querying.

### 5. ES Modules Migration
**Challenge**: Convert entire backend from CommonJS to ES modules.
**Solution**: Added `"type": "module"` to package.json, updated all imports/exports, fixed `__dirname` usage with `import.meta.url`.

## Performance Optimizations

- **Indexes**: Compound indexes on frequently queried fields (user+createdAt, user+nextRecallDate, text search)
- **Aggregation Pipelines**: Used for collection stats, user stats, suggested tags
- **Connection Pooling**: MongoDB driver configured with maxPoolSize: 10
- **Rate Limiting**: Custom in-memory rate limiter with cleanup intervals
- **Caching**: RTK Query automatic caching with tag-based invalidation
- **Optimistic Updates**: UI updates immediately, syncs with server
- **Lazy Loading**: Code splitting with React.lazy for routes
- **Debounced Search**: 300ms debounce on search inputs

## Future Improvements

1. **Rich Text Editor** - TipTap or Slate for better markdown editing
2. **Collaborative Collections** - Multi-user shared collections with permissions
3. **Import/Export** - Support for Anki, Notion, Obsidian formats
4. **Mobile App** - React Native version
5. **AI-Powered Tags** - OpenAI embeddings for semantic tag suggestions
6. **Scheduled Recalls** - Background job (BullMQ) for push notifications
7. **Analytics Dashboard** - Learning patterns, retention curves
8. **Keyboard Macros** - User-defined shortcuts
9. **Plugin System** - Extensible architecture for custom drop types
10. **Offline Support** - Service worker + IndexedDB for offline access

## Project Structure

```
devdrops/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Button, Input, Card, Modal, Toast, LoadingSpinner
│   │   │   ├── dashboard/       # RecallQueue, StatsCard
│   │   │   ├── drops/           # DropCard, DropForm, DropDetail
│   │   │   ├── collections/     # CollectionCard, CollectionForm
│   │   │   └── profile/         # Profile components
│   │   ├── pages/               # Login, Register, Dashboard, RecallMode, etc.
│   │   ├── store/
│   │   │   ├── slices/          # authSlice, uiSlice
│   │   │   └── api.js           # RTK Query API definitions
│   │   ├── hooks/               # useLocalStorage, useKeyboardShortcut, useDebounce, useRecallQueue
│   │   ├── utils/               # markdownParser, fibonacci, tagExtractor, validators
│   │   ├── styles/              # Tailwind + custom CSS
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── server/
│   ├── src/
│   │   ├── controllers/         # auth, drop, collection, public
│   │   ├── models/              # user, drop, collection, recallHistory
│   │   ├── routes/              # API route definitions
│   │   ├── middleware/          # auth, ownership, rateLimiter, logger, errorHandler
│   │   ├── services/            # recallService, tagService, searchService
│   │   ├── db/                  # connection, indexes
│   │   ├── scripts/             # seed
│   │   ├── app.js
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Submission

- GitHub: [Private repo with access granted]
- Frontend: Vercel deployment URL
- Backend: Render deployment URL
- Video: Loom recording explaining approach

---

Built with ❤️ for the CodeAries Full Stack Developer Intern challenge.