import React, { useState, useRef } from 'react';
import { Send, Search, X, Upload, FileText, Image } from 'lucide-react';
import { Alert } from '../ui/alert';

const SUGGESTED_QUERIES = [
  {
    category: "Stock Levels",
    queries: [
      "Show me low stock items",
      "What products need reordering?",
      "Show total inventory value"
    ]
  },
  {
    category: "Expiry Tracking",
    queries: [
      "Show expiring products",
      "Which items expire this month?",
      "Show all expiry dates"
    ]
  },
  {
    category: "Analytics",
    queries: [
      "Show stock distribution by manufacturer",
      "What's our current inventory value?",
      "Show recent stock movements"
    ]
  }
];

const ALLOWED_FILE_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'application/pdf': true
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const Input = ({ onSend, disabled, onFileUpload }) => {
  const [text, setText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleInputChange = e => {
    setText(e.target.value);
  };

  const validateFile = (file) => {
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return "File type not supported. Please upload PDF or images (JPG, PNG)";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 2MB limit";
    }
    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

  const error = validateFile(file);
    if (error) {
      setFileError(error);
      setSelectedFile(null);
      return;
    }

    setFileError("");
    setSelectedFile(file);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if ((!text.trim() && !selectedFile) || disabled) return;

    if (selectedFile) {
      onFileUpload?.(selectedFile);
      setSelectedFile(null);
      fileInputRef.current.value = '';
    }
    
    if (text.trim()) {
      // Include any selected category as context
      onSend(text, {
        category: selectedCategory,
        suggestions: showSuggestions
      });
      setText("");
    }
    setShowSuggestions(false);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSuggestionClick = (query) => {
    setShowSuggestions(false);
    onSend(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const renderFilePreview = () => {
    if (!selectedFile) return null;

    return (
      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
        {selectedFile.type === 'application/pdf' ? (
          <FileText className="w-4 h-4 text-blue-500" />
        ) : (
          <Image className="w-4 h-4 text-blue-500" />
        )}
        <div className="flex flex-col flex-1">
          <span className="text-sm text-gray-600 truncate">{selectedFile.name}</span>
          <span className="text-xs text-gray-400">
            {(selectedFile.size / 1024).toFixed(1)}KB
            {selectedFile.type === 'application/pdf' ? ' • PDF' : ' • Image'}
          </span>
        </div>
        <button
          type="button"
          onClick={removeFile}
          className="ml-auto text-gray-400 hover:text-gray-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

 return (
  <div className="relative px-2 sm:px-3 py-1.5 sm:py-2"> 
    <form onSubmit={handleSend} className="flex flex-col gap-1.5">
        {(selectedFile || fileError) && (
          <div className="px-2">
            {fileError ? (
              <Alert variant="destructive" className="text-sm">
                {fileError}
              </Alert>
            ) : (
              renderFilePreview()
            )}
          </div>
        )}

      <div className="flex items-center gap-1 sm:gap-1.5"> 
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className={`p-1 sm:p-1.5 transition-colors ${  
            disabled ? 'text-gray-300' : 'text-gray-400 hover:text-purple-600'
          }`}
          disabled={disabled}
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <textarea
            rows="1"
            onChange={(e) => setText(e.target.value)}
            value={text}
            disabled={disabled}
            placeholder={disabled ? "Bot is offline..." : "Ask about your inventory..."}
            onKeyDown={handleKeyPress}
            className={`flex-1 px-3 sm:px-3 py-1 sm:py-1.5 text-sm rounded-full
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white
              overflow-x-hidden whitespace-normal break-words resize-none
              ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-100'}
            `}
            style={{ minHeight: '32px' }}
          />

          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-1 sm:p-1.5 transition-colors relative group ${
                disabled ? 'text-gray-300' : 'text-gray-400 hover:text-purple-600'
              }`}
              disabled={disabled}
            >
              <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Upload PDF or Image
              </span>
            </button>
          </div>
          
          <button 
            type="submit"
            className={`p-1 sm:p-1.5 rounded-full transition-colors ${
              !disabled && (text.trim() || selectedFile)
                ? 'text-purple-600 hover:bg-purple-50' 
                : 'text-gray-300'
            }`}
            disabled={disabled || (!text.trim() && !selectedFile)}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </form>

      {/* Suggestions Panel */}
      {showSuggestions && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border p-4 max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-700">Suggested Queries</h3>
            <button 
              onClick={() => setShowSuggestions(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {SUGGESTED_QUERIES.map((category) => (
              <button
                key={category.category}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.category ? null : category.category
                )}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors
                  ${selectedCategory === category.category
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {category.category}
              </button>
            ))}
          </div>

          {/* Query Lists */}
          <div className="space-y-4">
            {SUGGESTED_QUERIES
              .filter(category => !selectedCategory || category.category === selectedCategory)
              .map((category) => (
                <div key={category.category}>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    {category.category}
                  </h4>
                  <div className="space-y-1">
                    {category.queries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(query)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 
                          rounded-lg transition-colors text-gray-700 hover:text-purple-600"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
            ))}
          </div>

          {/* Quick Tips */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-500">
              Tip: Click on a suggestion or type your own query about inventory, stock levels, or expiry dates
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Input;