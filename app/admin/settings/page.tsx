"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Save,
  RefreshCw,
  Database,
  Mail,
  Shield,
  Bell,
  Globe,
  Code,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Server,
  Key,
  Webhook,
  Flag
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    adminEmail: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  email: {
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromAddress: string;
    fromName: string;
  };
  security: {
    passwordMinLength: number;
    requireMfa: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    jwtExpiration: number;
    corsOrigins: string[];
  };
  features: {
    userRegistration: boolean;
    emailVerification: boolean;
    documentScanning: boolean;
    timelineGeneration: boolean;
    realTimeUpdates: boolean;
    apiAccess: boolean;
  };
  integrations: {
    stripePublicKey: string;
    stripeWebhookSecret: string;
    googleAnalyticsId: string;
    sentryDsn: string;
    slackWebhook: string;
  };
}

const defaultSettings: SystemSettings = {
  general: {
    siteName: 'LexChronos',
    siteUrl: 'https://lexchronos.com',
    adminEmail: 'admin@lexchronos.com',
    timezone: 'America/New_York',
    language: 'en',
    maintenanceMode: false,
  },
  email: {
    provider: 'smtp',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@lexchronos.com',
    smtpPass: '••••••••',
    fromAddress: 'noreply@lexchronos.com',
    fromName: 'LexChronos',
  },
  security: {
    passwordMinLength: 8,
    requireMfa: false,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    jwtExpiration: 24,
    corsOrigins: ['https://lexchronos.com', 'https://app.lexchronos.com'],
  },
  features: {
    userRegistration: true,
    emailVerification: true,
    documentScanning: true,
    timelineGeneration: true,
    realTimeUpdates: true,
    apiAccess: true,
  },
  integrations: {
    stripePublicKey: 'pk_test_••••••••',
    stripeWebhookSecret: 'whsec_••••••••',
    googleAnalyticsId: 'GA_••••••••',
    sentryDsn: 'https://••••••••@sentry.io/••••••••',
    slackWebhook: 'https://hooks.slack.com/••••••••',
  },
};

const emailTemplates = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Sent to new users after registration',
    subject: 'Welcome to LexChronos',
    lastModified: new Date('2024-01-15'),
  },
  {
    id: 'password-reset',
    name: 'Password Reset',
    description: 'Sent when users request password reset',
    subject: 'Reset Your Password',
    lastModified: new Date('2024-01-10'),
  },
  {
    id: 'invoice',
    name: 'Invoice Notification',
    description: 'Sent when new invoices are generated',
    subject: 'New Invoice Available',
    lastModified: new Date('2024-01-08'),
  },
  {
    id: 'case-update',
    name: 'Case Update',
    description: 'Sent when case status changes',
    subject: 'Case Update Notification',
    lastModified: new Date('2024-01-05'),
  },
];

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasChanges(false);
    setIsLoading(false);
  };

  const handleTestEmail = async () => {
    setIsLoading(true);
    // Simulate email test
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    // Show success notification
  };

  const handleBackupDatabase = () => {
    console.log('Starting database backup...');
    // In real app, trigger backup
  };

  const handleRestoreDatabase = () => {
    console.log('Starting database restore...');
    // In real app, trigger restore
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-300">
              Unsaved Changes
            </Badge>
          )}
          <Button 
            onClick={handleSaveSettings} 
            disabled={!hasChanges || isLoading}
          >
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic site configuration and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={settings.general.siteName}
                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteUrl">Site URL</Label>
                  <Input
                    id="siteUrl"
                    value={settings.general.siteUrl}
                    onChange={(e) => handleSettingChange('general', 'siteUrl', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.general.adminEmail}
                    onChange={(e) => handleSettingChange('general', 'adminEmail', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={settings.general.timezone}
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">America/New_York</SelectItem>
                      <SelectItem value="America/Chicago">America/Chicago</SelectItem>
                      <SelectItem value="America/Denver">America/Denver</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onChange={(e) => handleSettingChange('general', 'maintenanceMode', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
                <Badge variant="destructive" className="ml-2">
                  {settings.general.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                SMTP settings and email templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={settings.email.smtpHost}
                    onChange={(e) => handleSettingChange('email', 'smtpHost', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={settings.email.smtpPort}
                    onChange={(e) => handleSettingChange('email', 'smtpPort', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromAddress">From Address</Label>
                  <Input
                    id="fromAddress"
                    type="email"
                    value={settings.email.fromAddress}
                    onChange={(e) => handleSettingChange('email', 'fromAddress', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={settings.email.fromName}
                    onChange={(e) => handleSettingChange('email', 'fromName', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Button onClick={handleTestEmail} disabled={isLoading}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </Button>
                <span className="text-sm text-muted-foreground">
                  Test email will be sent to {settings.general.adminEmail}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Manage automated email templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emailTemplates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {template.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last modified: {template.lastModified.toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Authentication and security policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jwtExpiration">JWT Expiration (hours)</Label>
                  <Input
                    id="jwtExpiration"
                    type="number"
                    value={settings.security.jwtExpiration}
                    onChange={(e) => handleSettingChange('security', 'jwtExpiration', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="requireMfa"
                  checked={settings.security.requireMfa}
                  onChange={(e) => handleSettingChange('security', 'requireMfa', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="requireMfa">Require MFA for Admin Users</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="corsOrigins">CORS Origins</Label>
                <Input
                  id="corsOrigins"
                  value={settings.security.corsOrigins.join(', ')}
                  onChange={(e) => handleSettingChange('security', 'corsOrigins', e.target.value.split(', '))}
                  placeholder="https://example.com, https://app.example.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.features).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getFeatureDescription(key)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={value ? "default" : "secondary"}>
                      {value ? "Enabled" : "Disabled"}
                    </Badge>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleSettingChange('features', key, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Third-party Integrations
              </CardTitle>
              <CardDescription>
                API keys and webhook configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripePublicKey">Stripe Public Key</Label>
                  <Input
                    id="stripePublicKey"
                    value={settings.integrations.stripePublicKey}
                    onChange={(e) => handleSettingChange('integrations', 'stripePublicKey', e.target.value)}
                    type="password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                  <Input
                    id="googleAnalyticsId"
                    value={settings.integrations.googleAnalyticsId}
                    onChange={(e) => handleSettingChange('integrations', 'googleAnalyticsId', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sentryDsn">Sentry DSN</Label>
                  <Input
                    id="sentryDsn"
                    value={settings.integrations.sentryDsn}
                    onChange={(e) => handleSettingChange('integrations', 'sentryDsn', e.target.value)}
                    type="password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                  <Input
                    id="slackWebhook"
                    value={settings.integrations.slackWebhook}
                    onChange={(e) => handleSettingChange('integrations', 'slackWebhook', e.target.value)}
                    type="password"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Maintenance
              </CardTitle>
              <CardDescription>
                Backup, restore, and maintenance operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Button onClick={handleBackupDatabase} className="h-auto p-4 flex flex-col items-start space-y-2">
                  <div className="flex items-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span className="font-medium">Create Backup</span>
                  </div>
                  <p className="text-sm opacity-80">
                    Create a full database backup
                  </p>
                </Button>

                <Button 
                  onClick={handleRestoreDatabase} 
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span className="font-medium">Restore Backup</span>
                  </div>
                  <p className="text-sm opacity-80">
                    Restore from a backup file
                  </p>
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium">Recent Backups</h4>
                <div className="space-y-2">
                  {[
                    { name: 'backup-2024-01-19.sql', size: '245 MB', date: '2024-01-19 02:00 AM' },
                    { name: 'backup-2024-01-18.sql', size: '243 MB', date: '2024-01-18 02:00 AM' },
                    { name: 'backup-2024-01-17.sql', size: '240 MB', date: '2024-01-17 02:00 AM' },
                  ].map((backup, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="text-sm font-medium">{backup.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {backup.size} • {backup.date}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Connected</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Cache Service</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Active</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-600">Limited</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    userRegistration: 'Allow new users to register accounts',
    emailVerification: 'Require email verification for new accounts',
    documentScanning: 'Enable document scanning and OCR features',
    timelineGeneration: 'Allow automatic timeline generation from case data',
    realTimeUpdates: 'Enable real-time notifications and updates',
    apiAccess: 'Allow third-party API access to the platform'
  };
  return descriptions[key] || 'Feature configuration option';
}