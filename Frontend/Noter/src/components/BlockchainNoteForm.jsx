import { useState } from 'react';
import blockchainService from '../services/blockchain';

const BlockchainNoteForm = ({ onNoteStored, isWalletConnected }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isStoring, setIsStoring] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isWalletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and content');
      return;
    }

    setIsStoring(true);
    try {
      const result = await blockchainService.storeNoteOnBlockchain(title, content);
      
      if (result.success) {
        alert(`Note stored on blockchain!\nTransaction Hash: ${result.transactionHash}\nNote ID: ${result.noteId}`);
        setTitle('');
        setContent('');
        onNoteStored?.(result);
      } else {
        alert(`Failed to store note: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsStoring(false);
    }
  };

  return (
    <div className="card p-6 mb-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
        </svg>
        Store Note on Blockchain
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="blockchain-title" className="block text-sm font-medium text-gray-300 mb-2">
            Title
          </label>
          <input
            id="blockchain-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            className="input-field w-full"
            disabled={!isWalletConnected || isStoring}
          />
        </div>
        
        <div>
          <label htmlFor="blockchain-content" className="block text-sm font-medium text-gray-300 mb-2">
            Content
          </label>
          <textarea
            id="blockchain-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter note content..."
            rows={4}
            className="input-field w-full resize-none"
            disabled={!isWalletConnected || isStoring}
          />
        </div>
        
        <button
          type="submit"
          disabled={!isWalletConnected || isStoring || !title.trim() || !content.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStoring ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Storing on Blockchain...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Store on Blockchain
            </>
          )}
        </button>
      </form>
      
      {!isWalletConnected && (
        <div className="mt-4 p-3 bg-yellow-600 bg-opacity-20 border border-yellow-600 rounded-lg">
          <p className="text-yellow-300 text-sm">
            Connect your wallet to store notes on the blockchain
          </p>
        </div>
      )}
    </div>
  );
};

export default BlockchainNoteForm;