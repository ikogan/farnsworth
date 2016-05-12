'use strict';

/**
 * Function to handle generic dialogs with hotkeys as buttons.
 * This works similarly to $mdDialog and provides the following
 * methods:
 *
 * - prompt(string): Set the dialog's prompt text. This defaults to blank
 *      and will simply only display buttons if it's empty.
 * - template(url): Set the dialog's template URL. This defaults to the
 * 		`hotkey-dialog.html`. Note that overriding it and making practical
 * 		use of this service is a little beyond the scope of this comment,
 * 		see the template file.
 * - actions(object): The set of actions that a user can take. If omitted,
 * 		a simple Yes/No dialog is displayed. If it's set to an empty list,
 * 		no buttons will be displayed. Each list element should conform to:
 *
 * 		```
 * 			{
 * 				'caption': 'Button Caption',
 * 				'icon': 'material_design_icon'
 * 			}
 * 		```
 *
 * 		Either icon or caption may be omitted to not display the relevant
 * 		element.
 * - wait(promise | undefined): If a promise is supplied, wait on the
 * 		promise before accepting the "enter" key. This prevents dialogs triggered
 * 		by holding down enter from immediately triggering their default action.
 * 		The promise can either be resolved or rejected, either way, the first enter
 * 		keypress after the promise is resolved or rejected will trigger the action.
 * - aria(string): Aria label to use, defaults to "Dialog".
 * - show(): Show the dialog, returning the standard $mdDialog promise.
 *
 * Example:
 *
 * ```
 * 		angular.module('myApp')
 * 			.controller('myController', function(HotkeyDialog) {
 *    			HotkeyDialog()
 *    				.prompt('Are you sure you want to do this?')
 *    				.show()
 *    				.then(function(result) {
 *    					if(result.caption === 'Yes') {
 *    						alert('You were sure.');
 *    					} else {
 *    						alert('You were not sure.');
 *    					}
 *    				});
 * 			});
 * ```
 *
 * Note that the reason we don't reject the promise on a "no" is that you may
 * supply more actions than simply yes or no.
 */
angular.module('farnsworth')
    .service('HotkeyDialog', function($mdDialog, $q, hotkeys) {
        var HotkeyDialog = function() {
            var self = this;

            self.wait();

            self.dialog = {
                controllerAs: 'controller',
                locals: {
                    dialogActions: [{
                        'caption': 'No',
                        'icon': null
                    }, {
                        'caption': 'Yes',
                        'icon': null
                    }],
                    ariaLabel: "Dialog",

                    // Apparently, you can't bind promises in this
                    // to the locals of a controller, they come through
                    // as undefined, likely due to the way angular.extend
                    // prevents circular references. Functions however, pass
                    // through fine so we'll this function's closure scope to
                    // reference our wait promise.
                    waitForReady: function() {
                        return self.waitPromise;
                    }
                },
                bindToController: true,
                templateUrl: 'views/dialogs/hotkey-dialog.html',
                parent: angular.element(document.body),
                controller: function($mdDialog, $scope, hotkeys) {
                    var self = this;

                    self.action = 0;

                    self.waitForReady().finally(function() {
                        hotkeys.bindTo($scope).add({
                            combo: 'enter',
                            description: 'Activate the selected option.',
                            callback: function() {
                                $mdDialog.hide(self.dialogActions[self.action]);
                            }
                        });
                    });

                    // Add left, right, and enter keybindings so we can do this
                    // with a keyboard/controller.
                    hotkeys.bindTo($scope).add({
                        combo: 'right',
                        description: 'Select the option right of the current option',
                        callback: function() {
                            if(self.action < self.dialogActions.length-1) {
                                self.action++;
                            }
                        }
                    });

                    hotkeys.bindTo($scope).add({
                        combo: 'left',
                        description: 'Select the option left of the curren options.',
                        callback: function() {
                            if(self.action > 0) {
                                self.action--;
                            }
                        }
                    });
                }
            }
        };

        HotkeyDialog.prototype.prompt = function(prompt) {
            this.dialog.locals.text = prompt;
            return this;
        };

        HotkeyDialog.prototype.template = function(template) {
            this.dialog.templateUrl = template;
            return this;
        };

        HotkeyDialog.prototype.actions = function(actions) {
            this.dialog.locals.dialogActions = actions;
            return this;
        };

        HotkeyDialog.prototype.wait = function(promise) {
            if(_.isObjectLike(promise)) {
                this.waitPromise = promise;
            } else {
                this.waitPromise = $q.defer();
                this.waitPromise.resolve();
                this.waitPromise = this.waitPromise.promise;
            }

            return this;
        };

        HotkeyDialog.prototype.aria = function(ariaLabel) {
            this.dialog.locals.ariaLabel = ariaLabel;
            return this;
        };

        HotkeyDialog.prototype.show = function() {
            return $mdDialog.show(this.dialog);
        };

        return function() {
            return new HotkeyDialog();
        }
    });
