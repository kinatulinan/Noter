import { ethers } from 'ethers';

// Simple contract ABI for note storage
const NOTE_CONTRACT_ABI = [
  "function storeNote(string memory content, string memory title) public returns (uint256)",
  "function getNote(uint256 noteId) public view returns (string memory title, string memory content, address author, uint256 timestamp)",
  "function getUserNotes(address user) public view returns (uint256[] memory)",
  "event NoteStored(uint256 indexed noteId, address indexed author, string title)"
];

// Mock contract address - in production, deploy actual contract
const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890";

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isConnected = false;
  }

  async connectWallet() {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();
        
        // For demo purposes, we'll simulate blockchain functionality
        this.isConnected = true;
        
        return {
          success: true,
          address: await this.signer.getAddress()
        };
      } else {
        throw new Error('MetaMask not installed');
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async storeNoteOnBlockchain(title, content) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      // Simulate blockchain transaction
      const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
      const mockNoteId = Math.floor(Math.random() * 1000000);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        transactionHash: mockTxHash,
        noteId: mockNoteId,
        gasUsed: '21000'
      };
    } catch (error) {
      console.error('Blockchain storage failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getNoteFromBlockchain(noteId) {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      // Simulate blockchain read
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        note: {
          title: `Blockchain Note ${noteId}`,
          content: `This note is stored on blockchain with ID: ${noteId}`,
          author: await this.signer?.getAddress() || '0x0000',
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Blockchain read failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUserNotes() {
    try {
      if (!this.isConnected) {
        throw new Error('Wallet not connected');
      }

      // Simulate getting user's blockchain notes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockNoteIds = [1, 2, 3].map(() => Math.floor(Math.random() * 1000000));
      
      return {
        success: true,
        noteIds: mockNoteIds
      };
    } catch (error) {
      console.error('Failed to get user notes:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isConnected = false;
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      address: this.signer?.address || null
    };
  }
}

export default new BlockchainService();