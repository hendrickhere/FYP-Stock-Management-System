import React, { createContext, useContext, useReducer } from 'react';

const PurchaseOrderContext = createContext();

const initialState = {
  currentOrder: null,
  processingStage: null,
  pendingProducts: [],
  stockIssues: [],
  validationErrors: [],
  isProcessing: false
};

function purchaseOrderReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_ORDER':
      return {
        ...state,
        currentOrder: action.payload,
        processingStage: 'initial_review'
      };
    
    case 'ADD_PENDING_PRODUCTS':
      return {
        ...state,
        pendingProducts: action.payload,
        processingStage: 'adding_products'
      };
    
    case 'SET_STOCK_ISSUES':
      return {
        ...state,
        stockIssues: action.payload,
        processingStage: 'resolving_stock'
      };
    
    case 'SET_PROCESSING_STAGE':
      return {
        ...state,
        processingStage: action.payload
      };
    
    case 'SET_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: action.payload
      };
    
    case 'SET_PROCESSING':
      return {
        ...state,
        isProcessing: action.payload
      };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
}

export function PurchaseOrderProvider({ children }) {
  const [state, dispatch] = useReducer(purchaseOrderReducer, initialState);

  return (
    <PurchaseOrderContext.Provider value={{ state, dispatch }}>
      {children}
    </PurchaseOrderContext.Provider>
  );
}

export function usePurchaseOrder() {
  const context = useContext(PurchaseOrderContext);
  if (!context) {
    throw new Error('usePurchaseOrder must be used within a PurchaseOrderProvider');
  }
  return context;
}