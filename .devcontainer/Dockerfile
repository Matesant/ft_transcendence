FROM php:8.2-apache

# Instala dependências e extensões necessárias
RUN apt-get update && apt-get install -y \
    git curl wget unzip zip zsh fonts-powerline locales \
    openssl sqlite3 libsqlite3-dev libzip-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && a2enmod ssl && a2ensite default-ssl

# Define locale
RUN locale-gen pt_BR.UTF-8

# Instala Oh My Zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended && \
    chsh -s /bin/zsh

# Gera certificados SSL auto-assinados se não existirem
RUN mkdir -p /etc/ssl/private /etc/ssl/certs && \
    if [ ! -f /etc/ssl/private/server.key ]; then \
      openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
      -keyout /etc/ssl/private/server.key \
      -out /etc/ssl/certs/server.crt \
      -subj "/C=BR/ST=SP/L=SP/O=42/OU=42/CN=localhost"; \
    fi && chmod 600 /etc/ssl/private/server.key

# Atualiza caminhos de certificado no Apache
RUN sed -i 's|SSLCertificateFile.*|SSLCertificateFile /etc/ssl/certs/server.crt|' /etc/apache2/sites-available/default-ssl.conf && \
    sed -i 's|SSLCertificateKeyFile.*|SSLCertificateKeyFile /etc/ssl/private/server.key|' /etc/apache2/sites-available/default-ssl.conf

# Expõe portas HTTPS e HTTP
EXPOSE 80 443
