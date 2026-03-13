import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

export const sendEmail = async (options: EmailOptions) => {
    const emailProvider = process.env.EMAIL_PROVIDER || 'resend';
    
    if (emailProvider === 'resend') {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not configured');
        }
        const resend = new Resend(apiKey);
        const { data, error } = await resend.emails.send({
            from: options.from || process.env.RESEND_FROM_EMAIL || 'Acme <onboarding@resend.dev>',
            to: [options.to],
            subject: options.subject,
            html: options.html,
        });
        if (error) throw error;
        return data;
    } else if (emailProvider === 'nodemailer') {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: options.from || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
            to: options.to,
            subject: options.subject,
            html: options.html,
        });
        return info;
    } else {
        throw new Error(`Unsupported email provider: ${emailProvider}`);
    }
};
