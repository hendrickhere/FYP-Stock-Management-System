import React, { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { GlobalContext } from "./globalContext";
import instance from "./axiosConfig";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";
import DragDropImageUploader from "./dragDropImageUploader";
import Header from "./header";
import Sidebar from "./sidebar";

const AddPurchases = () => {
    return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <Header />
      <div className="flex flex-row flex-grow overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}

const MainContent = () => {
  <div className="flex-auto ml-52 overflow-y-auto pb-20 p-4 custom-scrollbar">
    <div className="max-w-[1400px] mx-auto">
      
    </div>
  </div>
}

export default AddPurchases;