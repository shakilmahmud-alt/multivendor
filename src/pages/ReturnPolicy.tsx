import React from 'react';

export default function ReturnPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-slate-800">
      <h1 className="text-3xl font-black text-center mb-8">Return Policy</h1>
      
      <div className="bg-white border rounded-lg p-8 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Return & Replacement Policy (Stationery Items)</h2>
        <p className="mb-6">Due to the nature of stationery products, we maintain a <strong>strict no-return policy</strong>.</p>
        
        <h3 className="text-xl font-bold mb-4 text-red-500 flex items-center gap-2">
          <span>❌</span> No Returns
        </h3>
        <p className="mb-4">Once an order has been <strong>delivered and accepted</strong>, returns will <strong>not</strong> be accepted under any circumstances.</p>
        <p className="mb-2">Returns will <strong>not</strong> be allowed for:</p>
        <ul className="list-disc pl-5 mt-2 mb-6 space-y-2">
          <li>Change of mind after purchase</li>
          <li>Incorrect product selection by the customer</li>
          <li>Minor differences in color, design, or packaging</li>
          <li>Failure to inspect the product at the time of delivery</li>
        </ul>

        <h3 className="text-xl font-bold mb-4 text-blue-500 flex items-center gap-2">
          <span>🔄</span> Conditional Replacement (Delivery-Time Only)
        </h3>
        <p className="mb-2">A replacement may be considered <strong>only if all of the following conditions are met:</strong></p>
        <ul className="list-disc pl-5 mt-2 mb-6 space-y-2">
          <li>The product is <strong>damaged, defective, or incorrect</strong></li>
          <li>The issue is <strong>reported immediately at the time of delivery</strong></li>
          <li>The product has <strong>not been accepted</strong> by the customer</li>
        </ul>
        
        <p className="font-semibold flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded">
          <span>⚠️</span> Any request made after delivery acceptance will not be eligible for return or replacement.
        </p>
      </div>
    </div>
  );
}
