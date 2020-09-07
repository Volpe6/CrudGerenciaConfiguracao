const Produto       = require('../model/produto');
const Cliente       = require('../model/cliente');
const Pedido        = require('../model/pedido');
const PedidoProduto = require('../model/PedidoProduto');
const { Op }        = require('sequelize');

const ControllerProduto = {
    //retorna todos os registros da tabela
    async index(req, res) {
        let registros = null;

        try {
            registros = await Pedido.findAll({
                include: [
                    {
                        model: Cliente,
                    },
                    {
                        model: Produto,
                    }
                ]
                
            });
        } catch (er) {
            return res.status(200).json({
                result   : 'erro',
                msg      : er.message,
            });    
        }

        return res.status(200).json({
            result   : 'sucesso',
            msg      : 'registros recuperados com sucesso',
            registros:registros
        });
    },
    //procura um refistro pelo id
    async findById(req, res) {
        const { id } = req.params
        if(id === '') {
            return res.status(200).json({
                result: 'erro',
                msg   : 'id não informado'
            });
        }
        let registro = null;
        let mensagem = '';
        try {
            registro = await Pedido.findOne({ 
                include: [
                    {
                        model: Cliente,
                    },
                    {
                        model: Produto,
                    }
                ],
                where: { 
                    id: id 
                } 
            });
            registro = (!(registro == null)) ? registro.dataValues : registro;
            mensagem = registro == null? 'Registro não encontrado' : 'registro recuperado com sucesso' 
        } catch (error) {
            return res.status(200).json({
                result: 'erro',
                msg   : error
            });
        }
        return res.status(200).json({
            result  : 'sucesso',
            msg     : mensagem,
            registro: registro  
        });
    },
    //salva/atualiza
    async store(req, res) {
        function verificaCampos(obj) {}

        const entidade = req.body;
        
        let model    = null;
        let mensagem = '';//mensagem a ser repassada ao front
        //tenta incluir/atualizar o registro
        try {
            if(entidade.id) {
                await Pedido.update({ ClienteId: entidade.cliente_id },{ where: { id: entidade.id }});

                for(let i = 0; i < entidade.produtos.length; i++) {
                    let produtoPedido = entidade.produtos[i];
                    pedido = await PedidoProduto.update({
                        quantidade    : produtoPedido.quantidade,
                        preco_unitario: produtoPedido.preco_unitario,
                        desconto      : produtoPedido.desconto
                    }, {
                        where: {
                            [Op.and] : [
                                { ProdutoId:produtoPedido.id },
                                { PedidoId:entidade.id }
                            ]
                        }
                    });
                }

                mensagem = 'Registro atualizado com sucesso';
            } else {

                model = await Pedido.create({ 
                    ClienteId: entidade.cliente_id
                });

                for(let i = 0; i < entidade.produtos.length; i++) {
                    let produtoPedido = entidade.produtos[i];
                    pedido = await PedidoProduto.create({
                        PedidoId      : model.id,
                        ProdutoId     : produtoPedido.id,
                        quantidade    : produtoPedido.quantidade,
                        preco_unitario: produtoPedido.preco_unitario,
                        desconto      : produtoPedido.desconto
                    });
                }

                mensagem = 'Registro incluido com sucesso';
            }
        } catch (er) {
            return res.status(200).json({
                result: 'erro',
                msg   : er.message
            });
        }
        return res.status(200).json({
            result: 'sucesso',
            msg   : mensagem    
        });
    },
    //remove um registro pelo id
    async remove(req, res) {
        const { id } = req.params;
        //verifica se existe o id
        if(id === '') {
            return res.status(200).json({
                result: 'erro',
                msg   : 'id não informado'
            });
        }
        //tenta remover o registro
        try {
            registroPedido = await PedidoProduto.findAll({
                where: { PedidoId:id }
            });
            for(let i = 0; i < registroPedido.length; i++) {
                let registro = registroPedido[i];
                registro.destroy();
            }
            await Pedido.destroy({ where: {id: id } });
        } catch (er) {
            return res.status(200).json({
                result: 'erro',
                msg   : er.message
            });
        }
        return res.status(200).json({
            result: 'sucesso',
            msg   : 'registro removido com sucesso'    
        });
    }
}

module.exports = ControllerProduto;