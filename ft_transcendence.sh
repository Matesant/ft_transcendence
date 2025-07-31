#!/bin/bash

ENV_FILE_URL='https://gist.githubusercontent.com/alissonmarcs/4e116e8fd23377825c8dbe3f7286bfac/raw/147448cb6af69b8d3eab99813d52c1743c4ef8c1/gistfile1.txt'
BLUE='\033[1;34m'
RESET='\033[0m'

setup()
{
    if [ ! -f ".env" ]; then
        printf "%bDowloading .env file...%b\n" "$BLUE" "$RESET"
        curl -o ".env" $ENV_FILE_URL
        printf "\n" >> .env
        printf "%bDowload done! Generating secrets in .env...%b\n" "$BLUE" "$RESET"
        printf "JWT_SECRET=%s\n" "$(openssl rand -hex 64)" >> .env
        printf "COOKIE_SECRET=%s\n" "$(openssl rand -hex 64)" >> .env
        printf "%bSecrets done!%b\n" "$BLUE" "$RESET"
        printf "%bGenerating IP address in .env...%b\n" "$BLUE" "$RESET"
        export IP=$(hostname -I | cut -d ' ' -f 1)
        print "DEV=true" >> .env
        printf "IP=%s\n" "$IP" >> .env
        printf "%bIP address done!%b\n" "$BLUE" "$RESET"

        printf "%bGerenating SSL certificates...%b\n" "$BLUE" "$RESET"

        openssl req -x509 -nodes \
        -newkey RSA:2048       \
        -keyout ./services/root-ca.key    \
        -days 365              \
        -out ./services/root-ca.crt       \
        -subj '/C=US/ST=Denial/L=Earth/O=42SP/CN=root_CA_for_firefox'

        openssl req -nodes   \
        -newkey rsa:2048   \
        -keyout ./services/server.key \
        -out ./services/server.csr    \
        -subj "/C=US/ST=Denial/L=Earth/O=ft_trans/CN=$IP"

        openssl x509 -req    \
        -CA ./services/root-ca.crt    \
        -CAkey ./services/root-ca.key \
        -in ./services/server.csr     \
        -out ./services/server.crt    \
        -days 365          \
        -CAcreateserial    \
        -extfile <(printf "subjectAltName = IP:$IP\nauthorityKeyIdentifier = keyid,issuer\nbasicConstraints = CA:FALSE\nkeyUsage = digitalSignature, keyEncipherment\nextendedKeyUsage=serverAuth")

        cp -t ./services/user-service/ ./services/server.key ./services/server.crt
        cp -t ./services/match-service/ ./services/server.key ./services/server.crt
        cp -t ./services/game-service/ ./services/server.key ./services/server.crt
        cp -t ./services/auth-service/ ./services/server.key ./services/server.crt
        cp -t ./frontend/ ./services/server.key ./services/server.crt

        printf "%bSSL certificates generated!%b\n" "$BLUE" "$RESET"

    fi
    
}

clear()
{
    printf "%bCleaning up...%b\n" "$BLUE" "$RESET"
    rm -f .env ./services/server.{key,crt} \
        ./services/user-service/server.{key,crt} \
        ./services/match-service/server.{key,crt} \
        ./services/game-service/server.{key,crt} \
        ./services/auth-service/server.{key,crt} \
        ./frontend/server.{key,crt} \
        ./services/root-ca.{key,crt} \
        ./services/root-ca.srl \
        ./services/server.csr
    sudo rm -f ./services/{user,match,auth}-service/data/*-service.db
    printf "%bCleanup done!%b\n" "$BLUE" "$RESET"
}

case $1 in
	"setup")
		setup
		;;
	"clear")
		clear
		;;
	*)
		echo "option '$1' don't recognized"
		;;
esac
