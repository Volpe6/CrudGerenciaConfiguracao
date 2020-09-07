const Cliente  = require('../model/cliente');
const axios    = require('axios');

const ControllerCliente = {
    //retorna todos os registros da tabela
    async index(req, res) {
        const registros = await Cliente.findAll();
        return res.status(200).json({
            result   : 'sucesso',
            msg      : 'registros recuperados com sucesso',
            registros: registros
        });
    },
    //procura um registro pelo id
    async findById(req, res) {
        const id = parseInt(req.params.id);
        if(isNaN(id)) {
            return res.status(200).json({
                result: 'erro',
                msg   : 'id não informado'
            });
        }
        let registro = null;
        let mensagem = '';
        try {
            registro = await Cliente.findOne({ where: { id: id } });
            registro = (!(registro == null)) ? registro.dataValues : registro;
            mensagem = registro == null? 'Registro não encontrado' : 'registro recuperado com sucesso' 
        } catch (er) {
            return res.status(200).json({
                result: 'erro',
                msg   : er.message
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
        function removeTracosPontos(sTxt) {
            //remove todo q nao é numero
            return sTxt.replace(/[^\d]+/g, '');
        }

        function isCpfValido(strCPF) {
            var soma;
            var resto;
            soma = 0;
            if (strCPF == "00000000000") {
                return false;
            }
        
            for (let i = 1; i <= 9; i++) {
                soma = soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
            } 

            resto = (soma * 10) % 11;
        
            if ((resto == 10) || (resto == 11)) {
                resto = 0;
            }  

            if (resto != parseInt(strCPF.substring(9, 10)) ) {
                return false;
            } 
        
            soma = 0;

            for (i = 1; i <= 10; i++) {
                soma = soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
            } 

            resto = (soma * 10) % 11;
        
            if ((resto == 10) || (resto == 11)) {
                resto = 0;
            } 

            if (resto != parseInt(strCPF.substring(10, 11) ) ) {
                return false;
            }
            return true;
        }

        const entidade = req.body;
        let atributosEsperados = [ 
            'nome',
            'cpf',
            'logradouro',
            'numero',
            'bairro',
            'cidade',
            'cep',
            'estado'  
        ];

        for(let i = 0; i < atributosEsperados.length; i++) {
            let atributo = atributosEsperados[i];
            if(!entidade.hasOwnProperty(`${atributo}`)) {
                return res.status(200).json({
                    result: 'erro',
                    msg   : `o campo '${atributo}' esta em branco`
                });
            }
        }

        for([key, value] of Object.entries(entidade)) {
            if(key == 'id') {
                continue;
            }
            if(typeof value == 'undefined' || value =="") {
                return res.status(200).json({
                    result: 'erro',
                    msg   : `o campo '${key}' nao foi informado`
                });
            }
        }

        entidade.cpf = removeTracosPontos(entidade.cpf);
        if(!isCpfValido(entidade.cpf)) {
            return res.status(200).json({
                result: 'erro',
                msg   : 'o cpf informado não é válido.'
            });
        }
        
        let model    = null;
        let mensagem = '';//mensagem a ser repassada ao front
        //tenta incluir/atualizar o registro
        try {
            if(entidade.id) {
                await Cliente.update({
                    nome      : entidade.nome,
                    cpf       : entidade.cpf,
                    logradouro: entidade.logradouro,
                    numero    : entidade.numero,
                    bairro    : entidade.bairro,
                    cidade    : entidade.cidade,
                    cep       : entidade.cep,
                    estado    : entidade.estado
                },{
                    where: {id: entidade.id}
                });
                mensagem = 'Registro atualizado com sucesso';
            } else {
                model = await Cliente.create({ 
                    nome      : entidade.nome,
                    cpf       : entidade.cpf,
                    logradouro: entidade.logradouro,
                    numero    : entidade.numero,
                    bairro    : entidade.bairro,
                    cidade    : entidade.cidade,
                    cep       : entidade.cep,
                    estado    : entidade.estado
                });
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
        const id = parseInt(req.params.id);
        //verifica se existe o id
        if(isNaN(id)) {
            return res.status(200).json({
                result: 'erro',
                msg   : 'id não informado'
            });
        }
        //tenta remover o registro
        try {
            await Cliente.destroy({ where: {id: id } });
        } catch (error) {
            return res.status(200).json({
                result: 'erro',
                msg   : error
            });
        }
        return res.status(200).json({
            result: 'sucesso',
            msg   : 'registro removido com sucesso'    
        });
    }, 
    async getCep(req, res) {
        const response = await axios.get(`https://viacep.com.br/ws/${req.params.cep}/json/`);
        return res.status(200).json(response.data);
    }
}

module.exports = ControllerCliente;