'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TrustAccountSchema } from '@/lib/validation/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Building2, Percent, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TrustAccountFormProps {
  account?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface TrustAccountFormData {
  accountNumber: string;
  accountName: string;
  bankName: string;
  routingNumber: string;
  accountType: 'IOLTA' | 'NON_IOLTA' | 'IOLTA_EXEMPT' | 'SETTLEMENT' | 'OTHER';
  openingDate?: Date;
  isInterestBearing: boolean;
  interestRate?: number;
  minimumBalance: number;
  primarySignatory?: string;
  signatories?: string[];
  settings?: any;
  restrictions?: any;
}

export function TrustAccountForm({ account, onSuccess, onCancel }: TrustAccountFormProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<TrustAccountFormData>({
    resolver: zodResolver(TrustAccountSchema),
    defaultValues: {
      accountNumber: account?.accountNumber || '',
      accountName: account?.accountName || '',
      bankName: account?.bankName || '',
      routingNumber: account?.routingNumber || '',
      accountType: account?.accountType || 'IOLTA',
      isInterestBearing: account?.isInterestBearing ?? true,
      interestRate: account?.interestRate || 0,
      minimumBalance: account?.minimumBalance || 0,
    },
  });

  const watchAccountType = watch('accountType');
  const watchInterestBearing = watch('isInterestBearing');

  const onSubmit = async (data: TrustAccountFormData) => {
    try {
      setLoading(true);
      
      const url = account ? `/api/trust/accounts/${account.id}` : '/api/trust/accounts';
      const method = account ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save trust account');
      }

      toast.success(account ? 'Trust account updated successfully' : 'Trust account created successfully');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeDescription = (type: string) => {
    switch (type) {
      case 'IOLTA':
        return 'Interest on Lawyers Trust Account - Standard IOLTA account for client funds';
      case 'NON_IOLTA':
        return 'Non-interest bearing trust account for client funds';
      case 'IOLTA_EXEMPT':
        return 'Exempt from IOLTA - Large balance or short-term accounts';
      case 'SETTLEMENT':
        return 'Settlement fund account for holding settlement proceeds';
      case 'OTHER':
        return 'Other type of trust account';
      default:
        return '';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number *</Label>
              <Input
                id="accountNumber"
                placeholder="Enter account number"
                {...register('accountNumber')}
              />
              {errors.accountNumber && (
                <p className="text-sm text-red-500">{errors.accountNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name *</Label>
              <Input
                id="accountName"
                placeholder="e.g., Client Trust Account"
                {...register('accountName')}
              />
              {errors.accountName && (
                <p className="text-sm text-red-500">{errors.accountName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name *</Label>
              <Input
                id="bankName"
                placeholder="Enter bank name"
                {...register('bankName')}
              />
              {errors.bankName && (
                <p className="text-sm text-red-500">{errors.bankName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number *</Label>
              <Input
                id="routingNumber"
                placeholder="9-digit routing number"
                {...register('routingNumber')}
              />
              {errors.routingNumber && (
                <p className="text-sm text-red-500">{errors.routingNumber.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type *</Label>
            <Select 
              onValueChange={(value) => setValue('accountType', value as any)}
              defaultValue={account?.accountType || 'IOLTA'}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IOLTA">IOLTA (Interest on Lawyers Trust Account)</SelectItem>
                <SelectItem value="NON_IOLTA">Non-IOLTA (Non-interest bearing)</SelectItem>
                <SelectItem value="IOLTA_EXEMPT">IOLTA Exempt</SelectItem>
                <SelectItem value="SETTLEMENT">Settlement Account</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            {watchAccountType && (
              <p className="text-xs text-muted-foreground">
                {getAccountTypeDescription(watchAccountType)}
              </p>
            )}
            {errors.accountType && (
              <p className="text-sm text-red-500">{errors.accountType.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interest Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Interest Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isInterestBearing"
              {...register('isInterestBearing')}
              className="rounded border-gray-300"
            />
            <Label htmlFor="isInterestBearing">Interest-bearing account</Label>
          </div>

          {watchInterestBearing && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="interestRate">Interest Rate (% annual)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  {...register('interestRate', { valueAsNumber: true })}
                />
                {errors.interestRate && (
                  <p className="text-sm text-red-500">{errors.interestRate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimumBalance">Minimum Balance ($)</Label>
                <Input
                  id="minimumBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  {...register('minimumBalance', { valueAsNumber: true })}
                />
                {errors.minimumBalance && (
                  <p className="text-sm text-red-500">{errors.minimumBalance.message}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* IOLTA Compliance Notice */}
      {watchAccountType === 'IOLTA' && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>IOLTA Compliance</AlertTitle>
          <AlertDescription>
            This account will be subject to IOLTA regulations. Interest earned will be 
            remitted to the state IOLTA program. Ensure compliance with all applicable 
            ethical rules and regulations for client fund handling.
          </AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Building2 className="h-4 w-4 mr-2" />
          {loading 
            ? (account ? 'Updating...' : 'Creating...') 
            : (account ? 'Update Account' : 'Create Account')
          }
        </Button>
      </div>
    </form>
  );
}