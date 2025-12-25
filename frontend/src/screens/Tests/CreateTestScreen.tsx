import { useState, useEffect } from 'react';
import { 
  ArrowLeft, CheckCircle, ChevronDown, User, Calendar, Phone, Users, 
  Clock, DollarSign, Activity, Stethoscope, FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

// Types (Reused)
interface FormSettings {
    testTypes: { test_code: string; test_name: string; default_cost: number; requires_limb_selection: number }[];
    limbTypes: { limb_code: string; limb_name: string }[];
    staffMembers: { staff_name: string; job_title: string }[];
    paymentMethods: { method_code: string; method_name: string }[];
    referrers: string[];
}

export const CreateTestScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formSettings, setFormSettings] = useState<FormSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
      patient_name: '',
      age: '',
      gender: '', 
      dob: '',
      parents: '',
      relation: '',
      phone_number: '',
      alternate_phone_no: '',
      referred_by: '',
      limb: '',
      receipt_no: '',
      visit_date: new Date().toISOString().split('T')[0],
      assigned_test_date: new Date().toISOString().split('T')[0],
      test_done_by: '',
      total_amount: '',
      advance_amount: '',
      discount: '',
      due_amount: '',
      payment_method: '',
      other_test_name: '' 
  });

  const [selectedTests, setSelectedTests] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadFormSettings();
  }, []);

  const loadFormSettings = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
        const branchId = user?.branch_id || 1;
        const res = await fetch(`${baseUrl}/fetch_form_settings.php?branch_id=${branchId}`);
        const json = await res.json();
        if (json.status === 'success') {
            setFormSettings(json.data);
        }
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const toggleTest = (code: string, defaultCost: number) => {
      const newMap = new Map(selectedTests);
      if (newMap.has(code)) {
          newMap.delete(code);
      } else {
          newMap.set(code, defaultCost);
      }
      setSelectedTests(newMap);
  };

  const updateTestAmount = (code: string, amount: string) => {
      if (!selectedTests.has(code)) return;
      const newMap = new Map(selectedTests);
      newMap.set(code, parseFloat(amount) || 0);
      setSelectedTests(newMap);
  };

  const calculateFinancials = () => {
      let total = 0;
      selectedTests.forEach(amt => total += amt);
      
      const advance = parseFloat(formData.advance_amount) || 0;
      const discount = parseFloat(formData.discount) || 0;
      const due = Math.max(0, total - advance - discount);
      return { total, due };
  };

  const handleSubmit = async () => {
      if (!formData.patient_name || selectedTests.size === 0) {
          alert("Please fill required fields (Name, Select at least one test)");
          return;
      }
      setSubmitting(true);
      try {
        const payload = {
            ...formData,
            branch_id: user?.branch_id || 1,
            employee_id: user?.employee_id,
            username: (user as any)?.username,
            test_names: Array.from(selectedTests.keys()).map((code: string) => {
                if (code === 'other' && formData.other_test_name) return formData.other_test_name;
                const type = formSettings?.testTypes.find(t => t.test_code === code);
                return type ? type.test_name : code;
            }),
            test_amounts: Array.from(selectedTests.entries()).reduce((acc: any, [code, amount]: [string, number]) => {
                let name = code;
                 const type = formSettings?.testTypes.find(t => t.test_code === code);
                 if (type) name = type.test_name;
                 if (code === 'other' && formData.other_test_name) name = formData.other_test_name;
                 
                acc[name] = amount;
                return acc;
            }, {} as any)
        };

        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://prospine.in/admin/mobile/api';
        const res = await fetch(`${baseUrl}/create_test.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.status === 'success') {
            navigate('/tests'); 
        } else {
            alert(json.message || 'Failed to create test');
        }
      } catch (err) {
          alert('Network Error');
      } finally {
          setSubmitting(false);
      }
  };

  const { total, due } = calculateFinancials();

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-violet-500 border-t-transparent"></div></div>;

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900 transition-colors pb-10">
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-sm px-4 py-4 pt-[var(--safe-area-inset-top,32px)] flex items-center gap-3 sticky top-0 z-20 border-b border-gray-100 dark:border-gray-700">
         <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
             <ArrowLeft size={24} />
         </button>
         <div>
             <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">New Test</h1>
             <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mt-0.5">Create a new diagnostic record</p>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 max-w-3xl mx-auto w-full space-y-6 pb-24">
         
         {/* Patient Information Card */}
         <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-gray-700 pb-3">
                 <div className="bg-violet-50 dark:bg-violet-900/20 p-2 rounded-xl text-violet-600 dark:text-violet-400">
                     <User size={20} />
                 </div>
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">Patient Information</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div className="col-span-1 md:col-span-2">
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Patient Name *</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User size={18} /></div>
                         <input 
                            value={formData.patient_name}
                            onChange={e => setFormData({...formData, patient_name: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                            placeholder="Full Name"
                         />
                     </div>
                 </div>

                 <div>
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Age *</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Clock size={18} /></div>
                         <input 
                            value={formData.age}
                            onChange={e => setFormData({...formData, age: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                            placeholder="e.g 25"
                         />
                     </div>
                 </div>

                 <div>
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Gender *</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Users size={18} /></div>
                         <select 
                            value={formData.gender}
                            onChange={e => setFormData({...formData, gender: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-10 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                         >
                             <option value="">Select</option>
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                             <option value="Other">Other</option>
                         </select>
                         <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                     </div>
                 </div>

                 <div>
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Mobile No</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={18} /></div>
                         <input 
                            value={formData.phone_number}
                            onChange={e => setFormData({...formData, phone_number: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                            placeholder="+91..."
                         />
                     </div>
                 </div>

                 <div>
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Parents/Rel.</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Users size={18} /></div>
                         <input 
                            value={formData.parents}
                            onChange={e => setFormData({...formData, parents: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                            placeholder="Guardian Name"
                         />
                     </div>
                 </div>

                 <div className="md:col-span-2">
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Referred By</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Stethoscope size={18} /></div>
                         <input 
                            list="referrers"
                            value={formData.referred_by}
                            onChange={e => setFormData({...formData, referred_by: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                            placeholder="Search Doctor..."
                         />
                         <datalist id="referrers">
                             {formSettings?.referrers.map((r: any) => <option key={r} value={r} />)}
                         </datalist>
                     </div>
                 </div>
             </div>
         </div>


         {/* Test Selection Card */}
         <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-gray-700 pb-3">
                 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                     <Activity size={20} />
                 </div>
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">Test Selection</h3>
             </div>

             <div className="space-y-3">
                 {formSettings?.testTypes.map((test: any) => {
                     const isSelected = selectedTests.has(test.test_code);
                     const isOther = test.test_code === 'other';
                     
                     return (
                         <div 
                             key={test.test_code} 
                             className={`p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                                 isSelected 
                                 ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-900/10' 
                                 : 'border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-700/20 hover:border-violet-200 dark:hover:border-violet-800'
                             }`}
                         >
                             <div className="flex items-start gap-4">
                                 <div 
                                     onClick={() => toggleTest(test.test_code, parseFloat(test.default_cost as any)||0)}
                                     className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 shrink-0 ${
                                         isSelected 
                                         ? 'bg-violet-500 border-violet-500 text-white shadow-lg shadow-violet-500/20' 
                                         : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-800 group-hover:border-violet-400'
                                     }`}
                                 >
                                     {isSelected && <CheckCircle size={14} strokeWidth={3} />}
                                 </div>
                                 
                                 <div className="flex-1">
                                     <div className="flex justify-between items-center mb-1" onClick={() => toggleTest(test.test_code, parseFloat(test.default_cost as any)||0)}>
                                         <label className="text-sm font-black text-gray-800 dark:text-gray-200 cursor-pointer select-none">
                                             {test.test_name}
                                         </label>
                                     </div>
                                     
                                     {isSelected && (
                                          <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200 space-y-3">
                                              {isOther && (
                                                  <input 
                                                      value={formData.other_test_name}
                                                      onChange={e => setFormData({...formData, other_test_name: e.target.value})}
                                                      placeholder="Enter custom test name"
                                                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-bold shadow-sm"
                                                      autoFocus
                                                  />
                                              )}
                                              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-600 w-full sm:w-48 shadow-sm">
                                                  <div className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg text-xs font-bold text-gray-500">IND</div>
                                                  <input 
                                                      type="number"
                                                      value={selectedTests.get(test.test_code) || ''}
                                                      onChange={e => updateTestAmount(test.test_code, e.target.value)}
                                                      className="w-full bg-transparent border-none text-sm font-black text-gray-900 dark:text-white focus:ring-0 p-0"
                                                      placeholder="0.00"
                                                  />
                                              </div>
                                          </div>
                                     )}
                                 </div>
                             </div>
                         </div>
                     );
                 })}
             </div>
         </div>

         {/* Other Details Card */}
         <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
             <div className="flex items-center gap-2 mb-6 border-b border-gray-50 dark:border-gray-700 pb-3">
                 <div className="bg-teal-50 dark:bg-teal-900/20 p-2 rounded-xl text-teal-600 dark:text-teal-400">
                     <FileText size={20} />
                 </div>
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">Details</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Limb</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Activity size={18} /></div>
                         <select 
                            value={formData.limb}
                            onChange={e => setFormData({...formData, limb: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-10 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none"
                         >
                             <option value="">Select Limb</option>
                             {formSettings?.limbTypes.map((l: any) => <option key={l.limb_code} value={l.limb_code}>{l.limb_name}</option>)}
                         </select>
                         <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                     </div>
                 </div>

                 <div>
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Date of Visit</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Calendar size={18} /></div>
                         <input 
                            type="date"
                            value={formData.visit_date}
                            onChange={e => setFormData({...formData, visit_date: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 transition-all"
                         />
                     </div>
                 </div>

                 <div className="md:col-span-2">
                     <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 block ml-1">Test Done By</label>
                     <div className="relative">
                         <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><User size={18} /></div>
                         <select 
                            value={formData.test_done_by}
                            onChange={e => setFormData({...formData, test_done_by: e.target.value})}
                            className="w-full bg-gray-50 dark:bg-gray-700/30 border-none rounded-2xl pl-11 pr-10 py-3.5 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500/50 transition-all appearance-none"
                         >
                             <option value="">Select Staff</option>
                             {formSettings?.staffMembers.map((s: any) => <option key={s.staff_name} value={s.staff_name}>{s.staff_name} ({s.job_title})</option>)}
                         </select>
                         <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                     </div>
                 </div>
             </div>
         </div>

         {/* Payment Card */}
         <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-6 text-white shadow-2xl shadow-gray-900/20">
             <div className="flex items-center gap-2 mb-6 border-b border-gray-700 pb-3">
                 <div className="bg-white/10 p-2 rounded-xl text-emerald-400">
                     <DollarSign size={20} />
                 </div>
                 <h3 className="text-sm font-black text-white uppercase tracking-wide">Payment Details</h3>
             </div>

             <div className="flex justify-between items-end mb-8">
                 <span className="text-sm font-bold text-gray-400">Total Amount</span>
                 <span className="text-3xl font-black tracking-tight">₹{total.toLocaleString()}</span>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-6">
                 <div>
                     <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Advance</label>
                     <input 
                        type="number"
                        value={formData.advance_amount}
                        onChange={e => setFormData({...formData, advance_amount: e.target.value})}
                        className="w-full bg-gray-700/50 border-none rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500 transition-all placeholder-gray-500"
                        placeholder="0.00"
                     />
                 </div>
                 <div>
                     <label className="text-[10px] uppercase font-bold text-gray-400 mb-1.5 block">Discount</label>
                     <input 
                        type="number"
                        value={formData.discount}
                        onChange={e => setFormData({...formData, discount: e.target.value})}
                        className="w-full bg-gray-700/50 border-none rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-emerald-500 transition-all placeholder-gray-500"
                        placeholder="0.00"
                     />
                 </div>
             </div>

             <div className="bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20 mb-6 flex justify-between items-center">
                 <span className="text-sm font-bold text-emerald-400">Due Balance</span>
                 <span className="text-xl font-black text-emerald-400">₹{due.toLocaleString()}</span>
             </div>

             <div>
                 <label className="text-[10px] uppercase font-bold text-gray-400 mb-2 block">Payment Method</label>
                 <div className="flex gap-2 flex-wrap">
                     {formSettings?.paymentMethods.length ? formSettings.paymentMethods.map((m: any) => (
                          <button 
                            key={m.method_code}
                            onClick={() => setFormData({...formData, payment_method: m.method_code})}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                formData.payment_method === m.method_code
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                          >
                              {m.method_name}
                          </button>
                     )) : (
                         <div className="text-xs text-gray-500">Loading methods...</div>
                     )}
                 </div>
             </div>
         </div>

         <button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-[0.98] text-white font-black rounded-2xl shadow-xl shadow-violet-600/30 transition-all flex items-center justify-center gap-3 text-lg"
         >
            {submitting ? (
                <>
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   <span>Processing...</span>
                </>
            ) : (
                <>
                   <span>Confirm & Save</span>
                   <CheckCircle size={20} className="text-white/70" />
                </>
            )}
         </button>

      </div>
    </div>
  );
};
