import type { TwoFactorAuth } from './components/2fa-form';

declare global {
  interface HTMLElementTagNameMap {
    'two-factor-auth': TwoFactorAuth;
  }
}
