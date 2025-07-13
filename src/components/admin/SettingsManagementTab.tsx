import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Loader2, Settings, AlertTriangle, Percent, Coins } from 'lucide-react';

type SiteSetting = {
    key: string;
    value: any;
    description: string;
};

type FormValues = {
    maintenance_mode_enabled: boolean;
    maintenance_mode_message: string;
    platform_fee_percentage: number;
    platform_fee_minimum: number;
    max_listing_images: number;
};

export const SettingsManagementTab = () => {
    const { profile: adminProfile } = useAuth();
    const { toast } = useToast();
    const [settings, setSettings] = useState<SiteSetting[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>();

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_all_site_settings');
                if (error) throw error;
                setSettings(data);
                
                // Populate form with fetched data
                const initialValues = data.reduce((acc: any, setting: SiteSetting) => {
                    if (setting.key === 'maintenance_mode') {
                        acc.maintenance_mode_enabled = setting.value.enabled;
                        acc.maintenance_mode_message = setting.value.message;
                    } else if (setting.key === 'platform_fee') {
                        acc.platform_fee_percentage = setting.value.percentage * 100; // Convert to percentage
                        acc.platform_fee_minimum = setting.value.minimum_fee;
                    } else if (setting.key === 'max_listing_images') {
                        acc.max_listing_images = setting.value.count;
                    }
                    return acc;
                }, {});
                reset(initialValues);

            } catch (error: any) {
                toast({ variant: 'destructive', title: 'Error fetching settings', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [reset, toast]);

    const onSubmit = async (data: FormValues) => {
        if (!adminProfile) return;
        setIsSaving(true);
        try {
            const updates = [
                supabase.rpc('update_site_setting', {
                    p_key: 'maintenance_mode',
                    p_value: { enabled: data.maintenance_mode_enabled, message: data.maintenance_mode_message },
                    p_admin_id: adminProfile.id
                }),
                supabase.rpc('update_site_setting', {
                    p_key: 'platform_fee',
                    p_value: { percentage: data.platform_fee_percentage / 100, minimum_fee: data.platform_fee_minimum },
                    p_admin_id: adminProfile.id
                }),
                 supabase.rpc('update_site_setting', {
                    p_key: 'max_listing_images',
                    p_value: { count: data.max_listing_images },
                    p_admin_id: adminProfile.id
                })
            ];

            const results = await Promise.all(updates);
            const firstError = results.find(res => res.error);

            if (firstError?.error) throw firstError.error;
            
            toast({ title: 'Settings saved!', description: 'Your changes have been applied successfully.' });
            reset(data); // Resets the dirty state

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error saving settings', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    if (loading) {
         return <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle /> Maintenance Mode</CardTitle>
                    <CardDescription>Temporarily disable access to the site for users while displaying a message.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="maintenance-mode" {...register("maintenance_mode_enabled")} />
                        <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
                    </div>
                    <div>
                        <Label htmlFor="maintenance-message">Maintenance Message</Label>
                        <Textarea id="maintenance-message" {...register("maintenance_mode_message")} />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-xl border-border/10 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Percent /> Platform Fees</CardTitle>
                    <CardDescription>Configure the fees charged for transactions on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="fee-percentage">Fee Percentage (%)</Label>
                        <Input id="fee-percentage" type="number" step="0.1" {...register("platform_fee_percentage", { valueAsNumber: true })} />
                    </div>
                    <div>
                        <Label htmlFor="fee-minimum">Minimum Fee ($)</Label>
                        <Input id="fee-minimum" type="number" step="0.01" {...register("platform_fee_minimum", { valueAsNumber: true })} />
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end sticky bottom-6">
                <Button type="submit" disabled={isSaving || !isDirty} size="lg">
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save All Settings
                </Button>
            </div>
        </form>
    );
}; 