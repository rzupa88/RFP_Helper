# RFP Helper

[![Node.js v20](https://img.shields.io/badge/node-v20-brightgreen)](https://nodejs.org) [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

RFP Helper is a Node.js web application designed to streamline Request for Proposal (RFP) processes by providing a centralized Q&A knowledge base with AI-powered assistance. Built with Express, Supabase (PostgreSQL), and vanilla JS/HTML, the application combines traditional database querying with AI-powered responses using the Grok API to provide comprehensive answers to RFP questions.

## Key Features

### AI-Powered Chatbot
- Interactive chat interface for asking questions
- Smart response system that first checks the existing Q&A database
- Fallback to Grok AI for questions without database matches
- Confidence scoring for database matches

### Q&A Management
- Add, view, and delete Q&A entries
- Categorize entries with categories and subcategories
- Search and filter functionality
- Complete library view with sorting options

### Smart CSV Processing
- Upload CSV files containing questions
- AI-powered answer generation
- Review and edit generated answers before committing
- Download processed results for external review
- Two-step process: Generate answers → Review → Commit to library
- Progress tracking and status updates

### Settings & Customization
- Dark/Light theme toggle
- Adjustable AI confidence thresholds
- Customizable default categories for CSV uploads
- Mobile-responsive design

### Database Integration
- Supabase PostgreSQL backend
- Efficient data persistence
- Transaction support for bulk operations
- Full-text search capabilities
- Similarity matching for question lookup

## Configuration

### Environment Variables
Create a `.env` file in the project root with the following configurations:

```bash
# Database Configuration
DATABASE_URL=postgres://<USERNAME>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>

# AI Configuration
XAI_API_KEY=your_grok_api_key
```

### Database Setup
The application requires a PostgreSQL database (via Supabase) with the following schema:

```sql
CREATE TABLE qna_library (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  similarity real GENERATED ALWAYS AS (word_similarity(question, answer)) STORED
);

-- Enable full text search
CREATE INDEX qna_library_question_idx ON qna_library USING gin(to_tsvector('english', question));
CREATE INDEX qna_library_answer_idx ON qna_library USING gin(to_tsvector('english', answer));
```

## Getting Started

### Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env`
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open http://localhost:3000/admin to access the admin panel

### Usage
1. **Adding Q&A Entries:**
   - Use the Add Q&A form to manually add entries
   - Upload CSV files for bulk processing
   - Review AI-generated answers before committing

2. **Using the Chatbot:**
   - Navigate to the Chatbot tab
   - Enter your question
   - Get answers from database or AI
   - Option to use Grok for new questions

3. **Managing Settings:**
   - Adjust theme preferences
   - Configure AI confidence thresholds
   - Set default categories

## Project Structure
```
RFP_Helper/
├── public/
│   ├── css/
│   │   └── admin.css      # Styles for admin interface
│   ├── js/
│   │   ├── admin-panel.js # Core admin functionality
│   │   ├── chatbot-manager.js # Chatbot handling
│   │   ├── csv-manager.js # CSV processing
│   │   └── qna-manager.js # Q&A CRUD operations
│   └── admin.html        # Main admin interface
├── src/
│   ├── index.js         # Express server & API routes
│   ├── db.js           # Database connection
│   ├── xai.js         # AI integration
│   └── uploads/       # Temporary file storage
└── package.json
```

## Future Enhancements
- Document parsing (PDF, DOCX)
- Batch editing in library view
- Advanced Q&A analytics
- User authentication
- API access controls

## License
ISC License - See LICENSE file for details
