import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { Loader2, Camera } from 'lucide-react';

// Validation schema using Zod
const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  bio: z.string().max(250, { message: "Bio cannot exceed 250 characters." }).optional(),
  website_url: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  twitter: z.string().optional(),
  github: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const ProfileSettingsPane = () => {
    const { profile, setProfile, refreshProfile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

    const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: profile?.full_name || '',
            bio: profile?.bio || '',
            website_url: profile?.website_url || '',
            twitter: profile?.social_links?.twitter || '',
            github: profile?.social_links?.github || '',
        },
    });

    const onSubmit = async (data: ProfileFormData) => {
        if (!profile?.id) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: data.full_name,
                    bio: data.bio,
                    website_url: data.website_url,
                    social_links: {
                        twitter: data.twitter,
                        github: data.github,
                    },
                })
                .eq('id', profile.id);

            if (error) throw error;
            
            // Optimistically update the profile in the UI
            if (profile) {
                setProfile({
                    ...profile,
                    full_name: data.full_name,
                    bio: data.bio,
                    website_url: data.website_url,
                    social_links: {
                        twitter: data.twitter,
                        github: data.github,
                    },
                });
            }
            
            await refreshProfile();
            toast.success("Profile updated successfully!");

        } catch (error: any) {
            toast.error("Failed to update profile.", { description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleFileUpload = async (file: File, type: 'avatar' | 'banner') => {
        if (!profile?.id) return;

        type === 'avatar' ? setIsUploadingAvatar(true) : setIsUploadingBanner(true);
        const column = type === 'avatar' ? 'avatar_url' : 'banner_url';

        try {
            const filePath = `${profile.id}/${type}-${Date.now()}`;
            const { error: uploadError } = await supabase.storage
                .from(type === 'avatar' ? 'avatars' : 'banners')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(type === 'avatar' ? 'avatars' : 'banners')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ [column]: publicUrl })
                .eq('id', profile.id);

            if (updateError) throw updateError;
            
            // Optimistically update the UI with the new image
            if (profile) {
                setProfile({ ...profile, [column]: publicUrl });
            }

            await refreshProfile();
            toast.success(`${type === 'avatar' ? 'Avatar' : 'Banner'} updated successfully!`);

        } catch (error: any) {
             toast.error(`Failed to upload ${type}.`, { description: error.message });
        } finally {
            type === 'avatar' ? setIsUploadingAvatar(false) : setIsUploadingBanner(false);
        }
    };

    return (
        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader>
                <CardTitle className="text-2xl">Profile Settings</CardTitle>
                <CardDescription>Update your public profile and personal information.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-8">
                    {/* Image Upload Section */}
                    <div className="flex items-center gap-6">
                         {/* Avatar Upload */}
                        <div className="relative group">
                            <img src={profile?.avatar_url || '/placeholder-avatar.png'} alt="Avatar" className="w-24 h-24 rounded-full object-cover ring-4 ring-offset-2 ring-primary/50" />
                            <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                {isUploadingAvatar ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                            </label>
                            <input type="file" id="avatar-upload" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'avatar')} disabled={isUploadingAvatar} />
                        </div>
                         {/* Banner Upload */}
                        <div className="flex-1">
                             <Label>Banner Image</Label>
                             <div className="relative mt-2 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors group bg-cover bg-center" style={{backgroundImage: `url(${profile?.banner_url})`}}>
                                <label htmlFor="banner-upload" className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    {isUploadingBanner ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white" />}
                                </label>
                                <input type="file" id="banner-upload" className="hidden" accept="image/*" onChange={(e) => e.target.files && handleFileUpload(e.target.files[0], 'banner')} disabled={isUploadingBanner} />
                                {!profile?.banner_url && <p className="text-sm text-muted-foreground">Click to upload banner</p>}
                             </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="full_name">Full Name</Label>
                            <Controller name="full_name" control={control} render={({ field }) => <Input id="full_name" {...field} />} />
                            {errors.full_name && <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>}
                        </div>
                        <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Controller name="bio" control={control} render={({ field }) => <Textarea id="bio" {...field} placeholder="Tell us a little about yourself" />} />
                            {errors.bio && <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>}
                        </div>
                         <div>
                            <Label htmlFor="website_url">Website URL</Label>
                            <Controller name="website_url" control={control} render={({ field }) => <Input id="website_url" {...field} placeholder="https://your-website.com" />} />
                            {errors.website_url && <p className="text-sm text-destructive mt-1">{errors.website_url.message}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                                <Label htmlFor="twitter">Twitter Handle</Label>
                                <Controller name="twitter" control={control} render={({ field }) => <Input id="twitter" {...field} placeholder="@username" />} />
                           </div>
                           <div>
                                <Label htmlFor="github">GitHub Username</Label>
                                <Controller name="github" control={control} render={({ field }) => <Input id="github" {...field} placeholder="username" />} />
                           </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/30 px-6 py-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}; 