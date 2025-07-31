
```sh
./ft_transcendence.sh clear # cria o .env e os certificados https

./ft_transcendence.sh setup # apaga .env, certificados e DBs


docker compose up # sobe todos os services, terminal fica travado com os logs

docker compose up -d # sobe todos os services, terminal livre

docker compose down # para os containers e os remove

docker compose down --rmi all # para os containers, os remove, e remove as imagens

docker compose logs -f frontend # mostra logs do container de front

docker compose logs -f user-service # mostra logs do container de user-service
```

qualquer alteração no .env requer um rebuild dos containers.

no browser/insomnia, voce deve usar o ip que está no .env.

todos os containers vao fazer um reload automatico ao modificar o source code, olhe os logs do container para ver erros de sintaxe.

## bug double define

se voce tomar um bug como esse:

```
CustomElementRegistry.define: 'start-tournament' has already been defined as a custom element
```

é porque no `frontend/public/index.html`, o `<script>` foi inserido duas vezes, de um `git restore frontend/public/index.html`

