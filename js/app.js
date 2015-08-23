// create app and pass it required modules
var jessesnyder = angular.module('jessesnyder',
  ['ngRoute', 'appControllers']);

var appControllers = angular.module('appControllers', []);

// define routes and their controllers
jessesnyder.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/about', {
      templateUrl: 'views/about.html'
  }).
    when('/portfolio', {
      templateUrl: 'views/portfolio.html'
  }).
    when('/contact', {
      templateUrl: 'views/contact.html'
  }).
    otherwise({
      redirectTo: '/about'
  });

}]);
