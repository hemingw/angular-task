var app = angular.module('app', ['$task']);
app.controller('main', function ($scope, $task) {
    $scope.delay = false;
    $scope.dotsFirst = [];
    $scope.dotsSecond = [];
    $scope.dotsThird = [];
    $scope.tasks = $task.tasks;
    $scope.$task = $task;

    $scope.init = function () {

        $('.code').load('js/app.js');

        // elastic timeout yields to these events, also as default
        $task.yieldToEvents(['wheel', 'keydown', 'mousedown']);

        $task.elasticTimeout('FirstGroup.FirstTask', function () {
                $scope.dotsFirst.push($scope.dotsFirst.length);
                $task.start('FirstGroup.FirstTask');
            }, 500, true, 
            function () {
                return $scope.delay ? 1000 : 0;
            }
        );
        $task.runNow('FirstGroup.FirstTask');

        $task.timeout('FirstGroup.SecondTask', function () {
            $scope.dotsSecond.push($scope.dotsSecond.length);
            $task.start('FirstGroup.SecondTask');
        }, 500);
        $task.runNow('FirstGroup.SecondTask');

        $task.interval('SecondGroup.FirstTask', function () {
            $scope.dotsThird.push($scope.dotsThird.length);
        }, 500);
        $task.runNow('SecondGroup.FirstTask');
        $task.start('SecondGroup.FirstTask');
    }
});
