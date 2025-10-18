Exercício
Imagine uma aplicação para ajudar na realização de um reality show implementada pelo modelo entidade relacionamento abaixo:

Cadastrar-se no Mongodb Atlas
Obter o Atlas CLI
Descompactar arquivo zip
Acessar a pasta descompactada na pasta bin
Efetuar login no Mongo Atlas com atlas login
Você será direcionado automaticamente para a página de login do Mongo Atlas (efetuar login)
Observar no prompt de comando que será exibido um verification code que deverá ser informado novamente na página de login para autorizar o dispositivo
Criar um novo projeto atlas projects create reality-show
Definir o projeto criado como padrão (obter o id do projeto criado - Project '68d6f3eff709eb24d6b07405' created.) atlas config set project_id <id>
Criar um cluster atlas clusters create cluster01 --provider AWS --region US_EAST_1 --tier M0
Permitir que qualquer IP tenha acesso ao cluster atlas accessLists create 0.0.0.0/0
Criar um usuário atlas dbusers create readWriteAnyDatabase --projectId <projectId> --username <username> --password <password>
Opcional: efetuar o download do mongosh
Obter a string de conexão com o cluster atlas clusters connectionStrings describe cluster01
Efetuar a conexão (com a string de conexão retornada acima): mongosh mongodb+srv://<STRING_CONEXAO> -u teste -p teste
Considerando que esta aplicação deve utilizar um banco de dados noSQL implementado em MongoDB pede-se:
Pensar em como modelar este schema relacional dentro do modelo noSQL baseado em documento
Elaborar um json schema para o diagrama acima considerando reality_show, participante e premio
Criar 3 reality shows com 10 participantes cada e uma lista com 50 prêmios potenciais (dica: utilizar algum prompt de IA para gerar os arquivos no formato json e realizar a importação)
Implementar os endpoints abaixo, em nodejs que retornem:
GET /premios - exibir o nome dos reality shows, o nome de seus participantes e os prêmios já recebidos por cada um deles
GET /idade/nome_reality - exibir, pelo nome_reality (parâmetro) qual é o seu participante mais novo e o mais velho (de acordo com a idade)
GET /maior/valor - exibir o nome da emissora e o nome do reality onde alguém tenha ganho um prêmio maior ou igual ao valor informado como parâmetro
GET /total - exibir o total de prêmios distribuídos por reality show (todos)
GET /audiencia - exibir o nome e o total de pontos de audiência das emissoras
Criar uma página para votação nos candidatos de um reality show
Exibir um gráfico para acompanhar os votos recebidos pelos candidados de um reality show
