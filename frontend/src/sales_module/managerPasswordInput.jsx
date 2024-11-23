import React from 'react';

const ManagerPasswordInput = ({ value, onChange, error }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Enter manager password to confirm
      </label>
      <input
        type="password"
        className={`w-full px-3 py-2 border rounded-md ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        placeholder="Manager password"
        onChange={onChange}
        value={value}
        autoComplete="new-password"
        name={`manager-pwd-${Math.random()}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default ManagerPasswordInput;