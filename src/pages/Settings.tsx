import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  User, 
  Settings as SettingsIcon, 
  Bell,
  Shield,
  Palette,
  Calendar,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Trash2,
  Download,
  Upload
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import Navigation from "@/components/Navigation";

interface SubscriptionData {
  id: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  priceAmount: number;
  currency: string;
  interval: 'month' | 'year';
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

const Settings = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { getPendingEvents, syncPendingEvents } = useUsageTracking();
  const navigate = useNavigate();
  
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    emailNotifications: true,
    marketingEmails: false,
    weeklyReports: true,
    language: 'en',
    timezone: 'UTC',
    autoSave: true,
    betaFeatures: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: '',
    website: '',
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Load settings data
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Mock subscription data
        const mockSubscription: SubscriptionData = {
          id: 'sub_123',
          planName: 'Professional',
          status: 'active',
          currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          priceAmount: 4900, // $49.00 in cents
          currency: 'USD',
          interval: 'month',
        };

        setSubscription(mockSubscription);
        setProfileData({
          name: user?.name || '',
          email: user?.email || '',
          bio: '',
          website: '',
        });
      } catch (error) {
        console.error('Error loading settings data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, navigate, user]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
      canceled: { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
      past_due: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: AlertTriangle },
      trialing: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Activity },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config?.icon || CheckCircle;

    return (
      <Badge className={`${config?.color} border`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      // TODO: Save profile via TRPC
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      console.log('Profile saved:', profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      // TODO: Save preferences via TRPC
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
      console.log('Preferences saved:', preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const data = {
        profile: profileData,
        preferences,
        usageEvents: getPendingEvents(),
        exportDate: new Date().toISOString(),
      };
      
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
        // TODO: Delete account via TRPC
        logout();
        navigate('/');
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

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
        {/* Header */}
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
            <TabsTrigger value="profile" className="data-[state=active]:bg-gray-800">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="subscription" className="data-[state=active]:bg-gray-800">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="preferences" className="data-[state=active]:bg-gray-800">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-gray-800">
              <Shield className="w-4 h-4 mr-2" />
              Privacy & Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
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
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
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
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
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
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="bg-gray-800 border-gray-700 focus:border-blue-500"
                  />
                </div>

                <Button onClick={saveProfile} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6">
            {subscription ? (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {subscription.planName} Plan
                        {getStatusBadge(subscription.status)}
                      </CardTitle>
                      <CardDescription>
                        {formatCurrency(subscription.priceAmount, subscription.currency)}/{subscription.interval}
                      </CardDescription>
                    </div>
                    <Button variant="outline" className="border-gray-700">
                      <ArrowUpRight className="w-4 h-4 mr-2" />
                      Manage Billing
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
                    <Button variant="outline" className="w-full border-gray-700">
                      Change Plan
                    </Button>
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
                  <Button onClick={() => navigate('/#pricing')} className="bg-blue-600 hover:bg-blue-700">
                    Choose a Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
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
                  <Select value={preferences.theme} onValueChange={(value: 'light' | 'dark' | 'system') => 
                    setPreferences({ ...preferences, theme: value })
                  }>
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

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save</Label>
                    <p className="text-sm text-gray-400">Automatically save your work</p>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, autoSave: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Beta Features</Label>
                    <p className="text-sm text-gray-400">Enable experimental features</p>
                  </div>
                  <Switch
                    checked={preferences.betaFeatures}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, betaFeatures: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-400">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-gray-400">Receive product updates and offers</p>
                  </div>
                  <Switch
                    checked={preferences.marketingEmails}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, marketingEmails: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-gray-400">Get weekly usage summaries</p>
                  </div>
                  <Switch
                    checked={preferences.weeklyReports}
                    onCheckedChange={(checked) => setPreferences({ ...preferences, weeklyReports: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={savePreferences} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
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
                <CardDescription className="text-red-300/70">
                  Irreversible and destructive actions
                </CardDescription>
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings; 