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

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  
  const [selectedReceipt, setSelectedReceipt] = useState(null); 
  const [selectedReceiptItems, setSelectedReceiptItems] = useState([]);

  // --- STATE FORM NHẬP KHO (MASTER-DETAIL) ---
  const [formMaster, setFormMaster] = useState({
    stockInId: "",
    supplierName: "",
    userId: "",
    note: ""
  });

  const [formDetail, setFormDetail] = useState({
    variantId: "",
    quantity: "",
    priceImport: ""
  });

  // Danh sách hàng hóa trong giỏ tạm
  const [tempItems, setTempItems] = useState([]);

  useEffect(() => {
    loadData();
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Mở form tạo mới hoàn toàn
  const handleOpenNew = () => {
    setFormMaster({ stockInId: "", supplierName: "", userId: "", note: "" });
    setFormDetail({ variantId: "", quantity: "", priceImport: "" });
    setTempItems([]); 
    setShowAddModal(true);
  };

  // 2. Mở form thêm hàng vào phiếu cũ
  const handleEditReceipt = (receipt) => {
    setFormMaster({
      stockInId: receipt.id,
      supplierName: receipt.supplierName,
      userId: "", // User nhập tiếp theo cần nhập mã của họ
      note: ""
    });
    setFormDetail({ variantId: "", quantity: "", priceImport: "" });
    setTempItems([]); 
    setShowAddModal(true);
  };

  // 3. Thêm sản phẩm vào danh sách tạm
  const handleAddItemToTemp = () => {
    if (!formDetail.variantId || !formDetail.quantity || !formDetail.priceImport) {
        alert("Vui lòng chọn sản phẩm, số lượng và giá.");
        return;
    }
    
    const variant = variants.find(v => v.variant_id === formDetail.variantId);
    
    // Check trùng để cộng dồn
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
    // Reset dòng nhập liệu
    setFormDetail({ ...formDetail, variantId: "", quantity: "", priceImport: "" });
  };

  const handleRemoveTempItem = (index) => {
      const newItems = [...tempItems];
      newItems.splice(index, 1);
      setTempItems(newItems);
  };

  // 4. Lưu phiếu xuống DB
  const handleSubmitReceipt = async () => {
      if (tempItems.length === 0) {
          alert("Danh sách hàng hóa trống!");
          return;
      }
      if (!formMaster.stockInId && !formMaster.supplierName) {
          alert("Vui lòng nhập Nhà cung cấp.");
          return;
      }
      if (!formMaster.userId) {
          alert("Vui lòng nhập Mã nhân viên.");
          return;
      }

      setSubmitting(true);
      try {
          const payload = {
              stockInId: formMaster.stockInId,
              supplierName: formMaster.supplierName,
              userId: formMaster.userId,
              items: tempItems
          };

          await api.post("/stockin/create-receipt", payload); // Gọi endpoint bulk insert
          
          alert("Nhập kho thành công!");
          setShowAddModal(false);
          loadData();
          
          // Refresh detail modal nếu đang mở
          if (showDetailModal && selectedReceipt && selectedReceipt.id === formMaster.stockInId) {
             handleViewDetail(selectedReceipt);
          }
      } catch (err) {
          alert(err.response?.data?.message || "Lỗi khi lưu phiếu.");
      } finally {
          setSubmitting(false);
      }
  };

  // 5. Xem chi tiết
  const handleViewDetail = async (receipt) => {
    setSelectedReceipt(receipt);
    setShowDetailModal(true);
    try {
        const res = await api.get(`/stockin/${receipt.id}/details`);
        setSelectedReceiptItems(res.data || []);
    } catch (err) { alert("Lỗi tải chi tiết"); }
  };
  
  // 6. Xóa item trong chi tiết
  const handleDeleteItem = async (variantId) => {
      if(!window.confirm("Xóa dòng này sẽ trừ lại tiền và tồn kho. Tiếp tục?")) return;
      try {
          const compositeId = `${selectedReceipt.id}_${variantId}`;
          await api.delete(`/stockin/items/${compositeId}`);
          handleViewDetail(selectedReceipt); // Reload lại modal
          loadData(); // Reload lại bảng tổng
      } catch (err) { alert("Lỗi khi xóa."); }
  }

  // --- RENDER ---
  const filteredReceipts = useMemo(() => {
    if (!search) return receipts;
    const q = search.toLowerCase();
    return receipts.filter(r => r.id.toLowerCase().includes(q) || r.supplierName.toLowerCase().includes(q));
  }, [receipts, search]);

  const stats = useMemo(() => {
    return {
        totalReceipts: receipts.length,
        totalValue: receipts.reduce((sum, r) => sum + Number(r.totalCost || 0), 0)
    };
  }, [receipts]);

  const tempTotalMoney = tempItems.reduce((sum, item) => sum + (item.quantity * item.priceImport), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 relative">
        <div className="fixed inset-0 pointer-events-none">
           <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <span className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 text-white rounded-xl shadow-lg"><Package size={28} /></span>
                Quản Lý Phiếu Nhập
              </h1>
              <p className="text-gray-500 mt-2 ml-1">Danh sách phiếu nhập (Master List)</p>
            </div>
            <div className="flex gap-3">
                <button onClick={loadData} className="p-3 bg-white rounded-xl shadow hover:bg-gray-50"><RefreshCw size={20} className={loading ? "animate-spin" : ""} /></button>
                <button onClick={handleOpenNew} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg flex items-center gap-2"><Plus size={20} /> Tạo phiếu mới</button>
            </div>
        </div>

        {/* THỐNG KÊ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div><p className="text-gray-500 text-sm font-medium">Tổng số phiếu</p><h3 className="text-3xl font-bold mt-1">{stats.totalReceipts}</h3></div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FileText size={24}/></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div><p className="text-gray-500 text-sm font-medium">Tổng giá trị nhập</p><h3 className="text-3xl font-bold mt-1 text-green-600">{stats.totalValue.toLocaleString()} đ</h3></div>
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24}/></div>
            </div>
        </div>

        {/* BẢNG DANH SÁCH */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100"><div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Tìm phiếu..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={search} onChange={e => setSearch(e.target.value)} /></div></div>
            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mã Phiếu</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Ngày Nhập</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Nhà Cung Cấp</th>
                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Người Nhập</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Tổng Tiền</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">Hành Động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredReceipts.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-blue-600 font-medium">{r.id}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{r.importDate}</td>
                            <td className="px-6 py-4 font-medium">{r.supplierName}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{r.staffName}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-800">{Number(r.totalCost).toLocaleString()} đ</td>
                            <td className="px-6 py-4 flex justify-center gap-2">
                                <button onClick={() => handleViewDetail(r)} className="p-2 text-blue-600 bg-blue-50 rounded-lg"><Eye size={18}/></button>
                                <button onClick={() => handleEditReceipt(r)} className="p-2 text-orange-600 bg-orange-50 rounded-lg"><Edit3 size={18}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>
      </div>

      {/* --- MODAL NHẬP HÀNG (MASTER-DETAIL) --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">{formMaster.stockInId ? "Nhập thêm hàng" : "Tạo phiếu nhập mới"}</h3>
                    <button onClick={() => !submitting && setShowAddModal(false)}><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                    {/* MASTER INFO */}
                    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mã Phiếu</label><input type="text" value={formMaster.stockInId} disabled placeholder="Tự động" className="w-full px-3 py-2 bg-gray-200 rounded-lg font-mono text-sm"/></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nhà Cung Cấp *</label><div className="relative"><Truck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" value={formMaster.supplierName} onChange={e => setFormMaster({...formMaster, supplierName: e.target.value})} disabled={!!formMaster.stockInId} className="w-full pl-9 pr-3 py-2 border rounded-lg"/></div></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mã Nhân Viên *</label><div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input type="text" value={formMaster.userId} onChange={e => setFormMaster({...formMaster, userId: e.target.value})} className="w-full pl-9 pr-3 py-2 border rounded-lg" placeholder="VD: WH01"/></div></div>
                    </div>

                    {/* DETAIL ENTRY */}
                    <div className="flex gap-4 items-end mb-4 pb-4 border-b border-gray-100">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sản Phẩm</label>
                            <select value={formDetail.variantId} onChange={e => {
                                    const v = variants.find(i => i.variant_id === e.target.value);
                                    setFormDetail({...formDetail, variantId: e.target.value, priceImport: v?.cost_price || ""});
                                }} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">-- Chọn biến thể --</option>
                                {variants.map(v => <option key={v.variant_id} value={v.variant_id}>{v.product_name} ({v.color}-{v.size}) - Tồn: {v.stock_quantity}</option>)}
                            </select>
                        </div>
                        <div className="w-24"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">SL</label><input type="number" min="1" className="w-full px-3 py-2 border rounded-lg" value={formDetail.quantity} onChange={e => setFormDetail({...formDetail, quantity: e.target.value})} /></div>
                        <div className="w-32"><label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Giá</label><input type="number" min="0" className="w-full px-3 py-2 border rounded-lg" value={formDetail.priceImport} onChange={e => setFormDetail({...formDetail, priceImport: e.target.value})} /></div>
                        <button onClick={handleAddItemToTemp} className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium flex items-center gap-1 h-[42px]"><Plus size={18}/> Thêm</button>
                    </div>

                    {/* TEMP LIST */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden min-h-[150px]">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100"><tr><th className="px-4 py-2 text-xs font-semibold">Sản phẩm</th><th className="px-4 py-2 text-center text-xs font-semibold">SL</th><th className="px-4 py-2 text-right text-xs font-semibold">Giá</th><th className="px-4 py-2 text-center text-xs font-semibold">Xóa</th></tr></thead>
                            <tbody className="divide-y divide-gray-100">
                                {tempItems.map((item, index) => (
                                    <tr key={index}>
                                        <td className="px-4 py-2"><div className="font-medium text-sm">{item.productName}</div><div className="text-xs text-gray-500">{item.color} - {item.size}</div></td>
                                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                                        <td className="px-4 py-2 text-right">{Number(item.priceImport).toLocaleString()}</td>
                                        <td className="px-4 py-2 text-center"><button onClick={() => handleRemoveTempItem(index)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                                    </tr>
                                ))}
                                {tempItems.length === 0 && <tr><td colSpan="4" className="p-4 text-center text-gray-400 italic">Chưa có sản phẩm.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <div className="text-lg">Tổng: <span className="font-bold text-blue-600">{tempTotalMoney.toLocaleString()} đ</span></div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowAddModal(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-200 rounded-lg" disabled={submitting}>Hủy</button>
                        <button onClick={handleSubmitReceipt} disabled={submitting || tempItems.length === 0} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-lg flex items-center gap-2">
                            {submitting ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>} Lưu Phiếu
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL VIEW DETAILS --- */}
      {showDetailModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b flex justify-between items-center"><h3 className="font-bold text-lg">Chi tiết phiếu: {selectedReceipt.id}</h3><button onClick={() => setShowDetailModal(false)}><X size={24}/></button></div>
                <div className="p-0 overflow-y-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-xs uppercase">Sản phẩm</th><th className="px-6 py-3 text-center text-xs uppercase">SL</th><th className="px-6 py-3 text-right text-xs uppercase">Giá</th><th className="px-6 py-3 text-right text-xs uppercase">Tổng</th><th className="px-6 py-3 text-center text-xs uppercase">Xóa</th></tr></thead>
                        <tbody className="divide-y">
                            {selectedReceiptItems.map((item, i) => (
                                <tr key={i}>
                                    <td className="px-6 py-3"><div className="font-medium">{item.productName}</div><div className="text-xs text-gray-500">{item.color} - {item.size}</div></td>
                                    <td className="px-6 py-3 text-center">{item.quantity}</td>
                                    <td className="px-6 py-3 text-right">{Number(item.priceImport).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-right font-bold">{(item.quantity * item.priceImport).toLocaleString()}</td>
                                    <td className="px-6 py-3 text-center"><button onClick={() => handleDeleteItem(item.variantId)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t flex justify-between"><button onClick={() => { setShowDetailModal(false); handleEditReceipt(selectedReceipt); }} className="text-blue-600 flex items-center gap-1 font-medium"><Plus size={16}/> Nhập thêm hàng</button><span className="font-bold text-xl text-blue-600">{Number(selectedReceipt.totalCost).toLocaleString()} đ</span></div>
            </div>
        </div>
      )}

      <ProductFormModal open={showProductModal} onClose={()=>setShowProductModal(false)} onSaved={()=>{ alert("Tạo SP thành công"); loadData(); }} />
    </div>
  );
};

export default StockInScreen;