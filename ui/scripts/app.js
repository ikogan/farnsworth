'use strict';

angular
    .module('farnsworth', [
        'ngAnimate',
        'ngAria',
        'ngMaterial',
        'ngMessages',
        'ngRoute',
        'ngSanitize',
        'mdColorPicker'
    ])
    .config(function ($routeProvider) {
            $routeProvider
                .when('/', {
                    title: 'Home',
                    templateUrl: 'views/home.html',
                    controller: 'HomeController',
                    controllerAs: 'controller'
                })
                .when('/edit-tile', {
                    title: 'Edit Tile',
                    templateUrl: 'views/edit-tile.html',
                    controller: 'EditTileController',
                    controllerAs: 'controller'
                })
                .otherwise({
                    redirectTo: '/'
                });
        })
    .run(function($error, $rootScope) {
        $rootScope.$on('$routeChangeSuccess', function(event, current) {
            $rootScope.pageTitle = current.title ?
                ('Farnsworth Launcher :: ' + current.title) :
                'Farnsworth Launcher';
        });

        $rootScope.$on('$routeChangeError', function(ev, current, previous, rejection) {
            $error(rejection, action, ev);
        });
    });
