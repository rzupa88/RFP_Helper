import express from 'express'
import path from 'path'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { logger } from './logger.js'
import supabase from './supabase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))

// Root route redirect to admin.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'))
})

// API Routes
app.get('/qna', async (req, res) => {
  try {
    // Set headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.set('Expires', '0')
    res.set('Pragma', 'no-cache')

    const { data, error } = await supabase
      .from('qna_library')
      .select('*')
      .order('id')

    if (error) {
      logger.error('Supabase query error:', error)
      return res.status(500).json({ error: error.message })
    }

    logger.info(`Retrieved ${data?.length || 0} Q&A entries`)
    return res.json(data || [])
  } catch (err) {
    logger.error('Error in /qna endpoint:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// Error handling
app.use((err, req, res, next) => {
  logger.error('Express error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
})