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
        $('#cabecalhoPagina').on('click', function(){
            carregaPagina('bemVindo');
        });
        oModal = $('#modalStatus').modal({
             show: false
            ,backdrop: 'static'
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
            }.bind(null, oEl.attr('data-target')))
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
        $('.btn', modalBotoes).show().off('click');
        $('.btn-primary', modalBotoes).on('click', function(){
            if(bDismiss){
                oModal.modal('hide');
            }
            if(fnOk){
                fnOk();
            }
        });
        $('.btn-secondary', modalBotoes).hide();
        oModal.modal('show');
    }

    function mostraModalConfirma(sTitulo, sConteudo, fnOk, fnCancela, bDismissOk = true, bDismissCancela = true){
        modalTitulo.html(sTitulo);
        modalConteudo.html(sConteudo);
        $('.btn', modalBotoes).show().off('click');
        $('.btn-primary', modalBotoes).on('click', function(){
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
        oModal.modal('show');
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

    function iniciaForm(oForm, sUrl, sId, sItem, sSufixo){
        var id;
        var sOperacao = 'Incluid' + sSufixo;
        executaImediato(function(){
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
        })
        oForm.submit(function(e){
            var formData = oForm.serializeArray().reduce(function(oAccum, oEl){
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
                mostraModalNormal('Sucesso!', sItem + ' ' + sOperacao + ' com Sucesso!');
                $('.form-control').val('');
                if(fnSucesso){
                    fnSucesso();
                }
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
                        $('<td>').html(oRegistro[sColuna]).appendTo(oLinha);
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

    return {
         carregaPagina: carregaPagina
        ,recarregaPagina: recarregaPagina
        ,iniciaForm: iniciaForm
        ,carregaRegistrosHtml: carregaRegistrosHtml
    };
}());