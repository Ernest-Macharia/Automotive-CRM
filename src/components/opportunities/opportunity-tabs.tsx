// src/components/opportunities/opportunity-tabs.tsx
'use client';

import { useState } from 'react';
import { Opportunity } from '@/types/opportunity';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Car, FileText, Receipt, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface OpportunityTabsProps {
  opportunity: Opportunity;
}

export function OpportunityTabs({ opportunity }: OpportunityTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { value: 'overview', label: 'Overview', icon: Package },
    { value: 'vehicles', label: 'Vehicles', icon: Car },
    { value: 'quotes', label: 'Quotes', icon: FileText },
    { value: 'invoices', label: 'Invoices', icon: Receipt },
    { value: 'payments', label: 'Payments', icon: DollarSign },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
      <div className="border-b border-gray-200 bg-white">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-5 h-auto bg-transparent p-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 py-3 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        <TabsContent value="overview" className="mt-0">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Opportunity Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="text-sm font-medium capitalize">{opportunity.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Source</span>
                  <span className="text-sm font-medium">{opportunity.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Assigned To</span>
                  <span className="text-sm font-medium">{opportunity.assignedTo.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium">
                    {new Date(opportunity.createdAt).toLocaleDateString('en-KE')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Name</span>
                  <span className="text-sm font-medium">{opportunity.customer.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email</span>
                  <span className="text-sm font-medium">{opportunity.customer.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phone</span>
                  <span className="text-sm font-medium">{opportunity.customer.phone}</span>
                </div>
                {opportunity.customer.companyName && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Company</span>
                    <span className="text-sm font-medium">{opportunity.customer.companyName}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehicles" className="mt-0">
          {opportunity.vehicles.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No vehicles added</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {opportunity.vehicles.map((vehicle) => (
                <Card key={vehicle.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{vehicle.registrationNumber}</p>
                        <p className="text-sm text-gray-600">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                      {vehicle.color && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: vehicle.color }}
                          />
                          <span className="text-sm text-gray-600">{vehicle.color}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quotes" className="mt-0">
          {opportunity.quotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No quotes created</p>
                <Button asChild className="mt-4">
                  <Link href={`/opportunities/${opportunity.id}/quotes/new`}>
                    Create Quote
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {opportunity.quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{quote.quoteNumber}</p>
                        <p className="text-sm text-gray-600">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                          }).format(quote.totalAmount)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          quote.status === 'approved'
                            ? 'default'
                            : quote.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {quote.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-0">
          {opportunity.invoices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No invoices generated</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {opportunity.invoices.map((invoice) => (
                <Card key={invoice.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                          }).format(invoice.totalAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          Paid: {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                          }).format(invoice.paidAmount)}
                        </p>
                        <Badge
                          variant={
                            invoice.paymentStatus === 'paid'
                              ? 'default'
                              : invoice.paymentStatus === 'partially_paid'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {invoice.paymentStatus.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="mt-0">
          {opportunity.payments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No payments recorded</p>
                <Button asChild className="mt-4">
                  <Link href={`/opportunities/${opportunity.id}/payments/new`}>
                    Record Payment
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {opportunity.payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{payment.receiptNumber}</p>
                        <p className="text-sm text-gray-600 capitalize">{payment.method.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                          }).format(payment.amountPaid)}
                        </p>
                        <p className="text-xs text-gray-600">
                          Balance: {new Intl.NumberFormat('en-KE', {
                            style: 'currency',
                            currency: 'KES',
                          }).format(payment.balanceRemaining)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}