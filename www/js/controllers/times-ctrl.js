(function () {
  'use strict';
  angular.module('main')
    .controller('TimesCtrl', TimesCtrl)
    .controller('MeusTimesCtrl', MeusTimesCtrl)
    .controller('PerfilTimeCtrl', PerfilTimeCtrl)
    .controller('CriarTimeCtrl', CriarTimeCtrl);

    TimesCtrl.$inject = ['TimesService', 'GeoService', 'UserService', '$timeout', '$ionicModal'];
    MeusTimesCtrl .$inject = ['UserService', 'TimesService'];
    PerfilTimeCtrl.$inject = ['TimesService', 'UserService', '$state', '$timeout', 'ionicMaterialMotion', 'ionicMaterialInk', '$ionicPopup'];
    CriarTimeCtrl.$inject = ['$scope', 'TimesService', 'UserService', 'RegionService', '$ionicHistory', '$ionicSlideBoxDelegate', '$ionicModal', '$ionicLoading', '$window'];

    function TimesCtrl(TimesService, GeoService, UserService, $timeout, $ionicModal) {
        var vm = this;
        vm.timesService = TimesService;
        vm.meusTimes = UserService.times;
        vm.times = TimesService.timesRegiao;
        vm.filtrarModalidades = filtrarModalidades;

        activate();

        function activate() {
            // if(vm.times.length === 0){
            //   GeoService.getPosition().then(function(){
            //     TimesService.getTimesRegiao();
            //   });
            // }
        }

        function filtrarModalidades(time) {
            if (_.some(time.jogadores, { $id: firebase.auth().currentUser.uid })) {
                return false;
            }
            return _.some(time.modalidades, function (mod) {
                return _.some(UserService.times, function (meuTime) {
                    return _.some(meuTime.modalidades, function (minhaModalidade) {
                        return minhaModalidade === mod;
                    });
                });
            });
        }

    }

    function MeusTimesCtrl(UserService, TimesService) {
        var vm = this;
        vm.timesService = TimesService;
        vm.times = UserService.times;

        activate();

        function activate() {
        }
    }

    function PerfilTimeCtrl(TimesService, UserService, $state, $timeout, ionicMaterialMotion, ionicMaterialInk, $ionicPopup) {
        var vm = this;
        vm.time = TimesService.timeSelecionado.data;
        vm.closeModal = closeModal;
        vm.desafiarTime = desafiarTime;

        activate();

        function activate() {
        }

        function closeModal() {
            TimesService.timeSelecionado.modal.hide();
        }

        function desafiarTime() {
            if (UserService.times.length === 0) {
                var popup = $ionicPopup.confirm({
                    template: 'Você ainda não faz parte de um time.',
                    buttons: [{
                        text: 'Fechar',
                        type: 'button-stable',
                        onTap: function (e) {
                            popup.close();
                        }
                    },
                        {
                            text: 'Criar Time',
                            type: 'button-positive',
                            onTap: function (e) {
                                popup.close();
                                closeModal();
                            }
                        }]
                });
            }
            else {
                closeModal();
                $state.go('main.criarDesafio');
            }
        }

        // Set Motion
        $timeout(function () {
            ionicMaterialMotion.slideUp({
                selector: '.slide-up'
            });
        }, 300);

        // Set Ink
        ionicMaterialInk.displayEffect();

    }

    function CriarTimeCtrl($scope, TimesService, UserService, RegionService, $ionicHistory, $ionicSlideBoxDelegate, $ionicModal, $ionicLoading, $window) {
        var vm = this;
        vm.amigos = UserService.amigos;
        vm.checkMembroTime = checkMembroTime;
        vm.toggleMembroTime = toggleMembroTime;
        vm.toggleModalidade = toggleModalidade;
        vm.validForm = validForm;
        vm.criarTime = criarTime;
        vm.selecionadorEscudo = selecionadorEscudo;
        vm.openRegiaoModal = openRegiaoModal;
        vm.goBack = goBack;

        activate();

        function activate() {
            selecionadorRegiao();
            vm.novoTime = {
                jogadores: [],
                modalidades: {}
            };
            //vm.novoTime.escudo = 'http://cianortefc.com.br/img/logo_cianorte_fc.png';
        }

        function toggleMembroTime(amigo) {
            if (_.some(vm.novoTime.jogadores, { '$id': amigo.$id })) {
                var index = vm.novoTime.jogadores.indexOf(amigo);
                if (index > -1) {
                    vm.novoTime.jogadores.splice(index, 1);
                }
            }
            else {
                vm.novoTime.jogadores.push(amigo);
            }
        }

        function toggleModalidade(modalidade) {
            if (modalidade) {
                modalidade = undefined;
            }
            else {
                modalidade = true;
            }
            return modalidade;
        }

        function checkMembroTime(amigo) {
            return _.some(vm.novoTime.jogadores, { '$id': amigo.$id });
        }

        function validForm() {
            return !(vm.novoTime.nome && vm.novoTime.jogadores.length > 0);
        }

        function goBack() {
            $ionicHistory.goBack();
        }

        function criarTime() {
            var novoTime = {
                nome: vm.novoTime.nome,
                capitao: firebase.auth().currentUser.uid,
                regiao: vm.novoTime.regiao,
                modalidades: vm.novoTime.modalidades,
                escudo: vm.novoTime.escudo
            };
            $ionicLoading.show({template: 'Carregando...' });
            TimesService.criarTime(novoTime, vm.novoTime.jogadores, vm.locationNovoTime).then(function () {
                $ionicLoading.hide();
                $ionicHistory.goBack(-1);
            }, function(err){
                $ionicLoading.hide();
                console.log(err);
                $window.alert('Ops! Ocorreu um erro ao criar o time. Tente novamente mais tarde.');
            } );
        }

        function openRegiaoModal() {
            $ionicModal.fromTemplateUrl('modal/selecionar-regiao.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modalLocal = modal;
                $scope.modalLocal.show();
            });
        }

        function selecionadorRegiao() {
            $scope.search = {
                suggestions: [],
                quert: '',
                justSelected: false,
            };
            $scope.$watch('search.query', function (newValue) {
                if (newValue && !$scope.search.justSelected) {
                    RegionService.searchAddress(newValue).then(function (result) {
                        $scope.search.error = null;
                        $scope.search.suggestions = result;
                    }, function (status) {
                        $scope.search.error = 'Nenhuma região encontrada';
                    });
                }
                $scope.choosePlace = function (place) {
                    RegionService.getDetails(place.place_id).then(function (location) {
                        vm.novoTime.regiao = location.formatted_address;
                        vm.locationNovoTime = [location.geometry.location.lat(), location.geometry.location.lng()];
                        $scope.search.query = location.formatted_address;
                        $scope.search.justSelected = true;
                        $scope.search.suggestions = [];
                        $scope.modalLocal.hide();
                    });
                };
            });
        }

        function selecionadorEscudo() {

            var options = {
                'buttonLabels': ['Tirar foto', 'Selecionar da galeria'],
                'addCancelButtonWithLabel': 'Cancelar'
            };
            window.plugins.actionsheet.show(options, function (_btnIndex) {
                var picOptions = {
                    destinationType: navigator.camera.DestinationType.FILE_URI,
                    quality: 65,
                    targetWidth: 200,
                    targetHeight: 200,
                    allowEdit: true,
                    saveToPhotoAlbum: false
                };
                if (_btnIndex === 1) {
                    picOptions.sourceType = Camera.PictureSourceType.CAMERA;
                } else if (_btnIndex === 2) {
                    picOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;
                }

                navigator.camera.getPicture(onSuccess, onError, picOptions);

                function onSuccess(imageUrl) {
                    $scope.$apply(function () {
                        vm.novoTime.escudo = imageUrl;
                    });
                }

                function onError(err) {
                    console.log(err);
                }
            });
        }
    }
} ());