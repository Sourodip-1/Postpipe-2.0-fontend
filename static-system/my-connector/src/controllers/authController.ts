import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdapter } from '../lib/db';
import crypto from 'crypto';
import { sendEmail } from '../lib/email';

const CONNECTOR_SECRET = process.env.POSTPIPE_CONNECTOR_SECRET || 'fallback_secret';

// Helper to generate JWT
const generateToken = (user: any) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            provider: user.provider,
            email_verified: user.email_verified 
        },
        CONNECTOR_SECRET,
        { expiresIn: '7d' }
    );
};

export const registerWithEmail = async (req: Request, res: Response) => {
    try {
        const { name, email, password, projectId, targetDatabase, redirectUrl } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        await adapter.connect({ targetDatabase });

        // Check if user already exists
        const existingUser = await adapter.findUserByEmail(email, { targetDatabase });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists.' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: crypto.randomUUID(),
            email,
            name,
            password_hash,
            provider: 'email',
            provider_id: null,
            avatar: null,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
            email_verified: false
        };

        await adapter.insertUser(newUser, { targetDatabase });
        
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        await adapter.updateUserOtp(newUser.id, otp, otpExpiresAt, { targetDatabase });

        await sendEmail({
            to: email,
            subject: 'Your Verification Code',
            html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #111; margin-top: 0;">Verify your email</h2>
                    <p style="color: #555; font-size: 14px;">Use the 6-digit code below to verify your account. This code is valid for 15 minutes.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #888; font-size: 12px; margin-bottom: 0;">If you didn't request this code, you can safely ignore this email.</p>
                </div>
            `
        }).catch(e => console.error('[Auth] Failed to send OTP email:', e));

        // Remove sensitive data before sending
        const { password_hash: _, ...safeUser } = newUser;

        return res.status(201).json({ 
            message: 'Registration successful! Please enter the OTP sent to your email.', 
            user: safeUser,
            requiresOtp: true
        });
    } catch (error) {
        console.error('[Auth] Registration Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const loginWithEmail = async (req: Request, res: Response) => {
    try {
        const { email, password, projectId, targetDatabase } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        await adapter.connect({ targetDatabase });

        const user = await adapter.findUserByEmail(email, { targetDatabase });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (user.provider !== 'email' || !user.password_hash) {
            return res.status(400).json({ message: `Please login using your ${user.provider} account.` });
        }

        // Only block if explicitly false. undefined/null implies older account migration where verification wasn't tracked.
        if (user.email_verified === false) {
             return res.status(403).json({ 
                message: 'Please verify your email address before logging in.', 
                requiresOtp: true,
                userId: user.id 
             });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken(user);
        
        // Update last login
        await adapter.updateUserLastLogin(user.id, { targetDatabase });

        const { password_hash: _, ...safeUser } = user;

        return res.status(200).json({ 
            message: 'Login successful', 
            user: safeUser, 
            token 
        });
    } catch (error) {
        console.error('[Auth] Login Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const handleOAuthInitiation = async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { projectId, redirect, targetDatabase } = req.query;
    
    // Store routing state in cookie
    const stateObj = { 
        redirect: redirect || 'http://localhost:3000', 
        targetDatabase: targetDatabase || 'default' 
    };
    
    // Encode state to pass to Google/GitHub
    const encodedState = Buffer.from(JSON.stringify(stateObj)).toString('base64');
    
    // Ensure we have a dynamic callback URL based on where the connector is hosted
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/callback/${provider}`;
    
    if (provider === 'google') {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({ error: "Missing GOOGLE_CLIENT_ID in connector environment." });
        }
        
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
            `response_type=code&` +
            `scope=email%20profile&` +
            `state=${encodedState}`;
            
        return res.redirect(googleAuthUrl);
    }
    
    if (provider === 'github') {
        const clientId = process.env.GITHUB_CLIENT_ID;
        if (!clientId) {
            return res.status(500).json({ error: "Missing GITHUB_CLIENT_ID in connector environment." });
        }
        
        const githubAuthUrl = `https://github.com/login/oauth/authorize?` + 
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
            `scope=user:email&` +
            `state=${encodedState}`;
            
        return res.redirect(githubAuthUrl);
    }

    return res.status(400).json({ error: "Unsupported OAuth Provider" });
};

export const handleOAuthCallback = async (req: Request, res: Response) => {
    const { provider } = req.params;
    const { code, state, error } = req.query;
    
    if (error) {
        return res.status(400).send(`OAuth Error: ${error}`);
    }
    
    if (!code) {
        return res.status(400).send("No authorization code provided.");
    }

    let decodedState: any = {};
    try {
        if (state) {
            decodedState = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));
        }
    } catch (e) {
        console.warn("[Auth] Failed to decode OAuth state");
    }
    
    const uiRedirect = decodedState.redirect || 'http://localhost:3000';
    const targetDatabase = decodedState.targetDatabase || 'default';
    
    const callbackUrl = `${req.protocol}://${req.get('host')}/api/auth/callback/${provider}`;
    let oauthProfile: any = null;

    try {
        if (provider === 'google') {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
            
            // 1. Exchange Code for Token
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: clientId!,
                    client_secret: clientSecret!,
                    code: code as string,
                    grant_type: 'authorization_code',
                    redirect_uri: callbackUrl
                })
            });
            const tokenData = await tokenResponse.json();
            
            if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
            
            // 2. Fetch User Profile
            const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });
            const profileData = await profileResponse.json();
            
            oauthProfile = {
                id: profileData.id,
                email: profileData.email,
                name: profileData.name,
                avatar: profileData.picture
            };
        } else if (provider === 'github') {
            const clientId = process.env.GITHUB_CLIENT_ID;
            const clientSecret = process.env.GITHUB_CLIENT_SECRET;
            
            // 1. Exchange Code for Token
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code: code as string,
                    redirect_uri: callbackUrl
                })
            });
            const tokenData = await tokenResponse.json();
            if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);
            
            // 2. Fetch User Profile
            const profileResponse = await fetch('https://api.github.com/user', {
                headers: { 
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: 'application/json'
                }
            });
            const profileData = await profileResponse.json();
            
            // Github emails might be private, fetch separately if needed
            let email = profileData.email;
            if (!email) {
                const emailsResp = await fetch('https://api.github.com/user/emails', {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` }
                });
                const emails = await emailsResp.json();
                email = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
            }
            
            oauthProfile = {
                id: profileData.id.toString(),
                email: email,
                name: profileData.name || profileData.login,
                avatar: profileData.avatar_url
            };
        }
        
        if (!oauthProfile || !oauthProfile.email) {
            throw new Error("Could not retrieve email from OAuth provider");
        }

        // --- Database Sync ---
        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        let user = await adapter.findUserByEmail(oauthProfile.email, { targetDatabase });
        
        if (!user) {
            // New User Registration via OAuth
            user = {
                id: crypto.randomUUID(),
                email: oauthProfile.email,
                name: oauthProfile.name,
                password_hash: null, // No password for OAuth users
                provider: provider,
                provider_id: oauthProfile.id,
                avatar: oauthProfile.avatar,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString(),
                email_verified: true // OAuth providers already verify email
            };
            await adapter.insertUser(user, { targetDatabase });
        } else {
            // Existing User Login
            await adapter.updateUserLastLogin(user.id, { targetDatabase });
            
            // If they previously logged in with email, but now are using OAuth
            if (!user.provider || user.email_verified === false) {
                console.log(`[Auth] Existing user ${user.email} verified/linked via ${provider} OAuth.`);
                // We mark it as verified because OAuth provider confirmed it
                user.email_verified = true;
                await adapter.verifyUserEmail(user.id, { targetDatabase });
            }
        }

        // Create JWT Token using helper
        const token = generateToken(user);

        // Send back to the client UI with a token
        return res.redirect(`${uiRedirect}?pp_token=${token}`);

    } catch (e: any) {
        console.error(`[Auth] OAuth Callback Error for ${provider}:`, e);
        return res.redirect(`${uiRedirect}?error=${encodeURIComponent(e.message || "OAuth Error")}`);
    }
};

export const logout = async (req: Request, res: Response) => {
    res.clearCookie('oauth_redirect');
    return res.status(200).json({ message: 'Logged out successfully' });
};

// No direct Resend import needed here

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email, targetDatabase, redirectUrl } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        await adapter.connect({ targetDatabase });

        const user = await adapter.findUserByEmail(email, { targetDatabase });
        if (!user) {
            // Do not reveal that the user does not exist for security reasons
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
        }

        if (user.provider !== 'email') {
            return res.status(400).json({ message: `Cannot reset password for ${user.provider} accounts.` });
        }

        // Generate short-lived token (15 minutes)
        const resetToken = jwt.sign(
            { id: user.id, email: user.email, purpose: 'password_reset' },
            CONNECTOR_SECRET,
            { expiresIn: '15m' }
        );

        const frontendUrl = redirectUrl || req.headers.origin || 'http://localhost:3000';
        const resetLink = `${frontendUrl}${frontendUrl.includes('?') ? '&' : '?'}pp_action=reset-password&token=${resetToken}`;

        try {
            await sendEmail({
                to: email,
                subject: 'Password Reset Request',
                html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">Reset Password</a></p><p>This link is valid for 15 minutes.</p><p>If you didn't request this, you can safely ignore this email.</p>`
            });
        } catch (error: any) {
            console.error('[Auth] Email Sending Error:', error);
            if (error.name === 'validation_error' && error.message.includes('simplvisuals@gmail.com')) {
               return res.status(500).json({ 
                   message: 'Resend Test Mode: You can only send password reset emails to your registered Resend email address (simplvisuals@gmail.com) until you verify a domain.' 
               });
            }
            return res.status(500).json({ message: 'Failed to send reset email. ' + (error.message || '') });
        }

        return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('[Auth] Forgot Password Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword, targetDatabase } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required.' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, CONNECTOR_SECRET);
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired token.' });
        }

        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ message: 'Invalid token purpose.' });
        }

        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        await adapter.connect({ targetDatabase });

        const user = await adapter.findUserByEmail(decoded.email, { targetDatabase });
        
        if (!user || user.id !== decoded.id) {
            return res.status(400).json({ message: 'User not found or invalid token.' });
        }
        
        const password_hash = await bcrypt.hash(newPassword, 10);
        
        await adapter.updateUserPassword(user.id, password_hash, { targetDatabase });

        return res.status(200).json({ message: 'Password has been successfully reset.' });
    } catch (error) {
        console.error('[Auth] Reset Password Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { email, otp, targetDatabase } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required.' });
        }

        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        await adapter.connect({ targetDatabase });

        const user = await adapter.findUserByEmail(email, { targetDatabase });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.email_verified) {
             return res.status(200).json({ message: 'Email already verified.' });
        }

        if (!user.otp_code || user.otp_code !== otp) {
            return res.status(401).json({ message: 'Invalid OTP code.' });
        }

        const now = new Date();
        const expiresAt = new Date(user.otp_expires_at);
        if (now > expiresAt) {
            return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
        }

        await adapter.verifyUserEmail(user.id, { targetDatabase });

        const token = generateToken({ ...user, email_verified: true });

        return res.status(200).json({ 
            message: 'Email verified successfully!', 
            token,
            user: { ...user, email_verified: true }
        });
    } catch (error) {
        console.error('[Auth] OTP Verification Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    try {
        const { email, targetDatabase } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        await adapter.connect({ targetDatabase });

        const user = await adapter.findUserByEmail(email, { targetDatabase });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        
        await adapter.updateUserOtp(user.id, otp, otpExpiresAt, { targetDatabase });

        await sendEmail({
            to: email,
            subject: 'Your New Verification Code',
            html: `
                <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #111; margin-top: 0;">Verify your email</h2>
                    <p style="color: #555; font-size: 14px;">Use the new 6-digit code below to verify your account.</p>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; margin: 20px 0;">
                        ${otp}
                    </div>
                </div>
            `
        });

        return res.status(200).json({ message: 'OTP resent successfully.' });
    } catch (error) {
        console.error('[Auth] Resend OTP Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token, targetDatabase } = req.body;

        if (!token) {
            return res.status(400).json({ message: 'Verification token is required.' });
        }

        let decoded: any;
        try {
            decoded = jwt.verify(token, CONNECTOR_SECRET);
        } catch (err) {
            return res.status(400).json({ message: 'Invalid or expired verification token.' });
        }

        if (decoded.purpose !== 'email_verification') {
            console.error('[Auth] Verification Token mismatch purpose:', decoded.purpose);
            return res.status(400).json({ message: 'Invalid token purpose.' });
        }

        console.log(`[Auth] Verifying email for: ${decoded.email} (ID: ${decoded.id})`);

        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        await adapter.connect({ targetDatabase });

        const user = await adapter.findUserByEmail(decoded.email, { targetDatabase });
        
        if (!user || user.id !== decoded.id) {
            return res.status(400).json({ message: 'User not found or invalid token.' });
        }
        
        await adapter.verifyUserEmail(user.id, { targetDatabase });

        return res.status(200).json({ message: 'Email verified successfully.' });
    } catch (error) {
        console.error('[Auth] Email Verification Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const token = authHeader.split(' ')[1];
        let decoded: any;
        try {
            decoded = jwt.verify(token, CONNECTOR_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const { targetDatabase } = req.query;
        const resolvedType = process.env.DB_TYPE || 'postgres';
        const adapter = getAdapter(resolvedType);
        
        await adapter.connect({ targetDatabase: targetDatabase as string });

        const user = await adapter.findUserByEmail(decoded.email, { targetDatabase: targetDatabase as string });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { password_hash: _, ...safeUser } = user;
        return res.status(200).json(safeUser);
    } catch (error) {
        console.error('[Auth] GetMe Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
