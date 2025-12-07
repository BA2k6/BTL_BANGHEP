import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, Eye, Edit3, Trash2, Package, FileText, TrendingUp, RefreshCw, X, User, Truck, Save } from "lucide-react";
import api from "../services/api";
import ProductFormModal from '../components/ProductFormModal';

const StockInScreen = () => {
  const [receipts, setReceipts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // State lưu mã nhân viên tự động
  const [currentUserCode, setCurrentUserCode] = useState("WH01"); // Mặc định là WH01 để không bị rỗng

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const [selectedReceipt, setSelectedReceipt] = useState(null); 
  const [selectedReceiptItems, setSelectedReceiptItems] = useState([]);

  // Form State
  const [formMaster, setFormMaster] = useState({
    stockInId: "",
    supplierName: "",
    employeeId: "", 
    note: ""
  });

  const [formDetail, setFormDetail] = useState({
    variantId: "",
    quantity: "",
    priceImport: ""
  });

  const [tempItems, setTempItems] = useState([]);

  useEffect(() => {
    loadData();
    
    // --- LOGIC LẤY USER ---
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            // Ưu tiên lấy employeeId, nếu không có thì lấy userId, không có nữa thì lấy username
            const code = user.role_id === 1 ? 'OWNER' : (user.employeeId || user.id || user.username || 'WH01'); 
            setCurrentUserCode(code);
        } catch (e) {
            console.error(e);
        }
    }
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [receiptRes, variantRes] = await Promise.allSettled([
        api.get("/stockin"), 
        api.get("/products/variants")
      ]);
      if (receiptRes.status === 'fulfilled') setReceipts(receiptRes.value.data || []);
      if (variantRes.status === 'fulfilled') setVariants(variantRes.value.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  // 1. Mở form tạo mới
  const handleOpenNew = () => {
    setFormMaster({ 
        stockInId: "", 
        supplierName: "", 
        employeeId: currentUserCode, // Tự động điền
        note: "" 
    });
    setFormDetail({ variantId: "", quantity: "", priceImport: "" });
    setTempItems([]); 
    setShowAddModal(true);
  };

  // 2. Mở form nhập tiếp
  const handleEditReceipt = (receipt) => {
    setFormMaster({
      stockInId: receipt.id,
      supplierName: receipt.supplierName,
      employeeId: currentUserCode, // Tự động điền
      note: ""
    });
    setFormDetail({ variantId: "", quantity: "", priceImport: "" });
    setTempItems([]); 
    setShowAddModal(true);
  };

  const handleAddItemToTemp = () => {
    if (!formDetail.variantId || !formDetail.quantity || !formDetail.priceImport) {
        alert("Vui lòng chọn sản phẩm, số lượng và giá.");
        return;
    }
    
    const variant = variants.find(v => v.variant_id === formDetail.variantId);
    
    const existingIndex = tempItems.findIndex(item => item.variantId === formDetail.variantId);
    if (existingIndex >= 0) {
        const newItems = [...tempItems];
        newItems[existingIndex].quantity = Number(newItems[existingIndex].quantity) + Number(formDetail.quantity);
        setTempItems(newItems);
    } else {
        const newItem = {
            variantId: formDetail.variantId,
            productName: variant?.product_name || "Unknown",
            color: variant?.color,
            size: variant?.size,
            quantity: Number(formDetail.quantity),
            priceImport: Number(formDetail.priceImport)
        };
        setTempItems([...tempItems, newItem]);
    }
    setFormDetail({ ...formDetail, variantId: "", quantity: "", priceImport: "" });
  };

  const handleRemoveTempItem = (index) => {
      const newItems = [...tempItems];
      newItems.splice(index, 1);
      setTempItems(newItems);
  };

  const handleSubmitReceipt = async () => {
      if (tempItems.length === 0) return alert("Danh sách hàng hóa trống!");
      if (!formMaster.stockInId && !formMaster.supplierName) return alert("Vui lòng nhập Nhà cung cấp.");
      
      // Kiểm tra kỹ lại mã nhân viên
      if (!formMaster.employeeId || formMaster.employeeId.trim() === "") {
          return alert("Vui lòng nhập Mã nhân viên (VD: WH01).");
      }

      setSubmitting(true);
      try {
          const payload = {
              stockInId: formMaster.stockInId,
              supplierName: formMaster.supplierName,
              employeeId: formMaster.employeeId, 
              items: tempItems
          };

          await api.post("/stockin/create-receipt", payload);
          
          alert("Lưu phiếu thành công!");
          setShowAddModal(false);
          loadData();
          if (showDetailModal && selectedReceipt?.id === formMaster.stockInId) handleViewDetail(selectedReceipt);
      } catch (err) {
          alert(err.response?.data?.message || "Lỗi khi lưu phiếu.");
      } finally {
          setSubmitting(false);
      }
  };

  const handleViewDetail = async (receipt) => {
    setSelectedReceipt(receipt); setShowDetailModal(true);
    try {
        const res = await api.get(`/stockin/${receipt.id}/details`);
        setSelectedReceiptItems(res.data || []);
    } catch (err) {}
  };
  
  const handleDeleteItem = async (variantId) => {
      if(!window.confirm("Xóa dòng này?")) return;
      try {
          await api.delete(`/stockin/items/${selectedReceipt.id}_${variantId}`);
          handleViewDetail(selectedReceipt); loadData();
      } catch (err) { alert("Lỗi xóa"); }
  }

  const filteredReceipts = useMemo(() => {
    const q = search.toLowerCase();
    return receipts.filter(r => r.id.toLowerCase().includes(q) || r.supplierName.toLowerCase().includes(q));
  }, [receipts, search]);

  const stats = useMemo(() => ({
      totalReceipts: receipts.length,
      totalValue: receipts.reduce((sum, r) => sum + Number(r.totalCost || 0), 0)
  }), [receipts]);

  const tempTotalMoney = tempItems.reduce((sum, item) => sum + (item.quantity * item.priceImport), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 relative">
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3"><span className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-xl shadow-lg"><Package size={28} /></span> Quản Lý Phiếu Nhập</h1>
            <div className="flex gap-3">
                <button onClick={loadData} className="p-3 bg-white rounded-xl shadow"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
                <button onClick={handleOpenNew} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-lg flex items-center gap-2"><Plus size={20} /> Tạo phiếu mới</button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center"><div><p className="text-gray-500 text-sm">Tổng phiếu</p><h3 className="text-3xl font-bold">{stats.totalReceipts}</h3></div><FileText size={24} className="text-blue-600"/></div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center"><div><p className="text-gray-500 text-sm">Tổng giá trị</p><h3 className="text-3xl font-bold text-green-600">{stats.totalValue.toLocaleString()} đ</h3></div><TrendingUp size={24} className="text-green-600"/></div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b"><div className="relative max-w-md"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /><input type="text" placeholder="Tìm phiếu..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <table className="w-full text-left"><thead className="bg-gray-50"><tr><th className="px-6 py-4 text-xs font-semibold uppercase">Mã Phiếu</th><th className="px-6 py-4 text-xs font-semibold uppercase">Ngày Nhập</th><th className="px-6 py-4 text-xs font-semibold uppercase">Nhà Cung Cấp</th><th className="px-6 py-4 text-xs font-semibold uppercase">Mã NV</th><th className="px-6 py-4 text-right text-xs font-semibold uppercase">Tổng Tiền</th><th className="px-6 py-4 text-center text-xs font-semibold uppercase">Hành Động</th></tr></thead>
            <tbody className="divide-y">{filteredReceipts.map(r => (
                <tr key={r.id} className="hover:bg-gray-50"><td className="px-6 py-4 font-mono text-blue-600">{r.id}</td><td className="px-6 py-4 text-sm">{r.importDate}</td><td className="px-6 py-4 font-medium">{r.supplierName}</td>
                
                {/* HIỂN THỊ MÃ NV */}
                <td className="px-6 py-4 text-sm"><span className="bg-gray-100 px-2 py-1 rounded font-bold text-gray-700">{r.staffCode || r.staffName || r.userId || '---'}</span></td>
                
                <td className="px-6 py-4 text-right font-bold">{Number(r.totalCost).toLocaleString()} đ</td><td className="px-6 py-4 flex justify-center gap-2"><button onClick={() => handleViewDetail(r)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Eye size={18}/></button><button onClick={() => handleEditReceipt(r)} className="p-2 text-orange-600 bg-orange-50 rounded-lg"><Edit3 size={18}/></button></td></tr>
            ))}</tbody></table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="text-lg font-bold">{formMaster.stockInId ? "Nhập thêm hàng" : "Tạo phiếu nhập mới"}</h3><button onClick={() => setShowAddModal(false)}><X size={20}/></button></div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                        <div><label className="text-xs font-bold uppercase block mb-1">Mã Phiếu</label><input type="text" value={formMaster.stockInId} disabled placeholder="Tự động" className="w-full px-3 py-2 bg-gray-200 rounded-lg font-mono text-sm"/></div>
                        <div><label className="text-xs font-bold uppercase block mb-1">Nhà Cung Cấp *</label><input type="text" value={formMaster.supplierName} onChange={e => setFormMaster({...formMaster, supplierName: e.target.value})} disabled={!!formMaster.stockInId} className="w-full px-3 py-2 border rounded-lg"/></div>
                        
                        {/* --- [FIX QUAN TRỌNG] Ô NHẬP MÃ NHÂN VIÊN ĐÃ MỞ KHÓA (KHÔNG CÒN DISABLED) --- */}
                        <div>
                            <label className="text-xs font-bold uppercase block mb-1">Mã Nhân Viên *</label>
                            <input 
                                type="text" 
                                value={formMaster.employeeId} 
                                onChange={e => setFormMaster({...formMaster, employeeId: e.target.value})} // Cho phép sửa
                                className="w-full px-3 py-2 border rounded-lg font-bold text-gray-700 focus:border-blue-500 outline-none" 
                                placeholder="VD: WH01"
                            />
                        </div>
                        {/* ------------------------------------------------------------------- */}
                    
                    </div>
                    <div className="flex gap-4 items-end mb-4 border-b pb-4">
                        <div className="flex-1"><label className="text-xs font-bold uppercase block mb-1">Sản Phẩm</label><select value={formDetail.variantId} onChange={e => { const v = variants.find(i => i.variant_id === e.target.value); setFormDetail({...formDetail, variantId: e.target.value, priceImport: v?.cost_price || ""}); }} className="w-full px-3 py-2 border rounded-lg"><option value="">-- Chọn --</option>{variants.map(v => <option key={v.variant_id} value={v.variant_id}>{v.product_name} ({v.color}-{v.size})</option>)}</select></div>
                        <div className="w-24"><label className="text-xs font-bold uppercase block mb-1">SL</label><input type="number" min="1" className="w-full px-3 py-2 border rounded-lg" value={formDetail.quantity} onChange={e => setFormDetail({...formDetail, quantity: e.target.value})} /></div>
                        <div className="w-32"><label className="text-xs font-bold uppercase block mb-1">Giá</label><input type="number" min="0" className="w-full px-3 py-2 border rounded-lg" value={formDetail.priceImport} onChange={e => setFormDetail({...formDetail, priceImport: e.target.value})} /></div>
                        <button onClick={handleAddItemToTemp} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium flex gap-1 items-center h-[42px]"><Plus size={18}/> Thêm</button>
                    </div>
                    <table className="w-full text-left"><thead className="bg-gray-100"><tr><th className="px-4 py-2 text-xs">Sản phẩm</th><th className="px-4 py-2 text-center text-xs">SL</th><th className="px-4 py-2 text-right text-xs">Giá</th><th className="px-4 py-2 text-right text-xs">Thành tiền</th><th className="px-4 py-2 text-center text-xs">Xóa</th></tr></thead><tbody>{tempItems.map((item, index) => (<tr key={index}><td className="px-4 py-2 text-sm">{item.productName} ({item.color}-{item.size})</td><td className="px-4 py-2 text-center">{item.quantity}</td><td className="px-4 py-2 text-right">{item.priceImport.toLocaleString()}</td><td className="px-4 py-2 text-right font-medium">{(item.quantity * item.priceImport).toLocaleString()}</td><td className="px-4 py-2 text-center"><button onClick={() => handleRemoveTempItem(index)} className="text-red-500"><Trash2 size={16}/></button></td></tr>))}</tbody></table>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3"><button onClick={() => setShowAddModal(false)} className="px-5 py-2 text-gray-600 rounded-lg">Hủy</button><button onClick={handleSubmitReceipt} disabled={submitting || tempItems.length === 0} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-2">{submitting ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>} Lưu Phiếu</button></div>
            </div>
        </div>
      )}

      {showDetailModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="font-bold text-lg">Chi tiết phiếu: {selectedReceipt.id}</h3><button onClick={() => setShowDetailModal(false)}><X size={24}/></button></div>
                <div className="p-0 overflow-y-auto flex-1"><table className="w-full text-left"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-xs uppercase">Sản phẩm</th><th className="px-6 py-3 text-center text-xs uppercase">SL</th><th className="px-6 py-3 text-right text-xs uppercase">Giá</th><th className="px-6 py-3 text-right text-xs uppercase">Tổng</th><th className="px-6 py-3 text-center text-xs uppercase">Xóa</th></tr></thead><tbody>{selectedReceiptItems.map((item, i) => (<tr key={i}><td className="px-6 py-3"><div className="font-medium">{item.productName}</div><div className="text-xs text-gray-500">{item.color} - {item.size}</div></td><td className="px-6 py-3 text-center">{item.quantity}</td><td className="px-6 py-3 text-right">{Number(item.priceImport).toLocaleString()}</td><td className="px-6 py-3 text-right font-bold">{(item.quantity * item.priceImport).toLocaleString()}</td><td className="px-6 py-3 text-center"><button onClick={() => handleDeleteItem(item.variantId)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div>
                <div className="px-6 py-4 border-t flex justify-between"><button onClick={() => { setShowDetailModal(false); handleEditReceipt(selectedReceipt); }} className="text-blue-600 flex items-center gap-1 font-medium"><Plus size={16}/> Nhập thêm hàng</button><span className="font-bold text-xl text-blue-600">{Number(selectedReceipt.totalCost).toLocaleString()} đ</span></div>
            </div>
        </div>
      )}

      <ProductFormModal open={showProductModal} onClose={()=>setShowProductModal(false)} onSaved={()=>{ alert("Tạo SP thành công"); loadData(); }} />
    </div>
  );
};

export default StockInScreen;