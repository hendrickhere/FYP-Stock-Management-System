import React, { createContext, useContext, useReducer } from 'react';

const PurchaseOrderContext = createContext();

const initialState = {
  currentOrder: null,
  processingStage: null,
  pendingProducts: [],
  validationErrors: [],
  isProcessing: false,
  processedData: null  
};

function purchaseOrderReducer(state, action) {
  switch (action.type) {
    case 'SET_STATUS':
    // Validate status transition
    if (action.payload === 'delivered' && state.status !== 'pending') {
      throw new Error('Order must be pending before delivery');
    }
    
    return {
      ...state,
      status: action.payload,
      stockUpdated: action.payload === 'delivered'
    };
    case 'SET_PROCESSING_STAGE':
      return {
        ...state,
        processingStage: action.payload.stage,
        currentStep: action.payload.currentStep,
        processedData: action.payload.processedData  
      };
    case 'SET_PENDING_PRODUCTS':
      return {
        ...state,
        pendingProducts: action.payload
      };
    case 'SET_STOCK_ISSUES':
      return {
        ...state,
        stockIssues: action.payload
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