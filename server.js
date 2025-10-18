
require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path'); 

const app = express();
const port = 3000;


app.use(cors());

app.use(express.json());

// index.html
app.use(express.static(path.join(__dirname, 'public')));

// URI do MongoDB Atlas no .env
const uri = process.env.MONGODB_URI;
if (!uri) {
    console.error("Erro: A variável de ambiente MONGODB_URI não foi definida. Verifique o seu ficheiro .env.");
    process.exit(1);
}

const client = new MongoClient(uri);

let realityShowsCollection;

async function connectToDb() {
    try {
        await client.connect();
        const db = client.db("reality_show"); 
        realityShowsCollection = db.collection("reality_show");
        console.log("Conectado ao MongoDB Atlas com sucesso!");
    } catch (e) {
        console.error("Não foi possível conectar ao MongoDB.", e);
        process.exit(1); 
    }
}

// --- Endpoints da API ---

// GET /premios - Exibe nome dos realities, participantes e seus prêmios
app.get('/premios', async (req, res) => {
    try {
        const pipeline = [
            {
                $project: {
                    _id: 0,
                    nome_reality: "$nome",
                    participantes: {
                        $map: {
                            input: "$participantes",
                            as: "p",
                            in: {
                                nome_participante: "$$p.nome",
                                premios: "$$p.premios_ganhos"
                            }
                        }
                    }
                }
            }
        ];
        const result = await realityShowsCollection.aggregate(pipeline).toArray();
        res.json(result);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// GET /idade/:nome_reality - Exibe o participante mais novo e o mais velho de um reality
app.get('/idade/:nome_reality', async (req, res) => {
    try {
        const { nome_reality } = req.params;
        const pipeline = [
            { $match: { nome: nome_reality } },
            { $unwind: "$participantes" },
            { $sort: { "participantes.idade": 1 } },
            {
                $group: {
                    _id: "$nome",
                    mais_novo: { $first: "$participantes" },
                    mais_velho: { $last: "$participantes" }
                }
            },
            {
                $project: {
                    _id: 0,
                    reality_show: "$_id",
                    mais_novo: { nome: "$mais_novo.nome", idade: "$mais_novo.idade" },
                    mais_velho: { nome: "$mais_velho.nome", idade: "$mais_velho.idade" }
                }
            }
        ];
        const result = await realityShowsCollection.aggregate(pipeline).toArray();
        if (result.length > 0) {
            res.json(result[0]);
        } else {
            res.status(404).send("Reality show não encontrado.");
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});


// GET /maior/:valor - Exibe o nome da emissora e o nome do reality onde alguém tenha ganho um prêmio maior ou igual ao valor informado como parâmetro
app.get('/maior/:valor', async (req, res) => {
    try {
        const valor = parseFloat(req.params.valor);
        if (isNaN(valor)) {
            return res.status(400).send("O valor deve ser um número.");
        }
        const pipeline = [
            { $unwind: "$participantes" },
            { $unwind: "$participantes.premios_ganhos" },
            {
                $match: {
                    $expr: {
                        $gte: [
                            { $toDouble: "$participantes.premios_ganhos.valor" },
                            valor
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: { nome: "$nome", emissora: "$emissora" },
                    participantes_premiados: {
                        $push: {
                            nome: "$participantes.nome",
                            premio_descricao: "$participantes.premios_ganhos.descricao",
                            premio_valor: "$participantes.premios_ganhos.valor"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    emissora: "$_id.emissora",
                    reality_show: "$_id.nome",
                    detalhes: "$participantes_premiados"
                }
            }
        ];
        const result = await realityShowsCollection.aggregate(pipeline).toArray();
        res.json(result);
    } catch (e) {
        res.status(500).send(e.message);
    }
});


// GET /total - Exibe o total de prêmios distribuídos por reality
app.get('/total', async (req, res) => {
    try {
        const pipeline = [
            { $unwind: "$participantes" },
            {
                $project: {
                    nome_reality: "$nome",
                    total_premios_participante: {
                        $size: { $ifNull: ["$participantes.premios_ganhos", []] }
                    }
                }
            },
            {
                $group: {
                    _id: "$nome_reality",
                    total_premios_distribuidos: { $sum: "$total_premios_participante" }
                }
            },
            {
                $project: {
                    _id: 0,
                    reality_show: "$_id",
                    total_premios: "$total_premios_distribuidos"
                }
            }
        ];
        const result = await realityShowsCollection.aggregate(pipeline).toArray();
        res.json(result);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// GET /audiencia - Exibe a soma de audiência por emissora
app.get('/audiencia', async (req, res) => {
    try {
        const pipeline = [
            {
                $group: {
                    _id: "$emissora",
                    total_audiencia: { $sum: "$audiencia_pontos" }
                }
            },
            {
                $project: {
                    _id: 0,
                    emissora: "$_id",
                    pontos_de_audiencia: "$total_audiencia"
                }
            },
            { $sort: { pontos_de_audiencia: -1 } }
        ];
        const result = await realityShowsCollection.aggregate(pipeline).toArray();
        res.json(result);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// PUT /votar/:nome_reality/:nome_participante - Incrementa o voto de um participante
app.put('/votar/:nome_reality/:nome_participante', async (req, res) => {
    try {
        const { nome_reality, nome_participante } = req.params;
        const result = await realityShowsCollection.updateOne(
            { "nome": nome_reality, "participantes.nome": nome_participante },
            { $inc: { "participantes.$.total_votos": 1 } }
        );

        if (result.modifiedCount === 1) {
            res.json({ message: "Voto computado com sucesso!" });
        } else {
            res.status(404).send("Reality show ou participante não encontrado.");
        }
    } catch (e) {
        res.status(500).send(e.message);
    }
});

// GET /votos/:nome_reality - Retorna os nomes e votos dos participantes de um reality
app.get('/votos/:nome_reality', async (req, res) => {
    try {
        const { nome_reality } = req.params;
        const reality = await realityShowsCollection.findOne(
            { nome: nome_reality },
            { projection: { _id: 0, "participantes.nome": 1, "participantes.total_votos": 1 } }
        );
        if (reality) {
            res.json(reality.participantes);
        } else {
            res.status(404).send('Reality show não encontrado');
        }
    } catch(e) {
        res.status(500).send(e.message);
    }
});

// --- Inicialização do Servidor ---
app.listen(port, () => {
    console.log(`API rodando em http://localhost:${port}`);
    connectToDb(); 
});

