import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Google reCAPTCHA verification
async function verifyCaptcha(token: string): Promise<boolean> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"; // Fallback to Test Key

    if (!secretKey) {
        console.error('RECAPTCHA_SECRET_KEY not configured');
        return false;
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
        });

        const data = await response.json();
        return data.success === true;
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fullName, email, phone, description, captchaToken } = body;

        // Validate required fields
        if (!fullName || !email || !phone || !description) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate phone format (basic validation)
        const phoneRegex = /^[\d\s+\-()]{10,20}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number format' },
                { status: 400 }
            );
        }

        // Verify Captcha
        if (!captchaToken) {
            return NextResponse.json(
                { success: false, error: 'Please complete the captcha verification' },
                { status: 400 }
            );
        }

        const isCaptchaValid = await verifyCaptcha(captchaToken);
        if (!isCaptchaValid) {
            return NextResponse.json(
                { success: false, error: 'Captcha verification failed. Please try again.' },
                { status: 400 }
            );
        }

        // Save to database
        const contactRequest = await prisma.contactRequest.create({
            data: {
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                description: description.trim(),
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you soon.',
            id: contactRequest.id,
        });

    } catch (error) {
        console.error('Contact form submission error:', error);
        return NextResponse.json(
            { success: false, error: 'An error occurred. Please try again later.' },
            { status: 500 }
        );
    }
}
