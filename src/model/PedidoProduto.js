const { DataTypes, Model } = require('sequelize');
const Produto = require('./produto');
const Pedido  = require('./pedido');
const sequelize = require('../config/database');

class PedidoProduto extends Model{}

PedidoProduto.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    quantidade: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    preco_unitario: {
        type: DataTypes.DECIMAL,
        allowNull: false
    },
    desconto: {
        type: DataTypes.DECIMAL,
        allowNull: false
    }
},
{
    //outras opções do modelo
    sequelize,//instancia da conexao
    modelName: 'pedidoProduto',
    tableName: 'tbpedidoproduto',
    timestamps: false
});

Pedido.belongsToMany(Produto, {
    through:  PedidoProduto,
    foreignKey: 'pedido_id',
    as: 'produtos'
});

Produto.belongsToMany(Pedido, {
    through: PedidoProduto,
    foreignKey: 'produto_id'
});

module.exports = PedidoProduto;