# RFP Helper

[![Node.js v20](https://img.shields.io/badge/node-v20-brightgreen)](https://nodejs.org) [![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

RFP Helper is a Node.js web application designed to streamline Request for Proposal (RFP) processes by providing a centralized Q\&A knowledge base and document management interface. The app allows users to upload relevant RFP documents, manage a categorized library of Q\&A entries, and (soon) interact with an AI-powered chatbot that leverages the Q\&A database to answer queries. Built with Express, Supabase (PostgreSQL), and vanilla JS/HTML, RFP Helper offers an easy-to-use Admin Panel for maintaining Q\&A content and a file upload interface for handling various document types.

## Features

* **File Upload Interface:** Upload RFP-related documents in PDF, DOCX, XLSX, CSV, TXT (and other supported) formats through a simple web form.
* **Admin Panel:** A dedicated interface (`admin.html`) to add, view, search, filter, and delete Q\&A entries. Questions can be categorized and optionally given subcategories for organization.
* **Supabase PostgreSQL Storage:** All Q\&A entries (question, answer, category, subcategory) are stored in a Supabase-hosted PostgreSQL database, ensuring data persistence and easy scalability.
* **Search & Filter:** Instantly search the Q\&A library by text or filter entries by category using the Admin Panel’s built-in search box and dropdown.
* **AI Chatbot (Coming Soon):** A future feature where a chatbot will answer user queries based on the Q\&A library. If a user’s question isn’t found, the chatbot will suggest adding a new Q\&A entry.

## Configuration

Before running the application, you need to configure your environment variables. Create a `.env` file in the project root (this file should **not** be committed to version control). The key configuration is the database connection string for Supabase:

```
DATABASE_URL=postgres://<USERNAME>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>
```

Replace `<USERNAME>`, `<PASSWORD>`, `<HOST>`, `<PORT>`, and `<DATABASE>` with your Supabase (PostgreSQL) credentials. You can obtain this connection URL from your Supabase project’s Settings -> Database -> Connection string.

You must also ensure that the PostgreSQL database has a table named `qna_library` to store the Q\&A data. For example:

```sql
CREATE TABLE qna_library (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT
);
```

## GitHub Codespaces Setup

To develop in GitHub Codespaces with minimal setup, RFP Helper includes a [Dev Container](.devcontainer/devcontainer.json) configuration using Node.js 20. Follow these steps:

1. **Open in Codespace:** Launch this repository in a new GitHub Codespace. The dev container will automatically set up a Node.js v20 environment with ESLint and Prettier extensions.
2. **Expose Ports:** By default, the app runs on port 3000. Ensure port 3000 is exposed in Codespaces (Codespaces should prompt you to open it or you can add a forwarding rule).
3. **Configure Environment Variables:** In the Codespace, either set the `DATABASE_URL` secret/environment variable through the Codespaces UI or create a `.env` file as described above.
4. **Install Dependencies:** In the terminal, run:

   ```bash
   npm install
   ```
5. **Start the Server:** Launch the app with:

   ```bash
   npm start
   ```

   For development with auto-reload, you can use:

   ```bash
   npm run dev
   ```
6. **Open the App:** Codespaces will provide a preview URL or you can click “Open in Browser” for port 3000. You should see the file upload page at `http://localhost:3000/` and the Admin Panel at `http://localhost:3000/admin`.

## Local Development

To run RFP Helper on your local machine:

1. **Prerequisites:** Install [Node.js](https://nodejs.org/) (v14 or higher recommended) and ensure npm is available.
2. **Clone the Repo:**

   ```bash
   git clone https://github.com/rzupa88/RFP_Helper.git
   cd RFP_Helper
   ```
3. **Install Dependencies:**

   ```bash
   npm install
   ```
4. **Create a `.env` File:** As described in the [Configuration](#configuration) section, create a `.env` file with your `DATABASE_URL`.
5. **Start the Server:**

   ```bash
   npm start
   ```

   For development, you can alternatively run:

   ```bash
   npm run dev
   ```
6. **Access the App:** Open your web browser and go to `http://localhost:3000/`. The landing page will be the file upload form. To manage Q\&A entries, navigate to `http://localhost:3000/admin`.

## Project Structure

An overview of the project directory:

```
RFP_Helper/
├── .devcontainer/
│   └── devcontainer.json   # Codespaces configuration (Node 20)
├── public/
│   ├── upload.html         # File upload interface (served at /)
│   └── admin.html          # Admin Panel for Q&A management (served at /admin)
├── src/
│   ├── index.js            # Main Express server and route handlers
│   ├── db.js               # Supabase Postgres database initialization and pool
│   ├── supabase.js         # Supabase client configuration (not yet fully used)
│   └── uploads/            # Directory where uploaded files are saved
├── scripts/
│   └── testInsert.js       # Sample script to insert a test Q&A into the database
├── package.json            # Project metadata and dependencies
├── .env (example)          # Environment variables (to be created locally)
└── README.md
```

## Future Roadmap

* **AI Chatbot Integration:** Complete the chatbot module that uses the Q\&A library to answer user queries. If a query has no matching answer, the chatbot will prompt users to add a new Q\&A entry.
* **Document Parsing:** Automatically extract text from uploaded files (PDF, DOCX, etc.) to generate or suggest Q\&A entries.
* **Edit Q\&A Entries:** Enable editing of existing questions and answers in the Admin Panel.
* **User Authentication:** Add a login system so that only authorized users can manage the Q\&A library or upload documents.
* **Advanced Search:** Implement full-text search, tagging, and more advanced filtering for the Q\&A entries.
* **Enhanced UI:** Improve the frontend design and responsiveness, and possibly switch to a modern framework (e.g. React) for dynamic functionality.

Contributions, suggestions, and pull requests are welcome as RFP Helper evolves!

## License

RFP Helper is open source and distributed under the **ISC License**. See the [ISC license](https://opensource.org/licenses/ISC) for details.
