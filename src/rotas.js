const express           = require('express');
const controllerProduto = require('./controller/controllerProduto');
const controllerCliente = require('./controller/controllerCliente');

const rotas = express.Router();

rotas.use(express.static('public'));

//Rotas de produto
rotas.get('/produto'           , controllerProduto.index);//retorna todos os produtos
rotas.get('/produto/:id'       , controllerProduto.findById);//retorna um produto de id especifico
rotas.get('/produto/remove/:id', controllerProduto.remove);//remove um produto pelo id
/*
atualiza/cria um registro
para atualizar um registro basta passar o id junto das outras informações no json,
para criar um registro basta passar um id em branco nas requisições
*/
rotas.post('/produto', controllerProduto.store);


//Rotas do cliente
rotas.get('/cliente'           , controllerCliente.index);
rotas.get('/cliente/:id'       , controllerCliente.findById);
rotas.get('/cliente/remove/:id', controllerCliente.remove);
rotas.get('/cliente/cep/:cep'  , controllerCliente.getCep);

rotas.post('/cliente', controllerCliente.store);

//Pedido
rotas.post('/pedido', controllerCliente.store);

module.exports = rotas;