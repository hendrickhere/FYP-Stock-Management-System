import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CiExport } from "react-icons/ci";

const FloatingActionButton = ({ 
  isVisible, 
  onAddProduct, 
  onExport,
  showFullBar = false 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={`fixed bottom-6 right-6 z-50 flex ${
            showFullBar ? 'gap-4' : ''
          }`}
        >
          {showFullBar ? (
            // Full action bar
            <motion.div
              className="flex gap-4 bg-white rounded-lg shadow-lg p-2"
              layout
            >
              <button
                onClick={onAddProduct}
                className="inline-flex items-center justify-center px-4 py-2 bg-white text-green-700 font-medium rounded-lg shadow hover:bg-green-600 hover:text-white"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
              
              <button 
                onClick={onExport}
                className="inline-flex items-center justify-center px-4 py-2 bg-white font-medium rounded-lg shadow"
              >
                <CiExport className="w-5 h-5 mr-2" />
                Export
              </button>
            </motion.div>
          ) : (
            // Compact floating button
            <motion.button
              onClick={onAddProduct}
              className="w-14 h-14 bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </motion.button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FloatingActionButton;