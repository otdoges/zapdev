import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useClerk } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, User, Settings as SettingsIcon, Bell, Shield, Palette, Calendar,
  ArrowUpRight, CheckCircle, XCircle, AlertTriangle, Activity, Trash2,
  Download, Upload, Key, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import Navigation from "@/components/Navigation";

// Types and Constants
interface SubscriptionData {
  id: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'paused';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  priceAmount: number;
  currency: string;
  interval: 'month' | 'year';
  cancelAtPeriodEnd?: boolean;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
  language: string;
  timezone: string;
  autoSave: boolean;
  betaFeatures: boolean;
}

interface ApiConfiguration {
  groqApiKey: string;
  useUserApiKey: boolean;
}

const MOCK_SUBSCRIPTION: SubscriptionData = {
  id: 'sub_123',
  planName: 'Professional',
  status: 'active',
  currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  priceAmount: 4900,
  currency: 'USD',
  interval: 'month',
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  emailNotifications: true,
  marketingEmails: false,
  weeklyReports: true,
  language: 'en',
  timezone: 'UTC',
  autoSave: true,
  betaFeatures: false,
};

const STATUS_CONFIG = {
  active: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
  canceled: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
  past_due: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertTriangle },
  trialing: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Activity },
};

// Reusable Components
const ToggleSection = ({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between">
    <div>
      <Label>{label}</Label>
      <p className="text-sm text-gray-400">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  const IconComponent = config?.icon || CheckCircle;
  
  return (
    <Badge className={`${config?.color} border`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );
};

const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="bg-blue-900/10 border-blue-500/20">
    <CardHeader>
      <CardTitle className="text-blue-400 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">{children}</CardContent>
  </Card>
);

const Settings = () => {
  const { user, isAuthenticated } = useAuth();
  const { signOut } = useClerk();
  const { getPendingEvents } = useUsageTracking();
  const navigate = useNavigate();
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [apiConfig, setApiConfig] = useState<ApiConfiguration>({ groqApiKey: '', useUserApiKey: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle');
  const [profileData, setProfileData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    bio: '',
    website: '',
  });

  // Utility Functions
  const formatCurrency = (amount: number, currency: string) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount / 100);

  const formatDate = (dateString: string) => 
    new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const updatePreference = (key: keyof UserPreferences, value: any) => 
    setPreferences(prev => ({ ...prev, [key]: value }));

  const updateApiConfig = (key: keyof ApiConfiguration, value: any) => 
    setApiConfig(prev => ({ ...prev, [key]: value }));

  const updateProfile = (key: string, value: string) =>
    setProfileData(prev => ({ ...prev, [key]: value }));

  // Billing Functions
  const handleManageBilling = async () => {
    if (!user) return;

    setIsLoadingBilling(true);
    try {
      // This would use TRPC to create customer portal session
      // const result = await trpc.stripe.createCustomerPortalSession.mutate();
      // window.location.href = result.url;

      // For now, just show an alert
      alert('Opening Stripe customer portal...');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setIsLoadingBilling(false);
    }
  };

  // API Functions
  const testGroqApiKey = async (apiKey: string) => {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.2-1b-preview',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 5,
        }),
      });
      return response.ok;
    } catch (error) {
      console.error('Error testing Groq API key:', error);
      return false;
    }
  };

  const validateAndSaveApiKey = async () => {
    if (!apiConfig.groqApiKey.trim()) return setApiKeyStatus('invalid');
    
    setApiKeyStatus('testing');
    const isValid = await testGroqApiKey(apiConfig.groqApiKey);
    
    if (isValid) {
      setApiKeyStatus('valid');
      localStorage.setItem('zapdev-api-config', JSON.stringify(apiConfig));
    } else {
      setApiKeyStatus('invalid');
    }
  };

  const clearApiKey = () => {
    setApiConfig({ groqApiKey: '', useUserApiKey: false });
    setApiKeyStatus('idle');
    localStorage.removeItem('zapdev-api-config');
  };

  const exportData = async () => {
    try {
      const data = { profile: profileData, preferences, usageEvents: getPendingEvents(), exportDate: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zapdev-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const deleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await signOut();
        navigate('/');
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  const saveWithDelay = async (action: string, data: any) => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`${action} saved:`, data);
    } catch (error) {
      console.error(`Error saving ${action}:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) return null;

    const loadData = async () => {
      setIsLoading(true);
      try {
        setSubscription(MOCK_SUBSCRIPTION);
        setProfileData({
          name: user?.fullName || '',
          email: user?.email || '',
          bio: '',
          website: '',
        });

        const savedApiConfig = localStorage.getItem('zapdev-api-config');
        if (savedApiConfig) {
          try {
            const parsed = JSON.parse(savedApiConfig);
            setApiConfig(parsed);
            if (parsed.groqApiKey) setApiKeyStatus('valid');
          } catch (error) {
            console.error('Error parsing saved API config:', error);
          }
        }
      } catch (error) {
        console.error('Error loading settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate, user]);

  // Tab Components
  const ProfileTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your personal information and profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => updateProfile('name', e.target.value)}
                className="bg-gray-800 border-gray-700 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-400"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input
              id="bio"
              value={profileData.bio}
              onChange={(e) => updateProfile('bio', e.target.value)}
              placeholder="Tell us about yourself"
              className="bg-gray-800 border-gray-700 focus:border-blue-500"
            />
          </div>
          
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="url"
              value={profileData.website}
              onChange={(e) => updateProfile('website', e.target.value)}
              placeholder="https://yourwebsite.com"
              className="bg-gray-800 border-gray-700 focus:border-blue-500"
            />
          </div>

          <Button onClick={() => saveWithDelay('Profile', profileData)} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? 'Saving...' : 'Save Profile'}
          </Button>
        </CardContent>
      </Card>

      <InfoCard title="Why Use Your Own API Key?">
        {[
          { text: "Higher Rate Limits: Personal API keys typically have higher usage limits than shared keys." },
          { text: "Better Performance: Direct access to Groq's API without sharing bandwidth." },
          { text: "Privacy: Your requests don't go through our servers when using your own key." },
          { text: "Free Tier Available: Groq offers generous free tier limits for personal use." }
        ].map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
            <p><strong>{item.text.split(':')[0]}:</strong> {item.text.split(':')[1]}</p>
          </div>
        ))}
        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
          <p className="text-gray-300 text-xs">
            <strong>Security Note:</strong> Your API key is stored locally in your browser and never sent to our servers. Only you have access to it.
          </p>
        </div>
      </InfoCard>
    </div>
  );

  const SubscriptionTab = () => (
    <div className="space-y-6">
      {subscription ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {subscription.planName} Plan
                  <StatusBadge status={subscription.status} />
                </CardTitle>
                <CardDescription>
                  {formatCurrency(subscription.priceAmount, subscription.currency)}/{subscription.interval}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                className="border-gray-700"
                onClick={handleManageBilling}
                disabled={isLoadingBilling}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                {isLoadingBilling ? 'Loading...' : 'Manage Billing'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Period Start</p>
                <p className="font-medium">{formatDate(subscription.currentPeriodStart)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Current Period End</p>
                <p className="font-medium">{formatDate(subscription.currentPeriodEnd)}</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-800 space-y-2">
              <Button variant="outline" className="w-full border-gray-700">Change Plan</Button>
              <Button variant="outline" className="w-full border-red-700 text-red-400 hover:bg-red-900/20">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No Active Subscription</h3>
            <p className="text-gray-400 mb-4">Upgrade to a paid plan to unlock more features</p>
            <Button onClick={() => navigate('/pricing')} className="bg-blue-600 hover:bg-blue-700">
              Choose a Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const PreferencesTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize your interface preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Theme</Label>
              <p className="text-sm text-gray-400">Choose your preferred color scheme</p>
            </div>
            <Select value={preferences.theme} onValueChange={(value: 'light' | 'dark' | 'system') => updatePreference('theme', value)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ToggleSection
            label="Auto-save"
            description="Automatically save your work"
            checked={preferences.autoSave}
            onChange={(checked) => updatePreference('autoSave', checked)}
          />

          <ToggleSection
            label="Beta Features"
            description="Enable experimental features"
            checked={preferences.betaFeatures}
            onChange={(checked) => updatePreference('betaFeatures', checked)}
          />
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose what notifications you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleSection
            label="Email Notifications"
            description="Receive important updates via email"
            checked={preferences.emailNotifications}
            onChange={(checked) => updatePreference('emailNotifications', checked)}
          />

          <ToggleSection
            label="Marketing Emails"
            description="Receive product updates and offers"
            checked={preferences.marketingEmails}
            onChange={(checked) => updatePreference('marketingEmails', checked)}
          />

          <ToggleSection
            label="Weekly Reports"
            description="Get weekly usage summaries"
            checked={preferences.weeklyReports}
            onChange={(checked) => updatePreference('weeklyReports', checked)}
          />
        </CardContent>
      </Card>

      <Button onClick={() => saveWithDelay('Preferences', preferences)} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
        {isSaving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );

  const PrivacyTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Control your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-gray-400">Download a copy of your data</p>
            </div>
            <Button onClick={exportData} variant="outline" className="border-gray-700">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium">Usage Analytics</h4>
              <p className="text-sm text-gray-400">Help improve our service with usage data</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-red-900/10 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription className="text-red-300/70">Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-900/20 rounded-lg border border-red-500/20">
            <div>
              <h4 className="font-medium text-red-400">Delete Account</h4>
              <p className="text-sm text-red-300/70">Permanently delete your account and all data</p>
            </div>
            <Button onClick={deleteAccount} variant="destructive" className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ApiTab = () => (
    <div className="space-y-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle>Groq API Configuration</CardTitle>
          <CardDescription>
            Configure your personal Groq API key for AI model integration. 
            <a 
              href="https://console.groq.com/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 ml-1"
            >
              Get your API key here →
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="groq-key">Groq API Key</Label>
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <Input
              id="groq-key"
              type={showApiKey ? 'text' : 'password'}
              value={apiConfig.groqApiKey}
              onChange={(e) => updateApiConfig('groqApiKey', e.target.value)}
              placeholder="gsk_..."
              className="bg-gray-800 border-gray-700 focus:border-blue-500"
            />
            <p className="text-sm text-gray-400">
              Your API key starts with "gsk_" and is stored locally on your device only.
            </p>
          </div>

          <ToggleSection
            label="Enable Personal API Key"
            description="Use your own API key instead of the default one for all requests."
            checked={apiConfig.useUserApiKey}
            onChange={(checked) => updateApiConfig('useUserApiKey', checked)}
          />

          <div className="flex items-center gap-2">
            {apiKeyStatus === 'valid' && <StatusBadge status="active" />}
            {apiKeyStatus === 'invalid' && (
              <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                <XCircle className="w-3 h-3 mr-1" />
                Invalid
              </Badge>
            )}
            {apiKeyStatus === 'testing' && (
              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                <Activity className="w-3 h-3 mr-1" />
                Testing...
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={validateAndSaveApiKey} 
              disabled={apiKeyStatus === 'testing' || !apiConfig.groqApiKey.trim()} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              {apiKeyStatus === 'testing' ? 'Testing...' : 'Test & Save API Key'}
            </Button>
            
            {apiConfig.groqApiKey && (
              <Button 
                onClick={clearApiKey} 
                variant="outline" 
                className="border-red-700 text-red-400 hover:bg-red-900/20"
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-2"
          >
            Settings
          </motion.h1>
          <p className="text-gray-400">Manage your account, subscription, and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-800">
            {[
              { value: 'profile', icon: User, label: 'Profile' },
              { value: 'subscription', icon: CreditCard, label: 'Subscription' },
              { value: 'preferences', icon: SettingsIcon, label: 'Preferences' },
              { value: 'privacy', icon: Shield, label: 'Privacy & Security' },
              { value: 'api', icon: Key, label: 'API Configuration' },
            ].map(({ value, icon: Icon, label }) => (
              <TabsTrigger key={value} value={value} className="data-[state=active]:bg-gray-800">
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="subscription"><SubscriptionTab /></TabsContent>
          <TabsContent value="preferences"><PreferencesTab /></TabsContent>
          <TabsContent value="privacy"><PrivacyTab /></TabsContent>
          <TabsContent value="api"><ApiTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings; 