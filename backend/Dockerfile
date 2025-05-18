FROM php:8.2-apache

# Instala extensões e dependências
RUN apt-get update && apt-get install -y \
    libzip-dev sqlite3 libsqlite3-dev openssl \
    && docker-php-ext-install pdo pdo_sqlite

# Ativa SSL
RUN a2enmod ssl && a2ensite default-ssl

# Gera certificados SSL
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/server.key \
    -out /etc/ssl/certs/server.crt \
    -subj "/C=BR/ST=SP/L=SP/O=42/OU=42/CN=localhost"

# Corrige caminhos de certificado
RUN sed -i 's|SSLCertificateFile.*|SSLCertificateFile /etc/ssl/certs/server.crt|' /etc/apache2/sites-available/default-ssl.conf && \
    sed -i 's|SSLCertificateKeyFile.*|SSLCertificateKeyFile /etc/ssl/private/server.key|' /etc/apache2/sites-available/default-ssl.conf

# Ativa mod_rewrite e permite .htaccess
RUN a2enmod rewrite && \
    sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Cria pasta de dados e dá permissão para o Apache (www-data)
RUN mkdir -p /var/www/html/data && \
    chown -R www-data:www-data /var/www/html/data && \
    chmod 777 /var/www/html/data

EXPOSE 80 443
