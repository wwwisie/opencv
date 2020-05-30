"use strict";

function _instanceof(left, right) { if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) { return !!right[Symbol.hasInstance](left); } else { return left instanceof right; } }

function _classCallCheck(instance, Constructor) { if (!_instanceof(instance, Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * nearby.js
 * http://www.codrops.com
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 * 
 * Copyright 2018, Codrops
 * http://www.codrops.com
 */
{
    /**
    * Distance between two points P1 (x1,y1) and P2 (x2,y2).
    */
    var distancePoints = function distancePoints(x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }; // from http://www.quirksmode.org/js/events_properties.html#position


    var getMousePos = function getMousePos(e) {
        var posx = 0,
            posy = 0;
        if (!e) var e = window.event;

        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        } else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            posy = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        return {
            x: posx,
            y: posy
        };
    };

    var Nearby =
        /*#__PURE__*/
        function () {
            function Nearby(el, options) {
                _classCallCheck(this, Nearby);

                this.DOM = {
                    el: el
                };
                this.options = options;
                this.init();
            }

            _createClass(Nearby, [{
                key: "init",
                value: function init() {
                    var _this = this;

                    this.mousemoveFn = function (ev) {
                        return requestAnimationFrame(function () {
                            var mousepos = getMousePos(ev);
                            var docScrolls = {
                                left: document.body.scrollLeft + document.documentElement.scrollLeft,
                                top: document.body.scrollTop + document.documentElement.scrollTop
                            };

                            var elRect = _this.DOM.el.getBoundingClientRect();

                            var elCoords = {
                                x1: elRect.left + docScrolls.left,
                                x2: elRect.width + elRect.left + docScrolls.left,
                                y1: elRect.top + docScrolls.top,
                                y2: elRect.height + elRect.top + docScrolls.top
                            };
                            var closestPoint = {
                                x: mousepos.x,
                                y: mousepos.y
                            };

                            if (mousepos.x < elCoords.x1) {
                                closestPoint.x = elCoords.x1;
                            } else if (mousepos.x > elCoords.x2) {
                                closestPoint.x = elCoords.x2;
                            }

                            if (mousepos.y < elCoords.y1) {
                                closestPoint.y = elCoords.y1;
                            } else if (mousepos.y > elCoords.y2) {
                                closestPoint.y = elCoords.y2;
                            }

                            if (_this.options.onProgress) {
                                _this.options.onProgress(distancePoints(mousepos.x, mousepos.y, closestPoint.x, closestPoint.y));
                            }
                        });
                    };

                    window.addEventListener('mousemove', this.mousemoveFn);
                }
            }]);

            return Nearby;
        }();

    window.Nearby = Nearby;
}