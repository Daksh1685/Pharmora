'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/utils/apiClient';
import { IconTrash, IconEdit, IconX } from '@tabler/icons-react';
import useUIStore from '@/store/uiStore';

export function SalesListNew() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({ customerName: '', medicineName: '', quantity: '', customerPhone: '', paymentMethod: '', totalAmount: '' });
  
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { addNotification, openConfirm } = useUIStore();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async (query = '') => {
    try {
      setLoading(true);
      let url = '/sales';
      if (query.trim()) {
        url += '?search=' + encodeURIComponent(query);
      }
      const res = await apiClient.get(url);
      setSales(res.data?.data?.sales || []);
    } catch (err) {
      console.error('Error loading sales:', err);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    loadSales(val);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadSales('');
  };

  const handleEdit = (sale) => {
    setEditId(sale._id);
    setEditData({
      customerName: sale.customerName || '',
      medicineName: sale.medicineName || '',
      quantity: sale.quantity || '',
      customerPhone: sale.customerPhone || '',
      paymentMethod: sale.paymentMethod || '',
      totalAmount: sale.totalAmount || ''
    });
    setEditOpen(true);
  };

  const handleDelete = (sale) => {
    openConfirm({
      title: 'Delete Sale',
      message: `Are you sure you want to delete this sale for ${sale.customerName || 'Unknown'}? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/sales/${sale._id}`);
          loadSales(searchQuery);
          addNotification('Sale deleted successfully!', 'success');
        } catch (err) {
          addNotification('Error deleting sale', 'error');
        }
      }
    });
  };

  const saveEdit = async () => {
    if (!editData.customerName || !editData.medicineName || !editData.quantity) {
      addNotification('Fill required fields', 'warning');
      return;
    }
    try {
      await apiClient.put(`/sales/${editId}`, editData);
      setEditOpen(false);
      loadSales(searchQuery);
      addNotification('Sale updated successfully!', 'success');
    } catch (err) {
      addNotification('Error updating sale', 'error');
    }
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/sales/${deleteId}`);
      setDeleteOpen(false);
      loadSales(searchQuery);
      addNotification('Sale deleted successfully!', 'success');
    } catch (err) {
      addNotification('Error deleting sale', 'error');
    }
  };

  const displaySales = showAll ? sales : sales.slice(0, 5);

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
          {showAll ? `All Sales (${sales.length})` : 'Customer Sales'}
        </h2>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: '#f1f5f9',
            color: '#475569',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          {showAll ? 'Show Less' : 'View All'}
        </button>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Filter by customer name, phone, medicine..."
          autoFocus
          style={{
            flex: 1,
            padding: '10px 16px',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleClearSearch}
          disabled={!searchQuery}
          style={{
            padding: '10px 24px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: searchQuery ? 'pointer' : 'not-allowed',
            background: searchQuery ? '#0f172a' : '#e2e8f0',
            color: searchQuery ? '#fff' : '#94a3b8',
            whiteSpace: 'nowrap'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>Loading...</div>
        ) : displaySales.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displaySales.map((sale) => (
              <div
                key={sale._id}
                style={{
                  padding: '16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  background: '#f8fafc'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Customer</div>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{sale.customerName || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Medicine</div>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>{sale.medicineName || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>Amount</div>
                    <div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600' }}>₹{sale.totalAmount || 0}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Phone</div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>{sale.customerPhone || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Quantity</div>
                    <div style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>{sale.quantity || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Payment</div>
                    <div style={{ fontSize: '13px', color: '#475569', textTransform: 'capitalize' }}>{sale.paymentMethod || 'N/A'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Date</div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => handleEdit(sale)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#dbeafe',
                      color: '#1e40af',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <IconEdit size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sale)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '6px',
                      background: '#fee2e2',
                      color: '#991b1b',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <IconTrash size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            {searchQuery ? 'No results found' : 'No sales yet'}
          </div>
        )}
      </div>

      {editOpen && (
        <div style={{
          position: 'fixed',
          inset: '0',
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          zIndex: 50
        }}>
          <div style={{ background: '#fff', borderRadius: '16px', maxWidth: '400px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ borderBottom: '1px solid #e2e8f0', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>Update Details</h2>
              <button onClick={() => setEditOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>
                  Customer Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editData.customerName}
                  onChange={(e) => setEditData({ ...editData, customerName: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Phone</label>
                <input
                  type="tel"
                  value={editData.customerPhone}
                  onChange={(e) => setEditData({ ...editData, customerPhone: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>
                  Medicine <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={editData.medicineName}
                  onChange={(e) => setEditData({ ...editData, medicineName: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>
                  Quantity <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="number"
                  value={editData.quantity}
                  onChange={(e) => setEditData({ ...editData, quantity: e.target.value })}
                  min="1"
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Payment</label>
                <select
                  value={editData.paymentMethod}
                  onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                >
                  <option value="">Select payment</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#0f172a', marginBottom: '8px' }}>Amount</label>
                <input
                  type="number"
                  value={editData.totalAmount}
                  onChange={(e) => setEditData({ ...editData, totalAmount: e.target.value })}
                  step="0.01"
                  min="0"
                  style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => setEditOpen(false)}
                  style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#1e293b', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - moved to UI store */}
      <div className="hidden">
        {deleteOpen && <div />}
      </div>
    </div>
  );
}
