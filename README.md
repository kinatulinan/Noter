# Noter - Blockchain-Powered Note Taking App

A full-stack web application that allows users to create, read, update, and delete notes using their crypto wallet for authentication. Built with React, Spring Boot, and Supabase.

## Features

- 🔐 **Wallet-based Authentication**: Connect with MetaMask or compatible wallets
- 📝 **CRUD Operations**: Create, read, update, and delete notes
- 🔒 **Ownership Validation**: Only note owners can modify their notes
- 💾 **Supabase Integration**: Persistent storage in PostgreSQL
- 🎨 **Modern UI**: Responsive design with TailwindCSS
- ⚡ **Real-time Updates**: Immediate UI feedback

## Tech Stack

### Frontend
- React 18 with Vite
- TailwindCSS for styling
- Ethers.js for wallet integration
- MetaMask wallet support

### Backend
- Spring Boot 3.5.6
- Spring Data JPA
- PostgreSQL (via Supabase)
- RESTful API design

### Database
- Supabase PostgreSQL
- UUID primary keys
- Indexed wallet addresses for performance

## Prerequisites

- Node.js 18+ and npm
- Java 17+
- Maven 3.6+
- MetaMask browser extension
- Supabase account

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the following SQL script to create the notes table:

```sql
-- Create the notes table in Supabase
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_wallet_address ON notes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd Backend/Noter
   ```

2. Set environment variables (optional, defaults are provided):
   ```bash
   export SUPABASE_URL="https://jircqxgaupylcjhneinh.supabase.co"
   export SUPABASE_USERNAME="postgres"
   export SUPABASE_DB_PASSWORD="otenbaloten123"
   ```

3. Build and run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
   ```

   The backend will be available at `http://localhost:8080`

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd Frontend/Noter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve the connection in MetaMask
2. **Create Notes**: Type your note in the text area and click "Create Note"
3. **Edit Notes**: Click the "Edit" button on any of your notes
4. **Delete Notes**: Click the "Delete" button on any of your notes
5. **Disconnect**: Click "Disconnect" to log out

## API Endpoints

### Notes API

- `POST /api/notes` - Create a new note
  - Headers: `X-Wallet-Address: <wallet_address>`
  - Body: `{ "text": "note content" }`

- `GET /api/notes/{walletAddress}` - Get all notes for a wallet
  - Returns: Array of note objects

- `PUT /api/notes/{id}` - Update a note
  - Headers: `X-Wallet-Address: <wallet_address>`
  - Body: `{ "text": "updated content" }`

- `DELETE /api/notes/{id}` - Delete a note
  - Headers: `X-Wallet-Address: <wallet_address>`

## Security Features

- **Wallet-based Authentication**: No passwords required
- **Ownership Validation**: Users can only modify their own notes
- **CORS Protection**: Configured for local development
- **Input Validation**: Server-side validation for all inputs

## Project Structure

```
Noter/
├── Backend/
│   └── Noter/
│       ├── src/main/java/com/Noter/Noter/
│       │   ├── controller/NoteController.java
│       │   ├── dto/
│       │   ├── entity/Note.java
│       │   ├── repository/NoteRepository.java
│       │   ├── service/NoteService.java
│       │   └── config/CorsConfig.java
│       └── src/main/resources/application.properties
├── Frontend/
│   └── Noter/
│       ├── src/
│       │   ├── App.jsx
│       │   ├── main.jsx
│       │   └── index.css
│       └── package.json
└── README.md
```

## Environment Variables

### Backend (application.properties)
- `SUPABASE_URL`: Supabase database URL
- `SUPABASE_USERNAME`: Database username
- `SUPABASE_DB_PASSWORD`: Database password

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Ensure MetaMask is installed and unlocked
   - Check if the site is allowed to connect to MetaMask

2. **Backend Connection Error**
   - Verify the backend is running on port 8080
   - Check Supabase credentials in application.properties

3. **CORS Errors**
   - Ensure the frontend is running on localhost:5173
   - Check CORS configuration in CorsConfig.java

### Development Tips

- Use browser developer tools to debug wallet connections
- Check the browser console for API errors
- Monitor the Spring Boot console for backend logs
- Use Supabase dashboard to verify data persistence

## License

This project is for educational purposes. Feel free to use and modify as needed.