import 'dotenv/config'
import database from './connection.js'

async function createDropStatsView(db) {
  const collections = await db.listCollections({ name: 'dropStatsView' }).toArray()
  if (collections.length > 0) {
    await db.collection('dropStatsView').drop()
  }

  await db.createCollection('dropStatsView', {
    viewOn: 'drops',
    pipeline: [
      {
        $group: {
          _id: '$createdBy',
          totalDrops: { $sum: 1 },
          mastered: { $sum: { $cond: [{ $gte: ['$recallCount', 5] }, 1, 0] } },
          dueForRecall: { $sum: { $cond: [{ $lte: ['$nextRecallDate', '$$NOW'] }, 1, 0] } },
          favoriteCount: { $sum: { $cond: ['$isFavorite', 1, 0] } },
          publicCount: { $sum: { $cond: [{ $eq: ['$visibility', 'public'] }, 1, 0] } },
          privateCount: { $sum: { $cond: [{ $eq: ['$visibility', 'private'] }, 1, 0] } },
          avgRecallCount: { $avg: '$recallCount' },
        },
      },
      { $project: { _id: 0, userId: '$_id', totalDrops: 1, mastered: 1, dueForRecall: 1, favoriteCount: 1, publicCount: 1, privateCount: 1, avgRecallCount: 1 } },
    ],
  })
}

async function createIndexes() {
  await database.connect()
  const db = database.getDb()

  try {
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'idx_users_email_unique' },
      { key: { username: 1 }, unique: true, name: 'idx_users_username_unique' },
      { key: { createdAt: -1 }, name: 'idx_users_created_at' },
    ])
    console.log('✓ Users indexes created')

    await db.collection('drops').createIndexes([
      { key: { createdBy: 1, createdAt: -1 }, name: 'idx_drops_user_created' },
      { key: { createdBy: 1, nextRecallDate: 1 }, name: 'idx_drops_user_recall' },
      { key: { type: 1 }, name: 'idx_drops_type' },
      { key: { tags: 1 }, name: 'idx_drops_tags' },
      { key: { visibility: 1 }, name: 'idx_drops_visibility' },
      { key: { isFavorite: 1 }, name: 'idx_drops_favorite' },
      { key: { 'relatedDrops': 1 }, name: 'idx_drops_related' },
      { key: { title: 'text', content: 'text', tags: 'text' }, name: 'idx_drops_text_search' },
      { key: { createdAt: -1 }, name: 'idx_drops_created_at' },
      { key: { updatedAt: -1 }, name: 'idx_drops_updated_at' },
    ])
    console.log('✓ Drops indexes created')

    await db.collection('collections').createIndexes([
      { key: { createdBy: 1, name: 1 }, unique: true, name: 'idx_collections_user_name_unique' },
      { key: { createdBy: 1 }, name: 'idx_collections_user' },
      { key: { shareToken: 1 }, unique: true, sparse: true, name: 'idx_collections_share_token' },
      { key: { isShared: 1 }, name: 'idx_collections_shared' },
      { key: { createdAt: -1 }, name: 'idx_collections_created_at' },
    ])
    console.log('✓ Collections indexes created')

    await db.collection('recallHistory').createIndexes([
      { key: { userId: 1, recalledAt: -1 }, name: 'idx_recall_history_user_date' },
      { key: { dropId: 1, recalledAt: -1 }, name: 'idx_recall_history_drop_date' },
      { key: { userId: 1, dropId: 1 }, name: 'idx_recall_history_user_drop' },
      { key: { recalledAt: -1 }, name: 'idx_recall_history_date' },
    ])
    console.log('✓ RecallHistory indexes created')

    await createDropStatsView(db)
    console.log('✓ dropStatsView materialized view created')

    console.log('\n✅ All indexes and views created successfully')
  } catch (error) {
    console.error('❌ Error creating indexes:', error.message)
    throw error
  } finally {
    await database.disconnect()
    process.exit(0)
  }
}

createIndexes()
