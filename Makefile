run:
	docker build -t ft_backend ./backend
	docker run --rm -it -p 3000:3000 -v $(PWD)/data:/app/data --env-file ./backend/.env ft_backend

dev:
	docker-compose up --build

stop:
	docker-compose down

clean:
	docker system prune -f
