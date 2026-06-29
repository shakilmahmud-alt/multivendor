import React, { useState } from 'react';
import OrderTransactionsTab from './OrderTransactionsTab';
import ExpenseTransactionsTab from './ExpenseTransactionsTab';
import RefundTransactionsTab from './RefundTransactionsTab';
import { FileText } from 'lucide-react';

export default function TransactionReport() {
  const [activeTab, setActiveTab] = useState('Order Transactions');

  const renderTab = () => {
    switch(activeTab) {
      case 'Order Transactions':
        return <OrderTransactionsTab />;
      case 'Expense Transactions':
        return <ExpenseTransactionsTab />;
      case 'Refund Transactions':
        return <RefundTransactionsTab />;
      default:
        return <OrderTransactionsTab />;
    }
  };

  return (
    <div className="p-6 font-sans bg-slate-50 min-h-screen text-slate-800">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h1 className="text-xl font-bold">Transaction Report</h1>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-200">
          {['Order Transactions', 'Expense Transactions', 'Refund Transactions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm transition ${
                activeTab === tab
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-0">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
