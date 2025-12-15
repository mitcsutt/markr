import { config } from '@dotenvx/dotenvx';
import { prisma } from '@repo/db'
import express from 'express'

// Load .env
config({ convention: 'nextjs' });

const app = express()

app.use(express.json())

app.get('/students', async (req, res) => {
  const users = await prisma.student.findMany()
  res.json(users)
})

app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000`),
) 