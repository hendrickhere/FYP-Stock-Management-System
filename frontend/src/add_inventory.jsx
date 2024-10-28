import React, { useState, useContext, useEffect } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import DragDropImageUploader from "./dragDropImageUploader";
import DimensionsInput from "./dimensions_input";
import axios from 'axios';
import { GlobalContext } from "./globalContext";
import { useLocation, useNavigate } from 'react-router-dom';

function AddInventory() {
  const location = useLocation()
  const {inventoryuuid, isAdd} = location.state;
  const {username} = useContext(GlobalContext);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchData = async () => {
      try{
        const response = await axios.get(`http://localhost:3002/api/user/${username}/${inventoryuuid}`);
        setData(response.data.status);
      } catch (error){
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    if(!isAdd){
      fetchData();
    } else{
      setLoading(false);
    }
  }, []);
  return (
    <div className="appointments-container">
      <Header />
      <Sidebar />
      {!loading && (<MainContent data={isAdd ? {} : data} isAdd={isAdd}/>)}
    </div>
  );
}

function MainContent({data, isAdd}) {
  const navigation = useNavigate();
  const {username} = useContext(GlobalContext);

  function handleNameChange(event) {
    setInventoryName(() => event.target.value);
  }

  function handleSkuChange(event) {
    setSkuNumber(() => event.target.value);
  }

  function handleUnitChange(event) {
    setUnit(() => event.target.value);
  }

  function handleManufacturerChange(event){
    setManufacturer(() => event.target.value);
  }

  function handleWeightChange(event){
    setWeight(() => event.target.value)
  }

  function handleWeightUnitChange(event){
    setWeightUnit(() => event.target.value)
  }

  function handleBrandChange(event){
    setBrand(() => event.target.value);
  }

  function handlePriceChange(event){
    setPrice(() => event.target.value);
  }

  const [inventoryName, setInventoryName] = useState(isAdd ? "" : data.product_name);
  const [skuNumber, setSkuNumber] = useState(isAdd ? "" : data.sku_number);
  const [unit, setUnit] = useState(isAdd ? "none" : data.unit);
  const [images, setImages] = useState([]);
  const [height, setHeight] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [brand, setBrand] = useState("");
  const [weight, setWeight] = useState("");
  const [isExpiryChecked, setIsExpiryChecked] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [dimensionsUnit, setDimensionsUnit] = useState("cm");
  const [quantity, setQuantity] = useState("");

  const handleExpiryCheckboxChange = (e) => {
    setIsExpiryChecked(e.target.checked);
    setExpiryDate(() => null);
  };

  function handleExpiryDateChange(e) {
    setExpiryDate(() => e.target.value);
  }

  function handleDescriptionChange(e){
    setDescription(() => e.target.value);
  }

  function handleQuantityChange(e){
    if(e.target.value < 0){
      return;
    }
    setQuantity(() => e.target.value);
  }

  async function extractBase64Strings(images) {
    const base64Promises = images.map((image) => {
        if (typeof image[0] === "string" || image[0] instanceof String) {
            return image[0];
        } else if (image.base64 instanceof Promise) {
            return image.base64;
        }
    });

    const base64Strings = await Promise.all(base64Promises);

    return base64Strings;
}

  function handleCancelClick(){
    const exit = window.confirm(
      "Discard Changes?"
    )
    if(exit){
      navigation(-1);
    } else return;
  }
  async function handleSubmit(e){
    const imageStore = await extractBase64Strings(images);
    const obj = {
      productName: inventoryName, 
      productStockk: quantity,
      skuNumber: skuNumber, 
      unit: unit,
      brand: brand, 
      dimensions: `${height} x ${width} x ${length}`,
      dimensionsUnit: dimensionsUnit, 
      manufacturer: manufacturer,
      weight: weight, 
      weightUnit: weightUnit, 
      isExpiryGoods: isExpiryChecked, 
      expiryDate: expiryDate, 
      price: price, 
      description: description,
      images:{
        "images": imageStore
      }
    };

    try{
      axios.post(
        `http://localhost:3002/api/user/${username}/addInventory`,
        obj
      ).then(() => {
        window.alert("Inventory added successfully");
        navigation(-1);
      });
    } catch (err){
      console.log(err.response.data);
      throw err; 
    }
  }


  return (
    <div className="ml-52 h-auto overflow-auto">
      <div className="flex ms-5 mb-2 me-5 mt-5">
        <p className="flex-1 font-bold text-3xl ms-5" type="submit">
          Add Inventory
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex">
          <div className="flex-1 flex-column ml-[35px] mr-[35px]">
            <div className="mb-7 shadow-lg px-5 py-5 rounded-md">
              <h2 className="font-semibold mb-2 text-[#353535] text-2xl">
                General Information
              </h2>
              <h3 className="font-normal text-[#777980] text-base">
                Product Name
              </h3>
              <input
                id="product-name"
                className="mb-2 h-8 w-full border-2 me-4 border-border-grey ps-2 rounded-lg"
                type="text"
                placeholder=""
                value={inventoryName}
                onChange={handleNameChange}
              />
              <h3 className="font-normal text-[#777980] text-base">
                SKU Number
              </h3>
              <input
                id="sku-number"
                className="mb-2 h-8 w-full border-2 me-4 border-border-grey ps-2 rounded-lg"
                type="text"
                placeholder=""
                value={skuNumber}
                onChange={handleSkuChange}
              />
              <h3 className="font-normal text-[#777980] text-base">Unit</h3>
              <select
                id="unit"
                className="block w-full px-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 overflow-auto h-8"
                value={unit}
                onChange={handleUnitChange}
              >
                <option value="none"></option>
                <option value="cm">cm</option>
                <option value="box">box</option>
                <option value="dz">dz</option>
                <option value="ft">ft</option>
                <option value="g">g</option>
                <option value="in">in</option>
                <option value="kg">kg</option>
                <option value="km">km</option>
                <option value="ml">ml</option>
                <option value="mg">mg</option>
                <option value="pcs">pcs</option>
                <option value="lb">lb</option>
                <option value="m">m</option>
              </select>
            </div>
          </div>

          <div className="flex-1 mb-7 shadow-lg px-5 py-2 rounded-md mr-[35px]">
            <h2 className="font-semibold mb-2 text-[#353535] text-2xl mb-2">
              Media
            </h2>
            <h3 className="font-normal text-[#777980] text-base">Photo</h3>
            <DragDropImageUploader
              images={images}
              setImages={setImages}
              isAdd={isAdd}
            />
            <span className="text-md font-light">
              A maximum of 5 images can be uploaded, each not exceeding 10mb
            </span>
          </div>
        </div>
        <div className="flex ml-[35px] mr-[35px] mb-7 shadow-lg px-5 py-5 rounded-md">
          <div className="flex-1">
            <h2 className="font-semibold mb-2 text-[#353535] text-2xl">
              Product Information
            </h2>
            <h3 className="font-normal text-[#777980] text-base">Dimensions</h3>
            <DimensionsInput
              height={height}
              width={width}
              length={length}
              dimensionsUnit = {dimensionsUnit}
              setHeight={setHeight}
              setWidth={setWidth}
              setLength={setLength}
              setDimensionsUnit={setDimensionsUnit}
            />
            <h3 className="font-normal text-[#777980] text-base">
              Manufacturer
            </h3>
            <input
              id="manufacturer"
              className="mb-2 h-8 w-full border-2 me-4 border-border-grey ps-2 rounded-lg"
              type="text"
              placeholder=""
              value={manufacturer}
              onChange={handleManufacturerChange}
            />
            <div className="flex flex-col items-start space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isExpiryChecked}
                  onChange={handleExpiryCheckboxChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span>Is Expiry Goods?</span>
              </label>
              {isExpiryChecked && (
                <input
                  type="date"
                  className="flex content-center justify-center mt-2 p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300 w-60"
                  value={expiryDate}
                  onChange={handleExpiryDateChange}
                />
              )}
            </div>
          </div>
          <div className="flex-1 ml-[35px]">
            <h3 className="font-normal text-[#777980] text-base mt-[40px]">
              Weight
            </h3>
            <div className="flex mt-[2px] flex-row">
              <input
                id="weight"
                className=" mb-2 h-10 w-full border-2 me-4 border-border-grey ps-2 rounded-lg"
                type="number"
                placeholder=""
                value={weight}
                onChange={handleWeightChange}
              />
              <select className=" ml-2 h-10 px-3 border border-gray-300 rounded-md focus:outline-none"
              value={weightUnit}
              onChange={handleWeightUnitChange}>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="lb">lb</option>
                <option value="oz">oz</option>
              </select>
            </div>

            <h3 className="font-normal text-[#777980] text-base">Brand</h3>
            <input
              id="brand"
              className="h-8 w-full border-2 me-4 border-border-grey ps-2 rounded-lg"
              type="text"
              placeholder=""
              value={brand}
              onChange={handleBrandChange}
            />
          </div>
        </div>
        <div className="flex pb-[70px]">
          <div className="flex-1 flex-column ml-[35px] mr-[35px]">
            <div className="mb-7 shadow-lg px-5 py-5 rounded-md">
              <h2 className="font-semibold mb-2 text-[#353535] text-2xl">
                Selling Information
              </h2>
              <h3 className="font-normal text-[#777980] text-base">
                Selling Price
              </h3>
              <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-full max-w-md h-8">
                <span className="px-3 py-2 bg-gray-100 border-r border-gray-300 text-gray-700">
                  MYR
                </span>
                <input
                  id="selling-price"
                  className="h-full w-full ps-2 rounded-lg"
                  type="number"
                  placeholder=""
                  value={price}
                  onChange={handlePriceChange}
                />
              </div>
              <h3 className="font-normal text-[#777980] text-base">
                Stock Quantity
              </h3>
              <input
              id="quantity"
              className="h-8 border-2 me-4 border-border-grey ps-2 rounded-lg"
              type="number"
              placeholder=""
              value={quantity}
              onChange={handleQuantityChange}
            />
              <div className="flex-col mt-[10px] flex items-start space-y-2 w-full max-w-lg">
                <label className="pt-2 text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  className="h-36 p-3 text-sm border border-gray-300 rounded resize-none border border-gray-300 rounded-md focus:outline-none focus:ring focus:border-blue-300 w-full"
                  rows="4"
                  value={description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter your description here"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 mb-7 shadow-lg px-5 py-2 rounded-md mr-[35px] hidden">
          </div>
        </div>
      </form>
      <BottomBar handleSubmit={handleSubmit} handleCancelClick={handleCancelClick}/>
    </div>
  );
}

const BottomBar = (props) => {
  const {handleSubmit, handleCancelClick} = props;
  
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 p-4 flex justify-start space-x-2 ml-[215px]">
      <button className="bg-blue-500 text-white px-4 py-2 rounded-md" type="submit" onClick={handleSubmit}>Save</button>
      <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md" type="button" onClick={handleCancelClick}>Cancel</button>
    </div>
  );
};

export default AddInventory;
