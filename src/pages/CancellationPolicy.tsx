import React from 'react';

export default function CancellationPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 font-sans text-slate-800">
      <h1 className="text-3xl font-black text-center mb-8">Cancellation Policy</h1>

      <div className="bg-white border rounded-lg p-8 shadow-sm space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2">CANCELLATION POLICY (DEMO)</h2>
          <p className="text-sm mb-1"><strong>Platform:</strong> multivendor.holidaymart.com</p>
          <p className="text-sm mb-4"><strong>Operated By:</strong> N. I. Biz Soft</p>
          <p>This Cancellation Policy explains the rules and conditions under which orders placed on <strong>multivendor.holidaymart.com</strong> (the "Platform") may be cancelled. By placing an order on the Platform, you agree to this Cancellation Policy along with our Terms & Conditions, Privacy Policy, and other related policies.</p>
        </div>

        <section>
          <h3 className="text-lg font-bold border-b pb-2 mb-4">ROLE OF THE PLATFORM</h3>
          <p className="mb-4">multivendor.holidaymart.com is a <strong>multi-vendor eCommerce marketplace</strong> operated by <strong>N. I. Biz Soft</strong>. The Platform acts only as a <strong>technology facilitator</strong> between Buyers and independent Sellers (Vendors).</p>
          <p>All commercial terms, including product availability, delivery timelines, and order fulfillment, are determined by the respective Vendors.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold border-b pb-2 mb-4">ORDER CANCELLATION BY PLATFORM / VENDOR</h3>
          <p className="mb-2">The Platform or Vendor reserves the right to cancel any order at any time due to, but not limited to, the following reasons:</p>
          <ul className="list-disc pl-5 mt-2 mb-4 space-y-2">
            <li>Product out of stock or unavailable</li>
            <li>Vendor operational issues</li>
            <li>Delivery address outside service coverage area</li>
            <li>Incorrect pricing or listing errors</li>
            <li>Unavoidable or force majeure circumstances</li>
          </ul>
          <p>In such cases, any paid amount (if applicable) will be handled according to the Platform's Refund Policy and payment gateway rules.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold border-b pb-2 mb-4">ORDER CANCELLATION BY CUSTOMER</h3>
          <ul className="list-disc pl-5 mt-2 mb-4 space-y-2">
            <li>Customers may request order cancellation <strong>only before the order is confirmed or dispatched</strong>, subject to Vendor acceptance.</li>
            <li>Once an order has been <strong>processed, packed, or shipped</strong>, cancellation requests may not be accepted.</li>
            <li>Orders that are <strong>out for delivery or delivered</strong> cannot be cancelled.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold border-b pb-2 mb-4">DELIVERY FAILURE & NON-ACCEPTANCE</h3>
          <p className="mb-2">If an order cannot be delivered due to:</p>
          <ul className="list-disc pl-5 mt-2 mb-4 space-y-2">
            <li>Incorrect address provided by the customer</li>
            <li>Customer unavailability</li>
            <li>Failure to provide proper delivery instructions</li>
          </ul>
          <p>the order may be treated as <strong>successfully delivered</strong>, and <strong>no cancellation or refund</strong> will be applicable.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold border-b pb-2 mb-4">PAYMENT & REFUND</h3>
          <ul className="list-disc pl-5 mt-2 mb-4 space-y-2">
            <li>Refunds (if applicable) will be processed through the original payment method.</li>
            <li>Processing time depends on the payment gateway or financial institution.</li>
            <li>N. I. Biz Soft does not guarantee instant refunds.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-bold border-b pb-2 mb-4">MODIFICATIONS TO POLICY</h3>
          <p>N. I. Biz Soft reserves the right to modify or update this Cancellation Policy at any time. Changes will be effective immediately upon posting on the Platform. Continued use of the Platform constitutes acceptance of the revised policy.</p>
        </section>

        <section>
          <h3 className="text-lg font-bold border-b pb-2 mb-4">DISCLAIMER</h3>
          <p>This is a <strong>demo Cancellation Policy</strong> for <strong>multivendor.holidaymart.com</strong>, a product of <strong>N. I. Biz Soft</strong>, created for demonstration and testing purposes only.</p>
        </section>
      </div>
    </div>
  );
}
