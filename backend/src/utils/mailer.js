import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Ensure env variables are loaded
dotenv.config();

export const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: process.env.MAIL_USER || 'mateusviniciusgpt@gmail.com',
		pass: process.env.MAIL_PASS || 'ataque123'
	}
})

export async function send2FACode(to, code) {
	try {
		console.log('Sending 2FA code to:', to);
		const info = await transporter.sendMail({
			from: `ft_transcendence <${process.env.MAIL_USER || 'mateusviniciusgpt@gmail.com'}>`,
			to,
			subject: 'Your 2FA code',
			html: `<p>Your 2FA code is <strong>${code}</strong></p>`
		});
		console.log('2FA code sent:', info.messageId);
		return info;
	} catch (error) {
		console.error('Failed to send 2FA code:', error);
		throw error;
	}
}