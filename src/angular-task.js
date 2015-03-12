(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports = factory(root, require('angular'));
    } else if (typeof define === 'function' && define.amd) {
        define(['angular'], function (angular) {
            return (root.ngTask = factory(root, angular));
        });
    } else {
        root.ngTask = factory(root, root.angular);
    }
}(this, function (window, angular) {
    return angular.module('$task', []).factory('$task', ['$rootScope', '$http', '$interval', '$timeout', '$window',
        function ($rootScope, $http, $interval, $timeout, $window) {
            var tasks = {};
            var _uiActionTime = (new Date).getTime();
            var _uiActionList = [];
            var _uiActionCallback = function (e) {
                _uiActionTime = (new Date).getTime();
            }
            var uiAction = function () {
                return ((new Date).getTime() - _uiActionTime) < 1000;
            };
            var yieldToEvents = function (arr) {
                    if (_uiActionList.length) {
                        for (var i = 0; i < _uiActionList.length; i++) {
                            $window.document.removeEventListener(_uiActionList[i], _uiActionCallback);
                        }
                    }
                    for (var i = 0; i < arr.length; i++) {
                        $window.document.addEventListener(arr[i], _uiActionCallback);
                    }
                    _uiActionList = angular.copy(arr);
                }
                // default ui yields
            yieldToEvents(['wheel', 'keydown', 'mousedown']);
            var remove = function (namespace, broadcast) {
                stop(namespace,broadcast);
                delete tasks[namespace];
            };

            var stop = function (namespace, broadcast) {
                if (angular.isDefined(tasks[namespace]) && tasks[namespace].type && tasks[namespace].handler) {
                    var task = tasks[namespace];
                    if (task.type == 1 || task.type == 3) {
                        // timeout
                        $timeout.cancel(task.handler);
                        if (angular.isDefined(broadcast)) $rootScope.$broadcast('$taskStopped', {
                            namespace: namespace
                        });
                    } else {
                        $interval.cancel(task.handler);
                        task.stopped = true;
                        if (angular.isDefined(broadcast)) $rootScope.$broadcast('$taskStopped', {
                            namespace: namespace
                        });
                    }
                }
            };

            var stopAll = function (namespace, broadcast) {
                if (!angular.isDefined(namespace)) namespace = '*';
                var nss = find(namespace);
                for (var i = 0; i < nss.length; i++) {
                    stop(nss[i], broadcast);
                }
            }

            var removeAll = function (glob) {
                var nss = find(glob);
                for (var i = 0; i < nss.length; i++) {
                    remove(nss[i]);
                }
            };
            var find = function (glob) {
                if (!angular.isDefined(glob)) glob = '*';
                glob = glob.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");
                var reg = glob.replace('*', '.*?');
                var regObj = new RegExp(reg, 'i');
                var nss = [];
                angular.forEach(tasks, function (v, k) {
                    if (k.match(reg)) nss.push(k);
                });
                return nss;
            };
            var timeout = function (taskname, fn, time, invokeApply) {
                remove(taskname);
                var task = {};
                task.type = 1;
                task.fn = fn;
                task.time = time;
                task.invokeApply = invokeApply;
                task.stopped = true;
                tasks[taskname] = task;

            };
            var elasticTimeout = function (namespace, fn, time, uiYield, delayFn, invokeApply) {
                remove(namespace);
                tasks[namespace] = {
                    type: 3,
                    fn: fn,
                    delay: delayFn,
                    time: time,
                    uiYield: uiYield,
                    invokeApply: invokeApply
                };
            };
            var reScheduleOneElasticTimout = function (namespace, forceDelay) {
                var task = tasks[namespace];
                 if (!task || task.type !== 3) {
                    throw "'"+taskname+"' is not an elastic timeout task";
                    return
                }
                $timeout.cancel(task.handler);
                var delay = task.time;
                if (forceDelay) {
                    if (task.delay) delay = task.delay();
                    if (task.uiYield && delay < 1000) delay = 1000;
                }
                task.handler = $timeout(function () {
                    if (!task.uiYield || !uiAction()) {
                        if (!angular.isDefined(task.delay) || task.delay() == 0) {
                            task.fn();
                            tasks[namespace].stopped = true;
                        } else {
                            reScheduleOneElasticTimout(namespace, true);
                        }
                    } else {
                        reScheduleOneElasticTimout(namespace, true);
                    }
                }, delay, task.invokeApply);

            };

            var startOneInterval = function(namespace){
                var task = tasks[namespace];
                if (!task || task.type !== 2) {
                    throw "'"+taskname+"' is not an interval task";
                    return
                }
                $interval.cancel(task.handler);
                var handler = $interval(task.fn, task.time, task.count, task.invokeApply);
                tasks[namespace].handler = handler;
                tasks[namespace].stopped = false;
            }

            var reScheduleOneTimeout = function(taskname){
                stop(taskname);
                var task = tasks[taskname];
                if (!task || task.type !== 1) {
                    throw "'"+taskname+"' is not a timeout task";
                    return
                }
                task.handler = $timeout(function () {
                    task.fn();
                    task.stopped = true;
                }, task.time, task.invokeApply);
                task.stopped = false;
            }

            var runNow = function(taskname){
                var ts = find(taskname);
                for(var i = 0; i < ts.length; i++){
                    task = tasks[ts[i]];
                    if(task.fn) task.fn();
                }
            }

            var interval = function (namespace, fn, time, count, invokeApply) {
                remove(namespace);
                var task = {};
                task.type = 2;
                task.fn = fn;
                task.time = time;
                task.count = count;
                task.invokeApply = invokeApply;
                task.stopped = true;
                tasks[namespace] = task;
            };

            return {
                timeout: timeout,
                interval: interval,
                elasticTimeout: elasticTimeout,
                start: function (namespace) {
                    var ts = find(namespace);
                    for(var i = 0; i < ts.length; i++){
                        var task = tasks[ts[i]];
                        if(task.type == 1){
                            reScheduleOneTimeout(ts[i]);
                        }else if(task.type == 2){
                            startOneInterval(ts[i]);
                        }else if(task.type == 3){
                            reScheduleOneElasticTimout(ts[i], false);
                        }
                    }
                },
                runNow: runNow,
                remove: removeAll,
                stop: stopAll,
                get: function(namespace){
                    var ts = find(namespace);
                    var tks = {};
                    for(var i = 0; i < ts.length; i++){
                       tks[ts[i]] = (tasks[ts[i]]);
                    }
                    return tks;
                },
                tasks: tasks,
                yieldToEvents: yieldToEvents
            };
        }
    ]);
}));
