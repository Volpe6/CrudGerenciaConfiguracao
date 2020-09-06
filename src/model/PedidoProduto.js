const { DataTypes, Model } = require('sequelize');
const Produto = require('./produto');
const Pedido  = require('./pedido');
const sequelize = require('../config/database');

class PedidoProduto extends Model{}

PedidoProduto.init({
    quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    preco_unitario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    desconto: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
},
{
    //outras opções do modelo
    sequelize,//instancia da conexao
    modelName: 'PedidoProduto',
    tableName: 'tbpedidoproduto',
    timestamps: false
});

Pedido.belongsToMany(Produto, {
    through: PedidoProduto //tabela de relacioanamento  
});

Produto.belongsToMany(Pedido, {
    through: PedidoProduto
});

// PedidoProduto.sync({ force: true });

module.exports = PedidoProduto;