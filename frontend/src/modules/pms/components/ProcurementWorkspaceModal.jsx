import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  ShoppingCart,
  ClipboardCheck,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Send,
  Building,
  Save,
  Check,
  Truck,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { pmsProcurementApi } from '../../../api/pmsProcurementApi';

const SECTIONS = [
  { key: 'vendorSelection', title: '1. Vendor Empanelment', icon: Users },
  { key: 'purchaseOrder', title: '2. Purchase Orders (PO)', icon: ShoppingCart },
  { key: 'materialReceive', title: '3. Material Receive (GRN)', icon: ClipboardCheck },
  { key: 'stockEntry', title: '4. Stock & Inventory (FIFO)', icon: Boxes },
];

function formatCurrency(val) {
  if (!val || isNaN(val)) return '₹0';
  const num = Number(val);
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function ProcurementWorkspaceModal({ recordId, onClose, onRefresh }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('vendorSelection');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Vendors State
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({
    name: '',
    category: 'cement',
    contactPerson: '',
    phone: '',
    gstNumber: '',
    rating: 4.5,
  });

  // 2. PO State
  const [orders, setOrders] = useState([]);
  const [newOrder, setNewOrder] = useState({
    poNumber: '',
    vendorName: '',
    materialName: '',
    category: 'cement',
    unit: 'Bags',
    quantity: '',
    rate: '',
    deliveryLocation: 'Central Project Site Godown',
    paymentTerms: '30 Days Net from GRN certification',
  });

  // 3. GRN State
  const [grnList, setGrnList] = useState([]);
  const [newGrn, setNewGrn] = useState({
    grnNumber: '',
    poNumber: '',
    vendorName: '',
    vehicleNumber: '',
    invoiceNumber: '',
    materialName: '',
    unit: 'Bags',
    receivedQty: '',
    acceptedQty: '',
    qaStatus: 'accepted',
    remarks: '',
  });

  // 4. Stock State
  const [stockItems, setStockItems] = useState([]);

  // Approval form
  const [approvalNote, setApprovalNote] = useState('');

  useEffect(() => {
    if (recordId) loadRecord();
  }, [recordId]);

  const loadRecord = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await pmsProcurementApi.getRecordById(recordId);
      if (res?.success) {
        const data = res.data;
        setRecord(data);

        // Populate Vendors
        if (data.vendorSelection?.vendors) {
          setVendors(data.vendorSelection.vendors);
        }

        // Populate POs
        if (data.purchaseOrder?.orders) {
          setOrders(data.purchaseOrder.orders);
        }

        // Populate GRNs
        if (data.materialReceive?.grnList) {
          setGrnList(data.materialReceive.grnList);
        }

        // Populate Stock
        if (data.stockEntry?.items) {
          setStockItems(data.stockEntry.items);
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load procurement record');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Vendor Handlers
  const handleToggleVendorApproval = (index) => {
    setVendors((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], isApproved: !next[index].isApproved };
      return next;
    });
  };

  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!newVendor.name.trim() || !newVendor.phone.trim()) {
      showNotification('Vendor name and contact phone are required', true);
      return;
    }
    setVendors((prev) => [
      ...prev,
      {
        ...newVendor,
        isApproved: true,
      },
    ]);
    setNewVendor({
      name: '',
      category: 'cement',
      contactPerson: '',
      phone: '',
      gstNumber: '',
      rating: 4.5,
    });
  };

  const handleSaveVendors = async (complete = false) => {
    setSaving(true);
    try {
      const res = await pmsProcurementApi.updateSection(recordId, 'vendorSelection', {
        vendors,
      });
      if (res?.success) {
        if (complete) {
          const compRes = await pmsProcurementApi.completeSection(recordId, 'vendorSelection');
          setRecord(compRes.data);
          showNotification('Vendor empanelment schedule completed');
          setActiveTab('purchaseOrder');
        } else {
          setRecord(res.data);
          showNotification('Vendor directory saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save vendors', true);
    } finally {
      setSaving(false);
    }
  };

  // PO Handlers
  const handleAddOrder = (e) => {
    e.preventDefault();
    if (!newOrder.poNumber.trim() || !newOrder.vendorName.trim() || !newOrder.quantity || !newOrder.rate) {
      showNotification('PO Number, Vendor, Quantity, and Rate are required', true);
      return;
    }
    const itemTotal = Number(newOrder.quantity) * Number(newOrder.rate);
    const orderObj = {
      poNumber: newOrder.poNumber,
      vendorName: newOrder.vendorName,
      orderDate: new Date(),
      deliveryLocation: newOrder.deliveryLocation,
      paymentTerms: newOrder.paymentTerms,
      status: 'issued',
      totalAmount: itemTotal,
      items: [
        {
          materialName: newOrder.materialName || 'Construction Material',
          category: newOrder.category,
          unit: newOrder.unit,
          quantity: Number(newOrder.quantity) || 0,
          rate: Number(newOrder.rate) || 0,
          totalAmount: itemTotal,
        },
      ],
    };
    setOrders((prev) => [...prev, orderObj]);
    setNewOrder({
      poNumber: '',
      vendorName: '',
      materialName: '',
      category: 'cement',
      unit: 'Bags',
      quantity: '',
      rate: '',
      deliveryLocation: 'Central Project Site Godown',
      paymentTerms: '30 Days Net from GRN certification',
    });
  };

  const handleSaveOrders = async (complete = false) => {
    setSaving(true);
    try {
      const res = await pmsProcurementApi.updateSection(recordId, 'purchaseOrder', {
        orders,
      });
      if (res?.success) {
        if (complete) {
          const compRes = await pmsProcurementApi.completeSection(recordId, 'purchaseOrder');
          setRecord(compRes.data);
          showNotification('Purchase orders finalized');
          setActiveTab('materialReceive');
        } else {
          setRecord(res.data);
          showNotification('Purchase orders saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save purchase orders', true);
    } finally {
      setSaving(false);
    }
  };

  // GRN Handlers
  const handleAddGrn = (e) => {
    e.preventDefault();
    if (!newGrn.grnNumber.trim() || !newGrn.poNumber.trim() || !newGrn.receivedQty) {
      showNotification('GRN number, PO number, and received quantity are required', true);
      return;
    }
    const recQty = Number(newGrn.receivedQty) || 0;
    const accQty = Number(newGrn.acceptedQty) || recQty;
    const grnObj = {
      grnNumber: newGrn.grnNumber,
      poNumber: newGrn.poNumber,
      vendorName: newGrn.vendorName || 'Verified Supplier',
      receiveDate: new Date(),
      vehicleNumber: newGrn.vehicleNumber,
      invoiceNumber: newGrn.invoiceNumber,
      qaStatus: newGrn.qaStatus,
      remarks: newGrn.remarks,
      items: [
        {
          materialName: newGrn.materialName || 'Construction Inward Material',
          unit: newGrn.unit,
          orderedQty: recQty,
          receivedQty: recQty,
          acceptedQty: accQty,
          rejectedQty: Math.max(0, recQty - accQty),
        },
      ],
    };
    setGrnList((prev) => [...prev, grnObj]);
    setNewGrn({
      grnNumber: '',
      poNumber: '',
      vendorName: '',
      vehicleNumber: '',
      invoiceNumber: '',
      materialName: '',
      unit: 'Bags',
      receivedQty: '',
      acceptedQty: '',
      qaStatus: 'accepted',
      remarks: '',
    });
  };

  const handleSaveGrnList = async (complete = false) => {
    setSaving(true);
    try {
      const res = await pmsProcurementApi.updateSection(recordId, 'materialReceive', {
        grnList,
      });
      if (res?.success) {
        if (complete) {
          const compRes = await pmsProcurementApi.completeSection(recordId, 'materialReceive');
          setRecord(compRes.data);
          showNotification('Material receive GRN receipts completed');
          setActiveTab('stockEntry');
        } else {
          setRecord(res.data);
          showNotification('GRN receipts saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save GRN records', true);
    } finally {
      setSaving(false);
    }
  };

  // Stock Handlers
  const handleUpdateStockItem = (index, field, value) => {
    setStockItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSaveStock = async (complete = false) => {
    setSaving(true);
    try {
      const res = await pmsProcurementApi.updateSection(recordId, 'stockEntry', {
        items: stockItems,
      });
      if (res?.success) {
        if (complete) {
          const compRes = await pmsProcurementApi.completeSection(recordId, 'stockEntry');
          setRecord(compRes.data);
          showNotification('FIFO stock ledger balance completed');
        } else {
          setRecord(res.data);
          showNotification('Stock ledger saved');
        }
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save stock ledger', true);
    } finally {
      setSaving(false);
    }
  };

  // Approval Handlers
  const handleRequestApproval = async () => {
    setSaving(true);
    try {
      const res = await pmsProcurementApi.requestApproval(recordId, { note: approvalNote });
      if (res?.success) {
        setRecord(res.data);
        showNotification('Submitted for management procurement sign-off');
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to submit approval request', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDecideApproval = async (decision) => {
    setSaving(true);
    try {
      const res = await pmsProcurementApi.decideApproval(recordId, {
        decision,
        note: approvalNote || (decision === 'approved' ? 'Procurement orders and stock inward certified' : 'Returned for verification'),
      });
      if (res?.success) {
        setRecord(res.data);
        showNotification(
          decision === 'approved'
            ? 'Stage 7 Approved! Project advanced to Stage 8 (Construction Execution)'
            : 'Procurement clearance returned'
        );
        if (onRefresh) onRefresh();
      }
    } catch (err) {
      showNotification(err.response?.data?.message || 'Approval decision failed', true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-xl p-8 shadow-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading Stage 7 Procurement Workspace...</p>
        </div>
      </div>
    );
  }

  const allSectionsComplete = SECTIONS.every((s) => record?.[s.key]?.status === 'completed');

  const totalPoValuePreview = orders.reduce(
    (acc, o) => acc + (Number(o.totalAmount) || 0),
    0
  );
  const totalStockValuePreview = stockItems.reduce(
    (acc, s) => acc + (Number(s.stockValue) || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl my-8 overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white px-6 py-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30">
                {record?.code || 'PRC-000000'}
              </span>
              <span className="text-xs uppercase tracking-wider text-slate-300 font-semibold">
                Stage 7: Procurement & Inventory (FIFO)
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {record?.project?.name || 'Procurement & Stock Workspace'}
            </h2>
            <div className="text-xs text-slate-300 mt-0.5 flex items-center gap-3">
              <span>Orders: <strong className="text-white">{orders.length} Active POs</strong></span>
              <span>•</span>
              <span>Committed PO Value: <strong className="text-emerald-300">{formatCurrency(totalPoValuePreview)}</strong></span>
              <span>•</span>
              <span>Site Stock Value: <strong className="text-cyan-300">{formatCurrency(totalStockValuePreview)}</strong></span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs font-medium text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 4-Step Rail Tab Selector */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isCompleted = record?.[sec.key]?.status === 'completed';
            const isActive = activeTab === sec.key;
            return (
              <button
                key={sec.key}
                onClick={() => setActiveTab(sec.key)}
                className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-brand-600 text-brand-700 bg-white shadow-xs rounded-t-md'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                <span>{sec.title}</span>
                {isCompleted && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)] space-y-6">
          {/* TAB 1: VENDOR EMPANELMENT */}
          {activeTab === 'vendorSelection' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Empanelled Suppliers & Vendors Directory</h3>
                  <p className="text-xs text-slate-500">Maintain qualified supplier contacts, GSTIN compliance, and vendor rating scores.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Approved Vendors: <span className="text-brand-700">{vendors.filter((v) => v.isApproved).length}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    record?.vendorSelection?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {record?.vendorSelection?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* Vendors Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Supplier Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Contact Person</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">GSTIN</th>
                      <th className="py-2.5 px-3">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vendors.map((v, idx) => (
                      <tr key={idx} className={v.isApproved ? 'hover:bg-slate-50/60' : 'bg-slate-50/40 text-slate-400'}>
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={v.isApproved}
                            onChange={() => handleToggleVendorApproval(idx)}
                            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{v.name}</td>
                        <td className="py-2 px-3 uppercase text-[10px] font-bold text-brand-700">{v.category}</td>
                        <td className="py-2 px-3">{v.contactPerson || '—'}</td>
                        <td className="py-2 px-3">{v.phone || '—'}</td>
                        <td className="py-2 px-3 font-mono text-[11px]">{v.gstNumber || '—'}</td>
                        <td className="py-2 px-3">
                          <span className="font-semibold text-amber-600">★ {v.rating || 4.5}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Vendor Form */}
              <form onSubmit={handleAddVendor} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Add Supplier</span>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Supplier / Agency name"
                      value={newVendor.name}
                      onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <select
                      value={newVendor.category}
                      onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white capitalize"
                    >
                      <option value="cement">Cement</option>
                      <option value="steel">Steel</option>
                      <option value="sand">Sand</option>
                      <option value="aggregate">Aggregate</option>
                      <option value="blocks">Blocks</option>
                      <option value="rmc">RMC</option>
                      <option value="electrical">Electrical</option>
                      <option value="plumbing">Plumbing</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Phone number"
                      value={newVendor.phone}
                      onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 bg-brand-600 text-white rounded text-xs font-semibold hover:bg-brand-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Empanel Vendor</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveVendors(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving || vendors.length === 0}
                  onClick={() => handleSaveVendors(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Vendor Selection</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PURCHASE ORDERS */}
          {activeTab === 'purchaseOrder' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Purchase Orders (PO) Execution</h3>
                  <p className="text-xs text-slate-500">Issue formal legally binding purchase orders with line-item pricing and delivery terms.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    Total PO Value: {formatCurrency(totalPoValuePreview)}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    record?.purchaseOrder?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {record?.purchaseOrder?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">PO Number</th>
                      <th className="py-2.5 px-3">Vendor</th>
                      <th className="py-2.5 px-3">Order Date</th>
                      <th className="py-2.5 px-3">Line Items</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-mono font-bold text-brand-700">{o.poNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{o.vendorName}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2 px-3 text-slate-700">
                          {o.items?.map((i) => `${i.materialName} (${i.quantity} ${i.unit})`).join(', ') || 'General materials'}
                        </td>
                        <td className="py-2 px-3 font-bold text-emerald-800">{formatCurrency(o.totalAmount)}</td>
                        <td className="py-2 px-3">
                          <span className="capitalize text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {o.status || 'issued'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add PO Form */}
              <form onSubmit={handleAddOrder} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Issue New Purchase Order</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">PO Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="PO-2026-003"
                      value={newOrder.poNumber}
                      onChange={(e) => setNewOrder({ ...newOrder, poNumber: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Vendor Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ultratech Cement"
                      value={newOrder.vendorName}
                      onChange={(e) => setNewOrder({ ...newOrder, vendorName: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Material Name</label>
                    <input
                      type="text"
                      placeholder="OPC 53 Cement"
                      value={newOrder.materialName}
                      onChange={(e) => setNewOrder({ ...newOrder, materialName: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Quantity & Unit</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        required
                        placeholder="Qty"
                        value={newOrder.quantity}
                        onChange={(e) => setNewOrder({ ...newOrder, quantity: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={newOrder.unit}
                        onChange={(e) => setNewOrder({ ...newOrder, unit: e.target.value })}
                        className="w-20 text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Rate per Unit (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 380"
                      value={newOrder.rate}
                      onChange={(e) => setNewOrder({ ...newOrder, rate: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Payment Terms</label>
                    <input
                      type="text"
                      value={newOrder.paymentTerms}
                      onChange={(e) => setNewOrder({ ...newOrder, paymentTerms: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 bg-brand-600 text-white rounded text-xs font-semibold hover:bg-brand-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Purchase Order</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveOrders(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving || orders.length === 0}
                  onClick={() => handleSaveOrders(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Purchase Orders</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MATERIAL RECEIVE (GRN) */}
          {activeTab === 'materialReceive' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Goods Received Notes (GRN) & Gate Inward</h3>
                  <p className="text-xs text-slate-500">Record gate security passes, delivery challans, physical inspection, and QA acceptance.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    Certified GRNs: <span className="text-brand-700">{grnList.length}</span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    record?.materialReceive?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {record?.materialReceive?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* GRN Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">GRN Number</th>
                      <th className="py-2.5 px-3">PO Reference</th>
                      <th className="py-2.5 px-3">Vendor</th>
                      <th className="py-2.5 px-3">Vehicle / Invoice</th>
                      <th className="py-2.5 px-3">Received Qty</th>
                      <th className="py-2.5 px-3">QA Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {grnList.map((g, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-mono font-bold text-brand-700">{g.grnNumber}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{g.poNumber}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{g.vendorName}</td>
                        <td className="py-2 px-3 text-slate-600">
                          {g.vehicleNumber || '—'} / {g.invoiceNumber || '—'}
                        </td>
                        <td className="py-2 px-3 font-semibold">
                          {g.items?.map((i) => `${i.receivedQty} ${i.unit}`).join(', ') || 'Inward'}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`capitalize text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            g.qaStatus === 'accepted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {g.qaStatus || 'accepted'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add GRN Form */}
              <form onSubmit={handleAddGrn} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Record Material Inward (GRN)</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">GRN Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="GRN-2026-003"
                      value={newGrn.grnNumber}
                      onChange={(e) => setNewGrn({ ...newGrn, grnNumber: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">PO Reference *</label>
                    <input
                      type="text"
                      required
                      placeholder="PO-PRJ-001"
                      value={newGrn.poNumber}
                      onChange={(e) => setNewGrn({ ...newGrn, poNumber: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Vehicle Number</label>
                    <input
                      type="text"
                      placeholder="RJ-14-GA-1234"
                      value={newGrn.vehicleNumber}
                      onChange={(e) => setNewGrn({ ...newGrn, vehicleNumber: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Received Qty & Unit *</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        required
                        placeholder="Qty"
                        value={newGrn.receivedQty}
                        onChange={(e) => setNewGrn({ ...newGrn, receivedQty: e.target.value, acceptedQty: e.target.value })}
                        className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Unit"
                        value={newGrn.unit}
                        onChange={(e) => setNewGrn({ ...newGrn, unit: e.target.value })}
                        className="w-20 text-xs rounded border border-slate-300 p-1.5 bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">Vendor Invoice / Challan No.</label>
                    <input
                      type="text"
                      placeholder="INV-2026-99"
                      value={newGrn.invoiceNumber}
                      onChange={(e) => setNewGrn({ ...newGrn, invoiceNumber: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">QA Inspection Result</label>
                    <select
                      value={newGrn.qaStatus}
                      onChange={(e) => setNewGrn({ ...newGrn, qaStatus: e.target.value })}
                      className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                    >
                      <option value="accepted">Accepted (Passes QA)</option>
                      <option value="partiallyAccepted">Partially Accepted</option>
                      <option value="rejected">Rejected (Failed QA)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-1.5 px-3 bg-brand-600 text-white rounded text-xs font-semibold hover:bg-brand-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Issue GRN Receipt</span>
                    </button>
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveGrnList(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving || grnList.length === 0}
                  onClick={() => handleSaveGrnList(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Material Receipts</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: STOCK ENTRY (FIFO) */}
          {activeTab === 'stockEntry' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">FIFO Stock Ledger & Inventory Valuation</h3>
                  <p className="text-xs text-slate-500">Live balance of site warehouse materials, issue slips, and minimum re-order level triggers.</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded-md border border-cyan-200">
                    Stock Valuation: {formatCurrency(totalStockValuePreview)}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    record?.stockEntry?.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    Status: {record?.stockEntry?.status === 'completed' ? 'Completed' : 'Draft / In Progress'}
                  </span>
                </div>
              </div>

              {/* Stock Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Material Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Total Inward</th>
                      <th className="py-2.5 px-3">Total Issued</th>
                      <th className="py-2.5 px-3">Current Stock</th>
                      <th className="py-2.5 px-3">Stock Value (₹)</th>
                      <th className="py-2.5 px-3">Storage Location</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stockItems.map((s, idx) => {
                      const cur = (Number(s.totalInwardQty) || 0) - (Number(s.totalIssuedQty) || 0);
                      const val = cur * (Number(s.unitRate) || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 font-semibold text-slate-900">{s.materialName}</td>
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-brand-700">{s.category}</td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={s.totalInwardQty}
                              onChange={(e) => handleUpdateStockItem(idx, 'totalInwardQty', Number(e.target.value) || 0)}
                              className="w-20 text-xs rounded border border-slate-300 p-1 text-right"
                            />{' '}
                            {s.unit}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              value={s.totalIssuedQty}
                              onChange={(e) => handleUpdateStockItem(idx, 'totalIssuedQty', Number(e.target.value) || 0)}
                              className="w-20 text-xs rounded border border-slate-300 p-1 text-right"
                            />{' '}
                            {s.unit}
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {cur} {s.unit}
                          </td>
                          <td className="py-2 px-3 font-bold text-cyan-800">{formatCurrency(val)}</td>
                          <td className="py-2 px-3 text-slate-600">{s.storageLocation || 'Main Store'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSaveStock(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  disabled={saving || stockItems.length === 0}
                  onClick={() => handleSaveStock(true)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Complete Stock Ledger</span>
                </button>
              </div>

              {/* Management Clearance Gate Box */}
              <div className="mt-6 p-5 rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/40 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Stage 7 Procurement Clearance Gate</h4>
                      <p className="text-[11px] text-slate-500">Requires Vendor Selection, PO Execution, GRN Receipts, and FIFO Stock Ledger.</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    record?.managementApproval?.decision === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : record?.managementApproval?.decision === 'rejected'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : record?.status === 'managementApproval'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {record?.managementApproval?.decision || (record?.status === 'managementApproval' ? 'Under Review' : 'Pending Sections')}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Clearance Remarks</label>
                  <textarea
                    rows={2}
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Enter management review comments, inventory audit observations..."
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500">
                    {allSectionsComplete
                      ? 'All 4 procurement sections complete. Ready for formal management clearance.'
                      : 'Complete all 4 sections to enable formal procurement clearance.'}
                  </span>

                  <div className="flex items-center gap-2">
                    {record?.status !== 'managementApproval' && record?.managementApproval?.decision !== 'approved' && (
                      <button
                        type="button"
                        disabled={saving || !allSectionsComplete}
                        onClick={handleRequestApproval}
                        className="px-4 py-2 text-xs font-semibold text-brand-700 bg-brand-100 hover:bg-brand-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Request Clearance
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={saving || record?.managementApproval?.decision === 'approved'}
                      onClick={() => handleDecideApproval('rejected')}
                      className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      disabled={saving || !allSectionsComplete || record?.managementApproval?.decision === 'approved'}
                      onClick={() => handleDecideApproval('approved')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Approve & Advance to Stage 8</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Last updated: {record?.updatedAt ? new Date(record.updatedAt).toLocaleString() : '—'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            Close Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
