/**
 * Email utilities using Inbound for sending emails
 */

import { Inbound } from '@inboundemail/sdk';
import { nanoid } from 'nanoid';

// Initialize Inbound client
const inbound = new Inbound(process.env.INBOUND_API_KEY!);

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return nanoid(32);
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail({
  email,
  name,
  token,
}: {
  email: string;
  name?: string;
  token: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${token}`;
  
  const { data, error } = await inbound.email.send({
    from: 'ZapDev <noreply@yourdomain.com>', // TODO: Update with actual domain
    to: [email],
    subject: 'Verify your email address',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify your email</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6C47FF 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ZapDev${name ? `, ${name}` : ''}!</h1>
          </div>
          
          <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 24px;">
              Thanks for signing up! Please verify your email address to get started with ZapDev.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" 
                 style="background: #6C47FF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                Verify Email Address
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #6b7280; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
              ${verifyUrl}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
              This link expires in 24 hours. If you didn't create an account with ZapDev, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ZapDev. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Welcome to ZapDev${name ? `, ${name}` : ''}!

Thanks for signing up! Please verify your email address by clicking the link below:

${verifyUrl}

Or copy and paste this link into your browser: ${verifyUrl}

This link expires in 24 hours. If you didn't create an account with ZapDev, you can safely ignore this email.

© ${new Date().getFullYear()} ZapDev. All rights reserved.`,
  });

  if (error) {
    console.error('Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }

  return data;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: {
  email: string;
  name?: string;
  token: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${token}`;
  
  const { data, error } = await inbound.email.send({
    from: 'ZapDev <noreply@yourdomain.com>', // TODO: Update with actual domain
    to: [email],
    subject: 'Reset your password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6C47FF 0%, #8B5CF6 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Reset Your Password</h1>
          </div>
          
          <div style="background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p style="font-size: 16px; margin-bottom: 24px;">
              ${name ? `Hi ${name}, ` : 'Hi, '}We received a request to reset your password for your ZapDev account.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" 
                 style="background: #6C47FF; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="font-size: 14px; color: #6b7280; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
              ${resetUrl}
            </p>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 32px; padding-top: 32px; border-top: 1px solid #e5e7eb;">
              This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 24px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} ZapDev. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `Reset Your Password

${name ? `Hi ${name}, ` : 'Hi, '}We received a request to reset your password for your ZapDev account.

Click the link below to reset your password:

${resetUrl}

Or copy and paste this link into your browser: ${resetUrl}

This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.

© ${new Date().getFullYear()} ZapDev. All rights reserved.`,
  });

  if (error) {
    console.error('Failed to send password reset email:', error);
    throw new Error('Failed to send password reset email');
  }

  return data;
}
