'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Common';
import Button from '@/components/Common/Button';
import { IconPlus } from '@tabler/icons-react';
import BatchTable from '@/components/Batches/BatchTable';
import BatchForm from '@/components/Batches/BatchForm';
import Modal from '@/components/Medicines/Modal';
import apiClient from '@/utils/apiClient';
import useUIStore from '@/store/uiStore';

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { openConfirm, addNotification } = useUIStore();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch medicines and batches from API
      const [medicinesRes, batchesRes] = await Promise.all([
        apiClient.get('/medicines'),
        apiClient.get('/batches')
      ]);

      const medicinesData = Array.isArray(medicinesRes.data?.data) ? medicinesRes.data.data : Array.isArray(medicinesRes.data) ? medicinesRes.data : [];
      const batchesData = Array.isArray(batchesRes.data?.data) ? batchesRes.data.data : Array.isArray(batchesRes.data) ? batchesRes.data : [];

      // Convert medicines array to object
      const medicinesMap = Array.isArray(medicinesData) ? medicinesData.reduce((acc, med) => {
        acc[med._id] = { ...med, id: med._id };
        return acc;
      }, {}) : {};

      setMedicines(medicinesMap);
      setBatches(Array.isArray(batchesData) ? batchesData : []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMedicines({});
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = () => {
    setIsModalOpen(true);
  };

  const handleDeleteBatch = async (batchId) => {
    openConfirm({
      title: 'Delete Batch',
      message: 'Are you sure you want to delete this batch? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          // Delete batch from API
          await apiClient.delete(`/batches/${batchId}`);
          setBatches((prev) => prev.filter((batch) => batch._id !== batchId && batch.id !== batchId));
          addNotification('Batch deleted successfully', 'success');
        } catch (error) {
          console.error('Failed to delete batch:', error);
          addNotification('Failed to delete batch', 'error');
        }
      }
    });
  };

  const handleSubmitForm = async (formData) => {
    try {
      setIsSubmitting(true);

      // Create batch via API
      const response = await apiClient.post('/batches', {
        medicineId: formData.medicineId,
        batchNo: formData.batchNo,
        quantity: parseInt(formData.quantity),
        mfgDate: formData.mfgDate,
        expiryDate: formData.expiryDate,
      });

      const newBatch = response.data?.data || {
        _id: Math.random(),
        ...formData,
        quantity: parseInt(formData.quantity),
      };

      setBatches((prev) => [...prev, newBatch]);
      setIsModalOpen(false);
      addNotification('Batch added successfully', 'success');
    } catch (error) {
      console.error('Failed to add batch:', error);
      addNotification('Failed to add batch', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const medicinesList = Object.values(medicines);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Batches</h1>
          <p className="text-slate-600 mt-1">
            Manage medicine batches and track expiry dates
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleAddBatch}
          className="flex items-center gap-2"
        >
          <IconPlus size={20} />
          Add Batch
        </Button>
      </div>

      {/* Table Card */}
      <Card className="p-6">
        <BatchTable
          batches={batches}
          medicines={medicines}
          loading={loading}
          onDelete={handleDeleteBatch}
        />
      </Card>

      {/* Add Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Add New Batch"
        onClose={() => setIsModalOpen(false)}
      >
        <BatchForm
          onSubmit={handleSubmitForm}
          isLoading={isSubmitting}
          medicines={medicinesList}
        />
      </Modal>
    </div>
  );
}
