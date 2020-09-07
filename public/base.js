const ControlePagina = (function(){
    const AJAX_SUCESSO = 'sucesso';
    const AJAX_FALHA   = 'erro';

    var oContainer;
    var oModal;
    var modalTitulo;
    var modalConteudo;
    var modalBotoes;
    var sAtual;

    $(window).on('popstate', function(e){
        oContainer.empty();
        e = e.originalEvent;
        if(e.state){
            sAtual = e.state.link;
            oContainer.html(e.state.html);
        }
        else {
            carregaPaginaUrl();
        }
    }).on('load', function(){
        oContainer = $('#base_pagina');
        oModal = $('#modalStatus').modal({
             show: false
            ,backdrop: 'static'
        }).on('shown.bs.modal', function(event) {
            $('.btn-primary', modalBotoes).focus();
        });
        modalTitulo   = $('#modalStatusTitulo',   oModal);
        modalConteudo = $('#modalStatusConteudo', oModal);
        modalBotoes   = $('#modalStatusBotoes',   oModal);
        $.get('//cdn.datatables.net/plug-ins/1.10.21/i18n/Portuguese-Brasil.json').then(function(oRes){
            ControlePagina.DATA_TABLES_L18N = oRes;
        })
        iniciaNavBar();
        carregaPaginaUrl();
    });

    function carregaPaginaUrl(bPush = false){
        var page = getParametroUrl('p');
        if(page){
            var id = getParametroUrl('id');
            var sUrl = page + '.html';
            if(id){
                sUrl += '?id=' + id;
            }
            carregaPagina(sUrl, bPush);
        }
        else {
            carregaPagina('bemVindo.html', bPush);
        }
    }

    function getParametroUrl(sParam){
        var params = new URLSearchParams(document.location.search.substring(1));
        return params.get(sParam);
    }

    function iniciaNavBar(){
        $('.navegacao > ul > li').each(function(){
            var oEl = $(this);
            oEl.on('click', function(sTarget){
                carregaPagina(sTarget + '.html');
            }.bind(null, oEl.attr('data-target'))).on('keydown', function(e){
                if(e.key && (e.key.toLowerCase() == 'space' || e.key.toLowerCase() == 'enter')){
                    $(this).trigger('click');
                }
            });
        });
    }

    function carregaPagina(sLink, bPush = true){
        oContainer.hide();
        $.get('/pages/' + sLink).then(function(sHtml){
            sAtual = sLink;
            oContainer.html(sHtml);
            oContainer.show();
            if(bPush){
                window.history.pushState({ "html": sHtml, link: sLink }, "", '?p=' + sLink.replace(/\?/, '&').replace(/.html(&|$)/, '$1'));
            }
        }, function(){
            carregaPagina('bemVindo.html');
        });
    }

    function recarregaPagina(){
        oContainer.hide();
        $.get('/pages/' + sAtual).then(function(sHtml){
            oContainer.html(sHtml);
            oContainer.show();
        }, function(){
            carregaPagina('bemVindo.html');
        });
    }

    function mostraModalNormal(sTitulo, sConteudo, fnOk, bDismiss = true){
        modalTitulo.html(sTitulo);
        modalConteudo.html(sConteudo);
        oModal.modal('show');
        $('.btn', modalBotoes).show().off('click');
        $('.btn-primary', modalBotoes).focus().on('click', function(){
            if(bDismiss){
                oModal.modal('hide');
            }
            if(fnOk){
                fnOk();
            }
        });
        $('.btn-secondary', modalBotoes).hide();
    }

    function mostraModalConfirma(sTitulo, sConteudo, fnOk, fnCancela, bDismissOk = true, bDismissCancela = true){
        modalTitulo.html(sTitulo);
        modalConteudo.html(sConteudo);
        oModal.modal('show');
        $('.btn', modalBotoes).show().off('click');
        $('.btn-primary', modalBotoes).focus().on('click', function(){
            if(bDismissOk){
                oModal.modal('hide');
            }
            if(fnOk){
                fnOk();
            }
        });
        $('.btn-secondary', modalBotoes).on('click', function(){
            if(bDismissCancela){
                oModal.modal('hide');
            }
            if(fnCancela){
                fnCancela();
            }
        });
    }

    function trataErroForm(oRetorno, sMensagem){
        var oConteudo = $('<div>');
        $('<p>').html(sMensagem).appendTo(oConteudo);
        if(typeof(oRetorno) == 'string'){
            $('<p>').html(oRetorno).appendTo(oConteudo);
        }
        else {
            if(oRetorno.message){
                $('<p>').html(oRetorno.message).appendTo(oConteudo);
            }
            if(oRetorno.errors){
                var oUl = $('<ul>').appendTo(oConteudo);
                oRetorno.errors.forEach(function(oErro){
                    $('<li>').html(oErro.message).appendTo(oUl);
                });
            }
        }
        mostraModalNormal('Erro!', oConteudo);
    }

    function iniciaCamposForm(oForm){
        new InputMask({
            masked: ".campo-mascara"
        });
        var oSubmit = $('button[type="submit"]', oForm);
        $('.busca-cep', oForm).on('change', function(){
            var self = $(this);
            var sVal = self.val();
            if(sVal){
                sVal = sVal.replace(/\D/g, '')
                if(sVal.length == 8){
                    oSubmit.attr('disabled', true);
                    $.get('/cliente/cep/' + sVal).then(function(oRetorno){
                        oSubmit.removeAttr('disabled');
                        trataRetornoCep.apply(self, [oForm, oRetorno]);
                    }, function(){
                        oSubmit.removeAttr('disabled');
                        mostraModalNormal('Erro!', 'Não foi possível encontrar o cep informado.', function(){
                            self.val('');
                        });
                    });
                }
            }
        });
        $('.form-externo', oForm).on('change', function(){
            var self = $(this);
            var sVal = self.val();
            $('#' + self.attr('data-alvo')).html('');
            if(sVal){
                oSubmit.attr('disabled', true);
                $.get(self.attr('data-request') + sVal).then(function(oRetorno){
                    oSubmit.removeAttr('disabled');
                    trataRetornoExterno(self, oRetorno);
                }, function(){
                    oSubmit.removeAttr('disabled');
                    mostraModalNormal('Erro!', 'Não foi possível encontrar o registro informado.', function(){
                        self.val('');
                    });
                });
            }
        });
        $('.form-numerico').each(function(){
            $(this).on('input', function() {
                var self = $(this);
                var sRegex = '[0-9]+';
                var iDec = self.attr('data-decimais');
                if(iDec){
                    sRegex += '\,?[0-9]{0,' + iDec + '}';
                }
                var oRegex = new RegExp(sRegex);
                var oMatch = self.val() && self.val().match(oRegex);
                if(!oMatch){
                    self.val('');
                }
                else {
                    self.val(oMatch[0]);
                }
                var iMax = self.attr('min');
                if(iMax && parseFloat(self.val().replace(',', '.')) < parseFloat(iMax)){
                    self.val(iMax);
                }
                var iMax = self.attr('max');
                if(iMax && parseFloat(self.val().replace(',', '.')) > parseFloat(iMax)){
                    self.val(iMax);
                }
            });
        })
        $('.cadastro-multiplo', oForm).each(function(){
            preparaCadastroMultiplo($(this));
        })
    }

    function preparaCadastroMultiplo(oObj){
        var oForm = $('>.form-cadastro-multiplo', oObj);
        oForm.detach();
        var oContainer = $('.container-cadastro-multiplo', oObj);
        var iAtual = 0;
        $('.btn-success', oObj).on('click', function(e){
            $('.cadastro-multiplo-vazio', oContainer).hide();
            iAtual++;
            var oNovoForm = oForm.clone(true).appendTo(oContainer);
            $('*', oNovoForm).each(function(){
                $(this.attributes).each(function(){
                    this.value = this.value.replace(/\{\$i\}/g, iAtual);
                });
            });
            $('>.btn-danger', oNovoForm).on('click', function(){
                oNovoForm.detach();
                if(oContainer.children().length == 1){
                    $('.cadastro-multiplo-vazio', oContainer).show();
                }
            });
            oNovoForm.show();
            $('.form-control', oNovoForm).first().focus();
            e.preventDefault();
            return false;
        });
    }

    function trataRetornoCep(oForm, oRetorno){
        if(oRetorno.erro){
            mostraModalNormal('Erro!', 'Não foi possível encontrar o cep informado.', function(){
                this.val('');
            });
        }
        else {
            $('.preenche-cep', oForm).each(function(){
                var self = $(this);
                self.val(oRetorno[self.attr('data-cep-fill') || self.attr('name')]);
            })
        }
    }

    function trataRetornoExterno(oCampo, oRetorno){
        if(oRetorno.result == AJAX_SUCESSO && oRetorno.registro != null){
            $('#' + oCampo.attr('data-alvo')).html(oRetorno.registro[oCampo.attr('data-coluna')]);
        }
        else {
            mostraModalNormal('Erro!', 'Não foi possível encontrar o registro informado.', function(){
                oCampo.val('');
            });
        }
    }

    function extraiDadosForm(oForm){
        return oForm.serializeArray().reduce(function(oAccum, oEl){
            var oCampo = $('[name="' + oEl.name + '"]', oForm);
            if(oCampo.attr('data-remove-especial')){
                oEl.value = oEl.value.replace(/\W/g, '');
            }
            if(oCampo.hasClass('form-numerico')){
                oEl.value = oEl.value.replace(',', '.');
            }
            var aEl = oEl.name.split('.');
            if(aEl.length > 1){
                var oAtual = oAccum;
                aEl.forEach(function(sEl, iEl){
                    var oMatch = sEl.match(/(\w+)\[(\d+)\]/);
                    if(iEl == aEl.length - 1){
                        if(oMatch && oMatch[2]){
                            oAtual[oMatch[1]][oMatch[2]] = oEl.value;
                        }
                        else {
                            oAtual[sEl] = oEl.value;
                        }
                    }
                    else {
                        var oNovo = {};
                        if(oMatch && oMatch[2]){
                            if(oAtual[oMatch[1]]){
                                oAtual = oAtual[oMatch[1]];
                                if(oAtual[oMatch[2]]){
                                    oAtual = oAtual[oMatch[2]];
                                }
                                else {
                                    oAtual[oMatch[2]] = oNovo;
                                    oAtual = oNovo;
                                }
                            }
                            else {
                                oAtual[oMatch[1]] = [];
                                oAtual = oAtual[oMatch[1]];
                                oAtual[oMatch[2]] = oNovo;
                                oAtual = oNovo;
                            }
                        }
                        else {
                            if(oAtual[sEl]){
                                oAtual = oAtual[sEl];
                            }
                            else {
                                oAtual[sEl] = oNovo;
                                oAtual = oNovo;
                            }
                        }
                    }
                });
            }
            else {
                oAccum[oEl.name] = oEl.value;
            }
            return oAccum
        }, {});
    }

    function limpaFormData(oAtual){
        for(var sEl in oAtual){
            if($.isArray(oAtual[sEl])){
                oAtual[sEl] = oAtual[sEl].filter(function(oEl){
                    return oEl != null;
                });
                limpaFormData(oAtual[sEl]);
            }
            else if (typeof(oAtual[sEl]) == 'object'){
                limpaFormData(oAtual[sEl]);
            }
        }
    }

    function validaFormData(oForm, oFormData){
        try {
            $('.cadastro-multiplo', oForm).each(function(oEl){
                var self = $(this);
                var aUnico = self.attr('data-unico') && self.attr('data-unico').split('.');
                if(aUnico){
                    var aAtu = [oFormData];
                    aUnico.forEach(function(sEl, iEl){
                        var aNovo = [];
                        if(iEl == aUnico.length - 1){
                            aAtu.forEach(function(oAtu){
                                if(aNovo.indexOf(oAtu[sEl]) > -1){
                                    throw new Error(self.attr('data-mensagem-unico') + ' não pode estar duplicado.');
                                }
                                if(oAtu[sEl]){
                                    aNovo.push(oAtu[sEl]);
                                }
                            });
                        }
                        else {
                            var oMatch = sEl.match(/(\w+)\[{\$i}]/);
                            if(oMatch && oMatch[1]){
                                aAtu.forEach(function(oAtu){
                                    if(oAtu[oMatch[1]]){
                                        aNovo = aNovo.concat(oAtu[oMatch[1]]);
                                    }
                                });
                            }
                            else {
                                aAtu.forEach(function(oAtu){
                                    if(oAtu[sEl]){
                                        aNovo.push(oAtu[sEl]);
                                    }
                                });
                            }
                            aAtu = aNovo;
                        }
                    })
                }
            });
        }
        catch(ex){
            mostraModalNormal('Erro!', ex.message);
            return false;
        }
        return true;
    }

    function iniciaForm(oForm, sUrl, sId, sItem, sSufixo){
        var id;
        var sOperacao = 'Incluid' + sSufixo;
        executaImediato(function(){
            id = getParametroUrl('id');
            if(id){
                $('.desativa-altera', oForm).attr('disabled', true);
                $('.oculta-altera', oForm).hide();
            }
            iniciaCamposForm();
            if(id){
                $('#tituloOperacao').html('Alterar');
                sOperacao = 'Alterad' + sSufixo;
                oContainer.hide();
                $.get({
                    url: sUrl + '/' + id
                }).then(function(oRetorno){
                    if(oRetorno.result == AJAX_SUCESSO && oRetorno.registro != null){
                        oContainer.show();
                        function aplicaValores(oAlvo, oValores, sPrefixo){
                            for (var sCampo in oValores){
                                var sCampoPref = sCampo;
                                if(sPrefixo){
                                    sCampoPref = sPrefixo + '.' + sCampo;
                                }
                                var oCampo = $('[name="' + sCampoPref + '"]', oAlvo);
                                if(oCampo.hasClass('cadastro-multiplo')){
                                    if($.isArray(oValores[sCampo])){
                                        var sOrigem = oCampo.attr('data-origem-dados');
                                        oValores[sCampo].forEach(function(oEl, iIndice){
                                            $('>.btn-success', oCampo)[0].click();
                                            if(sOrigem){
                                                oEl = oEl[sOrigem];
                                            }
                                            aplicaValores(oCampo, oEl, sCampoPref + '[' + (iIndice + 1) + ']');
                                        });
                                    }
                                }
                                else {
                                    sCampo = oCampo.attr('data-buscar') || sCampo;
                                    oCampo.val(oValores[sCampo]);
                                    oCampo.trigger('change')
                                    if(oCampo.hasClass('masked')){
                                        oCampo[0].dispatchEvent(new KeyboardEvent('keyup'));
                                    }
                                }
                            }
                        }
                        aplicaValores(oForm, oRetorno.registro, '');
                    }
                    else {
                        mostraModalNormal('Erro!', 'Registro não encontrado!', function(){
                            window.history.back();
                        });
                        id = null;
                    }
                });
            }
        });
        oForm.submit(function(e){
            e.preventDefault();
            if($(e.originalEvent.submitter).attr('type') != 'submit'){
                return false;
            }
            if(id){
                $('.desativa-altera', oForm).attr('disabled', false);
            }
            var formData = extraiDadosForm(oForm);
            limpaFormData(formData);
            formData[sId] = id;
            if(validaFormData(oForm, formData)){
                formData = JSON.stringify(formData);
                $('.desativa-altera', oForm).attr('disabled', true);
                $.post({
                    url: sUrl,
                    data: formData,
                    dataType: "json",
                    contentType : "application/json"
                }).then(getFuncaoProcessaAjaxSucesso(sItem, sSufixo, sOperacao, function(){
                    if(id){
                        window.history.back();
                    }
                    else {
                        $('.form-control').val('').first().focus()[0].scrollIntoView();
                    }
                }), processaAjaxErro);
            }
            return false;
        });
    }

    function getFuncaoProcessaAjaxSucesso(sItem, sSufixo, sOperacao, fnSucesso){
        return function(oRetorno){
            if(oRetorno.result == AJAX_FALHA){
                trataErroForm(oRetorno.msg, 'O ' + sItem + ' não foi ' + sOperacao +'...<br/>Não foi possível processar a operação...');
            }
            else {
                mostraModalNormal('Sucesso!', sItem + ' ' + sOperacao + ' com Sucesso!', function(){
                    if(fnSucesso){
                        fnSucesso();
                    }
                });
            }
        }
    }

    function executaImediato(fn){
        if(window.requestAnimationFrame){
            window.requestAnimationFrame(fn);
        }
        else {
            setTimeout(fn, 0)
        }
    }

    function processaAjaxErro(){
        mostraModalNormal('Erro Fatal!', e.responseText);
    }

    function carregaRegistrosHtml(oConfig){
        oConfig = $.extend({
            request:    ''
           ,chave:      []
           ,colunas:    []
           ,alvo:       $()
           ,manutencao: null
        }, oConfig);
        return $.get(oConfig.request).then(function(oRegistros){
            if(oRegistros.result == AJAX_SUCESSO){
                oRegistros.registros.forEach(function(oRegistro){
                    var oLinha = $('<tr>').appendTo(oConfig.alvo);
                    oConfig.colunas.forEach(function(sColuna){
                        aColunas = sColuna.split('.');
                        if(aColunas.length == 1){
                            $('<td>').html(oRegistro[sColuna]).appendTo(oLinha);
                        }
                        else {
                            $('<td>').html(preparaRegistroComplexo(aColunas, oRegistro)).appendTo(oLinha);
                        }
                    });
                    var oAcoes = $('<td>').appendTo(oLinha);
                    $('<button>').html('Remover').addClass('btn btn-danger').on('click', function(sId){
                        mostraModalConfirma('Deseja prosseguir', 'Deseja mesmo remover o registro? Os dados serão perdidos...', function(){
                            executaImediato(function(){
                                $.get(oConfig.request + '/remove/' + sId).then(getFuncaoProcessaAjaxSucesso('Registro', 'o', 'Removido'), processaAjaxErro)
                                recarregaPagina();
                            });
                        }, null, false);
                    }.bind(this, oRegistro[oConfig.chave[0]])).appendTo(oAcoes);
                    if(oConfig.manutencao){
                        $('<button>').html('Alterar').addClass('btn btn-primary').on('click', function(sId){
                            carregaPagina(oConfig.manutencao + '?id=' + sId);
                        }.bind(this, oRegistro[oConfig.chave[0]])).appendTo(oAcoes);
                    }
                });
            }
        });
    }

    function preparaRegistroComplexo(aColunas, oRegistro){
        var sAtu = aColunas.shift();
        if($.isArray(oRegistro[sAtu])){
            var aRet = [];
            oRegistro[sAtu].forEach(function(oEl){
                aRet.push(preparaRegistroComplexo($.extend([], aColunas), oEl));
            });
            return aRet.join(', ');
        }
        if(oRegistro[sAtu] && typeof(oRegistro[sAtu]) == 'object'){
            return preparaRegistroComplexo(aColunas, oRegistro[sAtu]);
        }
        return oRegistro[sAtu];
    }

    return {
         carregaPagina: carregaPagina
        ,recarregaPagina: recarregaPagina
        ,iniciaForm: iniciaForm
        ,carregaRegistrosHtml: carregaRegistrosHtml
    };
}());