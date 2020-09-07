const express           = require('express');
const controllerProduto = require('./controller/controllerProduto');
const controllerCliente = require('./controller/controllerCliente');
const controllerPedido  = require('./controller/controllerPedido');

const rotas = express.Router();

rotas.use(express.static('public'));

//Rotas de produto
/*
retorna todos os produtos com a seguinte estrutura:
{
  "result": "sucesso",
  "msg": "registros recuperados com sucesso",
  "registros": [
    {
      "id": ,
      "descricao": "",
      "fabricante": ""
    }
  ]
}
 */
rotas.get('/produto', controllerProduto.index);//retorna todos os produtos
/*
retorna o produto pelo id informado.
Exemplo: "http://localhost:3333/produto/1" retornara a seguinte estrutura de dados
{
  "result": "sucesso",
  "msg": "registro recuperado com sucesso",
  "registro": {
    "id": ,
    "descricao": "",
    "fabricante": ""
  }
}
 */
rotas.get('/produto/:id', controllerProduto.findById);//retorna um produto de id especifico
/*
remove o produto pelo id.
Exemplo: "http://localhost:3333/produto/remove/1" neste caso remove o produto cujo o id é 1
*/
rotas.get('/produto/remove/:id', controllerProduto.remove);//remove um produto pelo id
/*
atualiza/cria um registro
para atualizar um registro basta passar o id junto das outras informações no json,
para criar um registro basta passar um id em branco nas requisições.
estrutura de dados esperada:
{
	"id": "",
	"descricao": "",
	"fabricante": ""
}
*/
rotas.post('/produto', controllerProduto.store);


//Rotas do cliente
rotas.get('/cliente', controllerCliente.index);
/*
retorna o cliente pelo id informado.
Exemplo: "http://localhost:3333/cliente/1" retornara a seguinte estrutura de dados
{
  "result": "sucesso",
  "msg": "registro recuperado com sucesso",
  "registro": {
    "id": 3,
    "nome": "",
    "cpf": "",
    "logradouro": "",
    "numero": "",
    "bairro": "",
    "cidade": "",
    "cep": "",
    "estado": ""
  }
}
 */
rotas.get('/cliente/:id', controllerCliente.findById);
/*
remove o cliente pelo id.
Exemplo: "http://localhost:3333/cliente/remove/1" neste caso remove o cliente cujo o id é 1
*/
rotas.get('/cliente/remove/:id', controllerCliente.remove);
/*
retorna os dados vinculados a um cep.
exemplo: "http://localhost:3333/cliente/cep/12570000" retorna os seguintes dados:
{
  "cep": "12570-000",
  "logradouro": "",
  "complemento": "",
  "bairro": "",
  "localidade": "Aparecida",
  "uf": "SP",
  "ibge": "3502507",
  "gia": "1740",
  "ddd": "12",
  "siafi": "6149"
}
 */
rotas.get('/cliente/cep/:cep', controllerCliente.getCep);
/*
atualiza/cria um registro
para atualizar um registro basta passar o id junto das outras informações no json,
para criar um registro basta passar um id em branco nas requisições.
estrutura de dados esperada:
{
	"id"        :"",
	"nome"      : "",
	"cpf"       : "",
	"logradouro": "",
	"numero"    : "",
	"bairro"    : "",
	"cidade"    : "",
	"cep"       : "",
	"estado"    : ""
}
*/
rotas.post('/cliente', controllerCliente.store);

//Pedido
/*
retorna todos os pedidos.
estrutura:
{
  "result": "sucesso",
  "msg": "registros recuperados com sucesso",
  "registros": [
    {
      "id": ,
      "ClienteId": ,
      "Cliente": {
        "id": ,
        "nome": "",
        "cpf": "",
        "logradouro": "",
        "numero": "",
        "bairro": "",
        "cidade": "",
        "cep": "",
        "estado": ""
      },
      "Produtos": [
        {
          "id": ,
          "descricao": "",
          "fabricante": "",
          "PedidoProduto": {
            "quantidade": ,
            "preco_unitario": ,
            "desconto": ,
            "PedidoId": ,
            "ProdutoId": 
          }
        }
      ]
    }
  ]
}
 */
rotas.get('/pedido'    , controllerPedido.index);
rotas.get('/pedido/:id', controllerPedido.findById);
/*
remove o pedido pelo id.
Exemplo: "http://localhost:3333/pedido/remove/1" neste caso remove o pedido cujo o id é 1
*/
rotas.get('/pedido/remove/:id', controllerPedido.remove);

/*
estrutura de dados esperada
{
	id : "",
	cliente_id: 1,
	produtos: [
		{
			id: 1,
			quantidade    : 21,
			preco_unitario: 60,
			desconto      : 12      
		}
	]
}
 */
rotas.post('/pedido', controllerPedido.store);

module.exports = rotas;