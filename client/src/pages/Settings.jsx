/**
 * Settings Page — Redesigned with shadcn/ui & Tailwind CSS
 * Application parameters, branding preferences, and default stock thresholds.
 */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { settingsAPI } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';
import BillingUsage from './BillingUsage';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Settings as SettingsIcon,
  Building2,
  Image,
  SunMoon,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  CreditCard,
  Globe,
  Check
} from 'lucide-react';

const Settings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') === 'billing' ? 'billing' : 'general';
  const { language, changeLanguage, supportedLanguages, t } = useLanguage();

  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [themeMode, setThemeMode] = useState('light');
  const [defaultMinStock, setDefaultMinStock] = useState(20);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await settingsAPI.get();
        if (data.settings) {
          setCompanyName(data.settings.company_name || '');
          setLogoUrl(data.settings.logo_url || '');
          setThemeMode(data.settings.theme || 'light');
          setDefaultMinStock(data.settings.default_minimum_stock || 20);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load application settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await settingsAPI.update({
        company_name: companyName,
        logo_url: logoUrl,
        theme: themeMode,
        default_minimum_stock: defaultMinStock
      });
      setSuccess(t('settings.settingsSaved', 'Settings updated successfully!'));
    } catch (err) {
      console.error(err);
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className={cn("mx-auto space-y-6 pb-12", currentTab === 'billing' ? "max-w-6xl" : "max-w-3xl")}>
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-burgundy-900/10 text-burgundy-900 dark:text-burgundy-300">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {t('settings.title', 'System Preferences')}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {t('settings.subtitle', 'Configure shop branding, portal defaults, warehouse thresholds, and subscription limits.')}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-6 border-b border-border text-sm font-medium">
        <button
          onClick={() => setSearchParams({ tab: 'general' })}
          className={cn(
            "flex items-center gap-2 pb-3 relative transition-colors",
            currentTab === 'general'
              ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <SettingsIcon className="w-4 h-4" />
          {t('settings.generalTab', 'General Preferences')}
        </button>

        <button
          onClick={() => setSearchParams({ tab: 'billing' })}
          className={cn(
            "flex items-center gap-2 pb-3 relative transition-colors",
            currentTab === 'billing'
              ? "text-foreground font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <CreditCard className="w-4 h-4" />
          {t('settings.billingTab', 'Billing & Account Limits')}
        </button>
      </div>

      {currentTab === 'billing' ? (
        <BillingUsage />
      ) : (
        <>
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* Language & Regional Localization Card */}
          <Card className="border border-border shadow-luxury">
            <CardHeader className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-serif flex items-center gap-2">
                    <Globe className="w-5 h-5 text-burgundy-900 dark:text-amber-400" />
                    {t('settings.languagePreferences', 'Language & Regional Localization')}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {t('settings.languageDescription', 'Select your preferred language for the ERP interface, ledger tables, and printable documents.')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {supportedLanguages.map((langItem) => {
                  const isSelected = language === langItem.code;
                  return (
                    <button
                      key={langItem.code}
                      type="button"
                      onClick={() => changeLanguage(langItem.code)}
                      className={cn(
                        "flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200",
                        isSelected
                          ? "border-burgundy-900/50 dark:border-amber-400/50 bg-burgundy-900/5 dark:bg-amber-400/10 shadow-sm ring-1 ring-burgundy-900/30 dark:ring-amber-400/30"
                          : "border-border hover:border-border/80 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl select-none">{langItem.flag}</span>
                        <div>
                          <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                            {langItem.nativeName}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {langItem.label} ({langItem.tag})
                          </p>
                        </div>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-burgundy-900 dark:bg-amber-400 text-white dark:text-burgundy-950 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-border" />
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-luxury">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-serif">Enterprise Profile</CardTitle>
              <CardDescription className="text-xs">
                Global configuration applied to invoices, WhatsApp dispatches, and reports.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-xs font-semibold">
                    {t('settings.companyName', 'Shop / Firm Trading Name')} *
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder={t('settings.companyPlaceholder', 'e.g. KP Creation Textiles')}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className="text-xs font-semibold">
                    {t('settings.logoUrl', 'Brand Logo Asset URL')}
                  </Label>
                  <div className="relative">
                    <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="logoUrl"
                      placeholder="https://your-domain.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="themeMode" className="text-xs font-semibold">
                      {t('settings.themePreference', 'Default Color Theme')}
                    </Label>
                    <div className="relative">
                      <SunMoon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <select
                        id="themeMode"
                        value={themeMode}
                        onChange={(e) => setThemeMode(e.target.value)}
                        className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm text-foreground focus:ring-2 focus:ring-ring"
                      >
                        <option value="light">{t('header.themeLight', 'Light Mode')}</option>
                        <option value="dark">{t('header.themeDark', 'Dark Mode')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="minStock" className="text-xs font-semibold">
                      {t('settings.defaultMinStock', 'Default Minimum Buffer (Pieces)')} *
                    </Label>
                    <div className="relative">
                      <Boxes className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="minStock"
                        type="number"
                        value={defaultMinStock}
                        onChange={(e) => setDefaultMinStock(parseInt(e.target.value, 10) || 0)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/80 flex justify-end">
                  <Button
                    type="submit"
                    variant="luxury"
                    disabled={saving}
                    className="h-10 px-6 text-xs font-bold shadow-luxury"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('common.loading', 'Saving Changes...')}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-1.5" />
                        {t('settings.saveSettings', 'Save Preferences')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
      </>
      )}
    </div>
  );
};

export default Settings;
