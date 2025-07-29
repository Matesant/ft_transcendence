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

        printf "%bGerenating SSL certificates%b\n" "$BLUE" "$RESET"
        openssl req -x509 -sha256 -nodes -days 365 -newkey rsa:2048 \
	    -keyout ./services/server.key \
	    -out ./services/server.crt \
	    -subj "/C=BR/ST=SP/L=Sao Paulo/O=42SP/OU=ft_transcendence/CN=localhost"

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
        ./frontend/server.{key,crt}
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