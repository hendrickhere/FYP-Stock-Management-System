import React, { useState } from 'react';
import { Send, Search, X } from 'lucide-react';

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

const Input = ({ onSend, disabled }) => {
  const [text, setText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleInputChange = e => {
    setText(e.target.value);
  };

  const handleSend = e => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText("");
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (query) => {
    setShowSuggestions(false);
    onSend(query);
  };

  const handleKeyPress = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="relative px-2 sm:px-4 py-2 sm:py-3">
      <form onSubmit={handleSend} className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setShowSuggestions(!showSuggestions)}
          className={`p-1.5 sm:p-2 transition-colors ${
            disabled ? 'text-gray-300' : 'text-gray-400 hover:text-purple-600'
          }`}
          disabled={disabled}
        >
          <Search className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        <input
          type="text"
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          value={text}
          disabled={disabled}
          placeholder={disabled ? "Bot is offline..." : "Ask about your inventory..."}
          className={`flex-1 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-full 
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white
            ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-100'}
          `}
        />
        
        <button 
          type="submit"
          className={`p-1.5 sm:p-2 rounded-full transition-colors ${
            !disabled && text.trim() 
              ? 'text-purple-600 hover:bg-purple-50' 
              : 'text-gray-300'
          }`}
          disabled={disabled || !text.trim()}
        >
          <Send className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
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