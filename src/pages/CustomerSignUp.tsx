import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function CustomerSignUp() {
  const navigate = useNavigate();
  const [signupMethod, setSignupMethod] = useState<'mobile' | 'email'>('mobile');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    referCode: '',
    agreed: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreed) {
      alert("Please agree to the Terms and conditions.");
      return;
    }
    
    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('customers').insert([{
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: signupMethod === 'mobile' ? formData.phone : null,
        email: signupMethod === 'email' ? formData.email : null,
        password: formData.password, // Plain text for prototype
        refer_code: formData.referCode
      }]);

      if (error) throw error;

      alert("Customer Account Created Successfully!");
      navigate('/login?tab=customer');
      
    } catch (err: any) {
      console.error("Signup error:", err);
      alert("Failed to create account. User may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-10 px-4 font-sans">
      
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-sm border border-slate-200 p-8 md:p-12">
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">Sign Up</h1>

        {/* Method Toggle */}
        <div className="flex justify-center mb-8 gap-2">
          <button 
            onClick={() => setSignupMethod('mobile')}
            className={`px-6 py-2.5 text-sm font-medium transition ${signupMethod === 'mobile' ? 'bg-orange-500 text-white rounded shadow-sm' : 'bg-slate-50 text-orange-500 rounded hover:bg-slate-100'}`}
          >
            Sign up with Mobile
          </button>
          <button 
            onClick={() => setSignupMethod('email')}
            className={`px-6 py-2.5 text-sm font-medium transition ${signupMethod === 'email' ? 'bg-orange-500 text-white rounded shadow-sm' : 'bg-slate-50 text-orange-500 rounded hover:bg-slate-100'}`}
          >
            Sign up with Email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
          
          {/* Name Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
              <input 
                type="text" 
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Ex: Doe" 
                className="w-full px-4 py-3 rounded border border-slate-300 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
              <input 
                type="text" 
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Ex: Doe" 
                className="w-full px-4 py-3 rounded border border-slate-300 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
          </div>

          {/* Contact & Password Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {signupMethod === 'mobile' ? (
                <>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Phone Number <span className="text-orange-500 text-[11px] font-normal">(* Country Code Is Must Like For BD 880)</span>
                  </label>
                  <input 
                    type="text" 
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number" 
                    className="w-full px-4 py-3 rounded border border-slate-300 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </>
              ) : (
                <>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Ex: doe@example.com" 
                    className="w-full px-4 py-3 rounded border border-slate-300 focus:outline-none focus:border-orange-500 text-sm"
                  />
                </>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters long" 
                  className="w-full px-4 py-3 rounded border border-slate-300 focus:outline-none focus:border-orange-500 text-sm pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>



          {/* Checkbox */}
          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="agreed" 
              name="agreed"
              checked={formData.agreed}
              onChange={handleChange}
              className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
            />
            <label htmlFor="agreed" className="text-sm text-slate-600 cursor-pointer">
              I agree to Your <span className="text-slate-800 font-medium">Terms and conditions</span>
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded transition shadow-sm"
            >
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
