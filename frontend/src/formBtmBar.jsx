const BottomBar = (props) => {
    const {handleSubmit, handleCancelClick} = props;
    
    return (
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-300 p-4 flex justify-start space-x-2 ml-[215px]">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md" type="submit" onClick={handleSubmit}>Save</button>
        <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md" type="button" onClick={handleCancelClick}>Cancel</button>
      </div>
    );
  };

export default BottomBar;