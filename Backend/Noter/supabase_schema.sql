-- Create the notes table in Supabase
CREATE TABLE IF NOT EXISTS notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on wallet_address for better query performance
CREATE INDEX IF NOT EXISTS idx_notes_wallet_address ON notes(wallet_address);

-- Create an index on created_at for better sorting performance
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- Add a comment to the table
COMMENT ON TABLE notes IS 'Stores user notes associated with wallet addresses';
COMMENT ON COLUMN notes.wallet_address IS 'The wallet address of the note owner';
COMMENT ON COLUMN notes.text IS 'The content of the note';
COMMENT ON COLUMN notes.created_at IS 'Timestamp when the note was created';
