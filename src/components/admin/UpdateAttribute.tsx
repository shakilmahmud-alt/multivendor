import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Box } from 'lucide-react';
import { useToast } from '../ToastContext';
import { SketchPicker } from 'react-color';

export default function UpdateAttribute() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'en' | 'bd'>('en');
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [valueInput, setValueInput] = useState('');
  const [colorCodes, setColorCodes] = useState<string[]>(['#000000']);
  const [activeColorIndex, setActiveColorIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAttribute();
  }, [id]);

  const fetchAttribute = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) {
        setName(data.name);
        setValues(data.values || []);
      }
    } catch (err) {
      console.error('Error fetching attribute:', err);
      showToast('Failed to load attribute details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Attribute name is required', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('product_attributes')
        .update({ name, values })
        .eq('id', id);
        
      if (error) throw error;
      
      showToast('Attribute updated successfully!');
      navigate('/admin/product-attributes');
    } catch (err) {
      console.error('Error updating attribute:', err);
      showToast('Failed to update attribute', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    fetchAttribute();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  const getColorStyle = (codes: string[]) => {
    if (codes.length === 1) return { backgroundColor: codes[0] };
    if (codes.length === 2) return { background: `linear-gradient(90deg, ${codes[0]} 50%, ${codes[1]} 50%)` };
    let gradient = [];
    let step = 100 / codes.length;
    for(let i=0; i<codes.length; i++) {
      gradient.push(`${codes[i]} ${i*step}% ${(i+1)*step}%`);
    }
    return { background: `conic-gradient(${gradient.join(', ')})` };
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Box className="w-5 h-5 text-brand-500" />
        <h1 className="text-lg font-bold text-slate-800">Update attribute</h1>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200">
        <div className="p-6">
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => setActiveTab('en')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'en' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              English (EN)
            </button>
            <button
              onClick={() => setActiveTab('bd')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'bd' 
                  ? 'border-blue-500 text-blue-500' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Bangla (BD)
            </button>
          </div>

          <form onSubmit={handleUpdate}>
            <div className="mb-6">
              <label className="block text-sm text-slate-600 mb-2">
                Attribute Name ({activeTab === 'en' ? 'EN' : 'BD'})
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Attribute Name"
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm text-slate-600 mb-2">
                Attribute Values
              </label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  {values.map((val, idx) => {
                    const isColor = name.toLowerCase() === 'color';
                    let colorName = val;
                    let codes: string[] = [];
                    if (isColor && val.includes(' - #')) {
                      const parts = val.split(' - ');
                      colorName = parts[0];
                      codes = parts[1].split(',');
                    }
                    
                    return (
                      <span key={idx} className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {isColor && codes.length > 0 && (
                          <span className="w-4 h-4 rounded-full border border-slate-300" style={getColorStyle(codes)} />
                        )}
                        {colorName}
                        <button type="button" onClick={() => setValues(values.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-red-500">&times;</button>
                      </span>
                    )
                  })}
                </div>
                
                {name.toLowerCase() === 'color' && (
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                    <span className="text-xs font-semibold text-slate-600">Selected Colors:</span>
                    {colorCodes.map((c, i) => (
                      <div key={i} className="flex flex-col gap-1 items-center relative group">
                        <div
                          onClick={() => setActiveColorIndex(activeColorIndex === i ? null : i)}
                          className="w-8 h-8 p-0.5 bg-white border border-slate-300 rounded cursor-pointer"
                        >
                          <div className="w-full h-full rounded-sm shadow-inner" style={{ backgroundColor: c }} />
                        </div>
                        {activeColorIndex === i && (
                          <div className="absolute top-10 z-50 shadow-xl">
                            <div className="fixed inset-0" onClick={() => setActiveColorIndex(null)} />
                            <div className="relative">
                              <SketchPicker
                                color={c}
                                onChange={(color) => {
                                  const newCodes = [...colorCodes];
                                  newCodes[i] = color.hex;
                                  setColorCodes(newCodes);
                                }}
                                disableAlpha={true}
                              />
                            </div>
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{c}</span>
                        {colorCodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setColorCodes(colorCodes.filter((_, idx) => idx !== i))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setColorCodes([...colorCodes, '#000000'])}
                      className="w-8 h-8 flex items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition mb-4"
                      title="Add another color to this value"
                    >
                      +
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = valueInput.trim();
                        if (val) {
                          const finalVal = name.toLowerCase() === 'color' ? `${val} - ${colorCodes.join(',')}` : val;
                          if (!values.includes(finalVal)) {
                            setValues([...values, finalVal]);
                            setValueInput('');
                          }
                        }
                      }
                    }}
                    placeholder="Type value (e.g. Red & Blue) and press Add or Enter"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = valueInput.trim();
                      if (val) {
                        const finalVal = name.toLowerCase() === 'color' ? `${val} - ${colorCodes.join(',')}` : val;
                        if (!values.includes(finalVal)) {
                          setValues([...values, finalVal]);
                          setValueInput('');
                        }
                      }
                    }}
                    className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded hover:bg-slate-300 transition"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-slate-400">Add values that will be available when selecting this attribute in products.</p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded hover:bg-slate-200 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
