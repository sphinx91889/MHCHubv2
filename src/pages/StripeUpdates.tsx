import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, AlertCircle, Loader2, DollarSign, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  hasPaymentMethod: boolean;
  defaultSource: any;
  sources: any[];
}

interface PaymentHistory {
  id: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  status: string;
  payment_date: string;
  last4: string;
  brand: string;
}

export default function StripeUpdates() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noPaymentCount, setNoPaymentCount] = useState<number>(0);
  const [totalPaid, setTotalPaid] = useState<number>(0);
  const [successfulPayments, setSuccessfulPayments] = useState<number>(0);
  const [failedPayments, setFailedPayments] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch customers without payment methods
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-stripe-customers`, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch customers');
        }

        const data = await response.json();
        const customersWithoutPayment = data.filter(c => !c.hasPaymentMethod).length;
        setNoPaymentCount(customersWithoutPayment);
        setCustomers(data);
        
        // Fetch payment history
        const { data: payments, error: paymentsError } = await supabase
          .from('stripe_payment_history')
          .select('*')
          .order('payment_date', { ascending: false });
          
        if (paymentsError) throw paymentsError;
        
        setPaymentHistory(payments || []);
        
        // Calculate payment stats
        const successful = payments?.filter(p => p.status === 'succeeded').length || 0;
        const failed = payments?.filter(p => p.status === 'failed').length || 0;
        const total = payments?.reduce((sum, p) => 
          p.status === 'succeeded' ? sum + (p.amount || 0) : sum, 0
        ) || 0;
        
        setSuccessfulPayments(successful);
        setFailedPayments(failed);
        setTotalPaid(total);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Failed to load customers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8 pt-5 md:pt-10">
        <div>
          <Button
            variant="outline"
            asChild
            className="mb-4"
          >
            <Link to="/clients" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Clients
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Stripe Payment Method Updates</h2>
            <p className="text-gray-500 mt-1">{noPaymentCount} clients without payment method</p>
          </div>
        </div>
      </div>
      
      {/* Payment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="glass hover:shadow-glass-hover transition-all duration-300">
          <div className="p-6 border-l-4 border-l-green-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                <div className="text-gray-500">Total Payments</div>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="glass hover:shadow-glass-hover transition-all duration-300">
          <div className="p-6 border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">{successfulPayments}</div>
                <div className="text-gray-500">Successful Payments</div>
              </div>
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="glass hover:shadow-glass-hover transition-all duration-300">
          <div className="p-6 border-l-4 border-l-red-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">{failedPayments}</div>
                <div className="text-gray-500">Failed Payments</div>
              </div>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="glass hover:shadow-glass-hover transition-all duration-300">
          <div className="p-6 border-l-4 border-l-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-2xl font-bold">{paymentHistory.length}</div>
                <div className="text-gray-500">Total Transactions</div>
              </div>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Payment History */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Card</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{payment.customer_name}</div>
                      <div className="text-sm text-gray-500">{payment.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        payment.status === 'succeeded' ? 'bg-green-100 text-green-800' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        <span>{payment.brand} •••• {payment.last4}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
      
      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {customers.map(customer => (
            <Card key={customer.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between gap-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                  {(customer.name || 'NA').substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-lg">{customer.name || 'No Name'}</h3>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>{customer.email}</p>
                        {customer.phone && <p>{customer.phone}</p>}
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      customer.hasPaymentMethod 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      <CreditCard className="w-4 h-4" />
                      {customer.hasPaymentMethod ? 'Active' : 'No Payment Method'}
                    </div>
                  </div>
                  {customer.sources?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {customer.sources.map((source: any) => (
                        <div 
                          key={source.id} 
                          className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 flex items-center gap-2"
                        >
                          <CreditCard className="w-4 h-4" />
                          {source.brand} •••• {source.last4}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}