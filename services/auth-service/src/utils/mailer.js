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
    subject: 'Seu código de autenticação',
    html: `<p>Seu código de verificação é: <strong>${code}</strong></p>`
  })
}