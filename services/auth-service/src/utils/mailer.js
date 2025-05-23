import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

export async function send2FACode(to, code) {
  await transporter.sendMail({
    from: `ft_transcendence <${process.env.MAIL_USER}>`,
    to,
    subject: 'Your authentication code',
    html: `<p>Your verification code is: <strong>${code}</strong></p>`
  })
}