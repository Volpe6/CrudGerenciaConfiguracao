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
            var oNovoForm = oForm.clone().appendTo(oContainer);
            $('>.btn-danger', oNovoForm).on('click', function(){
                oNovoForm.detach();
                if(oContainer.children().length == 1){
                    $('.cadastro-multiplo-vazio', oContainer).show();
                }
            });
            oNovoForm.show();
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

    function iniciaForm(oForm, sUrl, sId, sItem, sSufixo){
        var id;
        var sOperacao = 'Incluid' + sSufixo;
        executaImediato(function(){
            iniciaCamposForm();
            id = getParametroUrl('id');
            if(id){
                $('#tituloOperacao').html('Alterar');
                sOperacao = 'Alterad' + sSufixo;
                oContainer.hide();
                $.get({
                    url: sUrl + '/' + id
                }).then(function(oRetorno){
                    if(oRetorno.result == AJAX_SUCESSO && oRetorno.registro != null){
                        oContainer.show();
                        for (var sCampo in oRetorno.registro){
                            $('[name=' + sCampo + ']', oForm).val(oRetorno.registro[sCampo]);
                        }
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
            var formData = oForm.serializeArray().reduce(function(oAccum, oEl){
                if($('[name="' + oEl.name + '"]', oForm).attr('data-remove-especial')){
                    oEl.value = oEl.value.replace(/\W/g, '');
                }
                oAccum[oEl.name] = oEl.value;
                return oAccum
            }, {});
            formData[sId] = id;
            formData = JSON.stringify(formData);
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
            e.preventDefault();
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