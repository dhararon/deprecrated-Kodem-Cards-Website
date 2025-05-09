import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { showSuccess } from '@/lib/toast';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/molecules/Form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/atoms/Select';

// Validación para configuraciones generales
const generalSettingsSchema = z.object({
    siteName: z.string().min(2, 'El nombre del sitio debe tener al menos 2 caracteres'),
    domain: z.string().url('Ingrese una URL válida'),
    language: z.string().min(1, 'Seleccione un idioma'),
    timezone: z.string().min(1, 'Seleccione una zona horaria'),
});

// Validación para preferencias de notificaciones
const notificationsSchema = z.object({
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    marketingEmails: z.boolean(),
});

type GeneralSettingsFormValues = z.infer<typeof generalSettingsSchema>;
type NotificationsFormValues = z.infer<typeof notificationsSchema>;

const Settings: React.FC = () => {
    // Formulario de configuraciones generales
    const generalSettingsForm = useForm<GeneralSettingsFormValues>({
        resolver: zodResolver(generalSettingsSchema),
        defaultValues: {
            siteName: 'Kodem Cards',
            domain: 'https://app.kodemcards.com',
            language: 'es',
            timezone: 'America/Mexico_City',
        },
    });

    // Formulario de preferencias de notificaciones
    const notificationsForm = useForm<NotificationsFormValues>({
        resolver: zodResolver(notificationsSchema),
        defaultValues: {
            emailNotifications: true,
            pushNotifications: false,
            smsNotifications: true,
            marketingEmails: false,
        },
    });

    const onGeneralSettingsSubmit = (formData: GeneralSettingsFormValues) => {
        // Utilizamos los datos del formulario para personalizar los mensajes
        console.log('Guardando configuraciones:', formData);
        showSuccess('Configuraciones guardadas correctamente', {
            description: `Se han aplicado los cambios para ${formData.siteName} (${formData.language})`
        });
    };

    const onNotificationsSubmit = (formData: NotificationsFormValues) => {
        // Utilizamos los datos del formulario para personalizar los mensajes
        const enabledChannels = [
            formData.emailNotifications ? 'Email' : null,
            formData.pushNotifications ? 'Push' : null,
            formData.smsNotifications ? 'SMS' : null
        ].filter(Boolean).join(', ');
        
        console.log('Guardando preferencias de notificaciones:', formData);
        showSuccess('Preferencias de notificaciones actualizadas', {
            description: `Canales activos: ${enabledChannels || 'Ninguno'}`
        });
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Configuración</h1>

            <div className="grid grid-cols-1 gap-8">
                {/* Configuraciones Generales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuraciones Generales</CardTitle>
                        <CardDescription>
                            Ajustes generales de la plataforma
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...generalSettingsForm}>
                            <form onSubmit={generalSettingsForm.handleSubmit(onGeneralSettingsSubmit)} className="space-y-6">
                                <FormField
                                    control={generalSettingsForm.control}
                                    name="siteName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Sitio</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={generalSettingsForm.control}
                                    name="domain"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dominio</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={generalSettingsForm.control}
                                        name="language"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Idioma</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione un idioma" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="es">Español</SelectItem>
                                                        <SelectItem value="en">Inglés</SelectItem>
                                                        <SelectItem value="fr">Francés</SelectItem>
                                                        <SelectItem value="de">Alemán</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={generalSettingsForm.control}
                                        name="timezone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Zona Horaria</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccione zona horaria" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                                                        <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                                                        <SelectItem value="Europe/Madrid">Madrid (GMT+1)</SelectItem>
                                                        <SelectItem value="Europe/London">Londres (GMT+0)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Button type="submit">Guardar Configuraciones</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                {/* Preferencias de Notificaciones */}
                <Card>
                    <CardHeader>
                        <CardTitle>Preferencias de Notificaciones</CardTitle>
                        <CardDescription>
                            Administra tus preferencias de notificaciones
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...notificationsForm}>
                            <form onSubmit={notificationsForm.handleSubmit(onNotificationsSubmit)} className="space-y-6">
                                <FormField
                                    control={notificationsForm.control}
                                    name="emailNotifications"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Notificaciones por Email</FormLabel>
                                                <FormDescription>
                                                    Recibe actualizaciones importantes por correo electrónico
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={notificationsForm.control}
                                    name="pushNotifications"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Notificaciones Push</FormLabel>
                                                <FormDescription>
                                                    Recibe notificaciones en tiempo real en el navegador
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={notificationsForm.control}
                                    name="smsNotifications"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Notificaciones SMS</FormLabel>
                                                <FormDescription>
                                                    Recibe alertas importantes por mensaje de texto
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={notificationsForm.control}
                                    name="marketingEmails"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base">Emails de Marketing</FormLabel>
                                                <FormDescription>
                                                    Recibe noticias sobre nuevas características y ofertas
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <Button type="submit">Guardar Preferencias</Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Settings; 