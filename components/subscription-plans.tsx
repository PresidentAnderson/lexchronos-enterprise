'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { formatCurrency, getPlanColor } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  userLimit: number;
  storageLimit: number;
  features: string[];
}

interface SubscriptionPlansProps {
  onSelectPlan?: (planId: string) => void;
  currentPlan?: string;
  loading?: boolean;
}

export function SubscriptionPlans({ onSelectPlan, currentPlan, loading }: SubscriptionPlansProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      const data = await response.json();
      
      if (data.success) {
        setPlans(data.plans);
      } else {
        toast.error('Failed to load subscription plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId.toLowerCase()) {
      case 'basic':
        return <Star className="h-6 w-6" />;
      case 'professional':
        return <Zap className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Star className="h-6 w-6" />;
    }
  };

  const getPlanDescription = (planId: string) => {
    switch (planId.toLowerCase()) {
      case 'basic':
        return 'Perfect for small law firms getting started';
      case 'professional':
        return 'Ideal for growing practices with advanced needs';
      case 'enterprise':
        return 'Complete solution for large firms and enterprises';
      default:
        return 'Legal practice management solution';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {plans.map((plan) => {
        const isCurrentPlan = currentPlan?.toLowerCase() === plan.id.toLowerCase();
        const isProfessional = plan.id.toLowerCase() === 'professional';
        
        return (
          <Card 
            key={plan.id} 
            className={`relative ${
              isProfessional 
                ? 'border-2 border-blue-500 shadow-lg scale-105' 
                : isCurrentPlan 
                ? 'border-green-500' 
                : 'hover:shadow-lg transition-shadow'
            }`}
          >
            {isProfessional && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-500 text-white px-3 py-1">
                  Current Plan
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <div className={`mx-auto p-3 rounded-full w-fit ${getPlanColor(plan.id)} border`}>
                {getPlanIcon(plan.id)}
              </div>
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                {getPlanDescription(plan.id)}
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center pb-6">
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-gray-500 ml-1">/{plan.interval}</span>
              </div>

              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">
                    {plan.userLimit === -1 ? 'Unlimited users' : `Up to ${plan.userLimit} users`}
                  </span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span className="text-sm">{plan.storageLimit}GB storage</span>
                </div>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pt-0">
              <Button
                className="w-full"
                variant={isProfessional ? "default" : isCurrentPlan ? "outline" : "outline"}
                onClick={() => onSelectPlan?.(plan.id)}
                disabled={loading || isCurrentPlan}
                size="lg"
              >
                {loading 
                  ? 'Processing...' 
                  : isCurrentPlan 
                  ? 'Current Plan' 
                  : `Start ${plan.name}`
                }
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

export default SubscriptionPlans;