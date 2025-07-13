### Alterações do docker-compose.dev.yml:

Os containers estavam configurados de uma forma que, para uma alteração na pasta
src de algum service ter efeito, era necessário rebuildar o container.

Agora, qualquer alteração na pasta `src` da maquina real é refletida para dentro do container.

O `node` dentro do container está configurado para fazer um reload dos arquivos quando ocorre mudanças.

Quando ocorre erros de sintaxe, você pode obter informações úteis analisando o log do container:

Implementado na branch `init_ui_components` (sim, fiz coisa de backend na branch de front, só percebi quando era tarde demais, vacilo meu)

```bash
docker ps # lista os nomes dos containers
docker logs nome_do_container
```