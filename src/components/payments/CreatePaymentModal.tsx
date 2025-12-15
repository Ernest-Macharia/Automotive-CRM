'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  X, 
  CreditCard, 
  Wallet, 
  Building, 
  Smartphone, 
  Receipt,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { paymentService } from '@/services/paymentService';
import { invoiceService } from '@/services/invoiceService';
import { Invoice } from '@/services/invoiceService';

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
  invoice?: Invoice;
}

interface PaymentFormData {
  invoiceId: string;
  amountPaid: number;
  method: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque';
  referenceNumber: string;
  notes?: string;
  paymentDate: string;
}

export default function CreatePaymentModal({ 
  isOpen, 
  onClose, 
  onCreate,
  invoice 
}: CreatePaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoice || null);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [receiptNumber, setReceiptNumber] = useState('');
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<PaymentFormData>({
    defaultValues: {
      invoiceId: invoice?.id || '',
      amountPaid: invoice?.balance || 0,
      method: 'cash',
      referenceNumber: '',
      paymentDate: new Date().toISOString().split('T')[0]
    }
  });

  const watchInvoiceId = watch('invoiceId');
  const watchAmount = watch('amountPaid');

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
      generateReceiptNumber();
      if (invoice) {
        setSelectedInvoice(invoice);
        setAvailableBalance(invoice.balance);
        setValue('amountPaid', invoice.balance);
      }
    }
  }, [isOpen, invoice]);

  useEffect(() => {
    if (watchInvoiceId && invoices.length > 0) {
      const inv = invoices.find(i => i.id === watchInvoiceId);
      if (inv) {
        setSelectedInvoice(inv);
        setAvailableBalance(inv.balance);
        setValue('amountPaid', inv.balance);
      }
    }
  }, [watchInvoiceId]);

  const loadInvoices = async () => {
    try {
      const response = await invoiceService.getInvoicesByStatus('partially_paid');
      const pendingInvoices = response.data.filter(inv => inv.balance > 0);
      setInvoices(pendingInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  const generateReceiptNumber = async () => {
    try {
      const number = await paymentService.generateReceiptNumber();
      setReceiptNumber(number);
    } catch (error) {
      console.error('Error generating receipt number:', error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    if (selectedInvoice && value > selectedInvoice.balance) {
      setValue('amountPaid', selectedInvoice.balance);
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (selectedInvoice && data.amountPaid > selectedInvoice.balance) {
      alert('Payment amount cannot exceed invoice balance');
      return;
    }

    setLoading(true);
    try {
      await onCreate({
        ...data,
        receiptNumber,
        amountPaid: parseFloat(data.amountPaid.toString())
      });
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Wallet className="h-5 w-5 text-green-600" />;
      case 'card':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'bank_transfer':
        return <Building className="h-5 w-5 text-purple-600" />;
      case 'mobile_money':
        return <Smartphone className="h-5 w-5 text-yellow-600" />;
      case 'cheque':
        return <Receipt className="h-5 w-5 text-gray-600" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodDescription = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Physical cash payment';
      case 'card':
        return 'Credit/Debit card payment';
      case 'bank_transfer':
        return 'Bank transfer or deposit';
      case 'mobile_money':
        return 'Mobile money (M-Pesa, Airtel Money, etc.)';
      case 'cheque':
        return 'Cheque payment';
      default:
        return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl transform transition-all">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg">
                <Wallet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Record New Payment</h2>
                <p className="text-sm text-gray-600">Enter payment details below</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Receipt Preview */}
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-700 font-medium">Receipt Number</div>
                <div className="text-2xl font-bold text-green-800 font-mono">
                  {receiptNumber}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-green-700 font-medium">Date</div>
                <div className="text-lg font-semibold text-green-800">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Invoice Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Invoice
                    </label>
                    <select
                      {...register('invoiceId', { required: 'Invoice is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                      disabled={!!invoice}
                    >
                      <option value="">Choose an invoice...</option>
                      {invoices.map((inv) => (
                        <option key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} - {paymentService.formatCurrency(inv.balance)} balance
                        </option>
                      ))}
                    </select>
                    {errors.invoiceId && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.invoiceId.message}
                      </p>
                    )}
                  </div>

                  {/* Selected Invoice Info */}
                  {selectedInvoice && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Invoice Details</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Invoice:</span>
                          <span className="font-medium text-gray-900">{selectedInvoice.invoiceNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Amount:</span>
                          <span className="font-medium text-gray-900">
                            {paymentService.formatCurrency(selectedInvoice.totalAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Paid Amount:</span>
                          <span className="font-medium text-green-600">
                            {paymentService.formatCurrency(selectedInvoice.paidAmount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Balance:</span>
                          <span className="font-medium text-red-600">
                            {paymentService.formatCurrency(selectedInvoice.balance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {['cash', 'card', 'bank_transfer', 'mobile_money', 'cheque'].map((method) => (
                        <label
                          key={method}
                          className={`relative cursor-pointer border rounded-xl p-4 transition-all ${
                            watch('method') === method
                              ? 'border-green-500 bg-green-50 ring-2 ring-green-500 ring-opacity-20'
                              : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                          }`}
                        >
                          <input
                            type="radio"
                            value={method}
                            {...register('method')}
                            className="sr-only"
                          />
                          <div className="flex flex-col items-center gap-2">
                            {getMethodIcon(method)}
                            <span className="text-sm font-medium text-gray-700">
                              {paymentService.formatMethodName(method)}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {getMethodDescription(watch('method'))}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount Paid
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        KES
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={availableBalance}
                        {...register('amountPaid', {
                          required: 'Amount is required',
                          min: { value: 0.01, message: 'Amount must be greater than 0' },
                          max: { 
                            value: availableBalance, 
                            message: `Amount cannot exceed ${paymentService.formatCurrency(availableBalance)}` 
                          }
                        })}
                        onChange={handleAmountChange}
                        className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        of {paymentService.formatCurrency(availableBalance)}
                      </div>
                    </div>
                    {errors.amountPaid && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.amountPaid.message}
                      </p>
                    )}
                    {selectedInvoice && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(100, (watchAmount / selectedInvoice.balance) * 100)}%` 
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>KES 0</span>
                          <span>{paymentService.formatCurrency(selectedInvoice.balance)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        {...register('paymentDate', { required: 'Payment date is required' })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Reference Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      {...register('referenceNumber', { required: 'Reference number is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="e.g., MPESA Transaction ID, Cheque #, etc."
                    />
                    {errors.referenceNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.referenceNumber.message}</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Add any notes about this payment..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div>
                <div className="text-sm text-gray-600">New Balance After Payment</div>
                <div className="text-lg font-bold text-green-700">
                  {selectedInvoice && watchAmount
                    ? paymentService.formatCurrency(selectedInvoice.balance - watchAmount)
                    : paymentService.formatCurrency(0)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      Record Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}