// aBuffer - index.js
// ==================
// Asynchronous Buffer 
//
// @author: Joan Miquel Torres <jmtorres@112ib.com>
// @company: GEIBSAU
// @license: GPL
//
"use strict";

var Deasync = require('deasync');

module.exports = (function(){

    function _buff(opts){//{{{
        var me = this;
        me.stack = [];
        me.queue = [];
        me.stopped = false;

        me.eof = (function(){
            var eofSignalled = false;
            return function eofGetSet(set) {
                if (set) eofSignalled = true;
                if (eofSignalled) for(let i=0; i<me.queue.length; i++) me.queue[i].reject("EOF");
                return eofSignalled;
            };
        })();

        if (opts === undefined) opts = {};
        if (opts.maxLength) {
            me.maxLength = parseInt(opts.maxLength);
            me.stopCbk = opts.stop;
            me.resumeCbk = opts.resume;
            if (me.maxLength < 1) throw "Wrong value for maxLength.";
            if (typeof me.stopCbk + typeof me.resumeCbk != "functionfunction") {
                throw "stop and resume callbacks are mandatory when maxLength is specified.";
            };
        };
    };//}}}

    // Basic stack operations:
    // ======================:

    // Synchronous input:
    _buff.prototype.push = function stack_push(data){//{{{
        var me = this;
        if (me.eof()) throw "Trying to push data after EOF signal.";
        if (me.queue.length) {
            me.queue.shift().resolve(data);
        } else {
            me.stack.push(data);
            if (! me.stopped && me.maxLength && (me.stack.length >= me.maxLength)) {
                ///console.log ("@@@@@ STOPPING @@@@@ ", me.stack.length);
                me.stopCbk();
                me.stopped = true;
            }
        }
    };//}}}
    _buff.prototype.unshift = function stack_unshift(data){//{{{
        var me = this;
        if (me.eof()) throw "Trying to unshift data after EOF signal.";
        if (me.queue.length) {
            me.queue.pop().resolve(data);
        } else {
            me.stack.unshift(data);
            if (! me.stopped && me.maxLength && (me.stack.length >= me.maxLength)) {
                ///console.log ("@@@@@ STOPPING @@@@@ ", me.stack.length);
                me.stopCbk();
                me.stopped = true;
            }
        }
    };//}}}

    // Asynchronous output (returns promises):
    _buff.prototype.ppop = function stack_ppop(){//{{{
        var me = this;
        if (me.stack.length) {
            var retv = Promise.resolve(me.stack.pop());
            if (me.stopped && me.stack.length < me.maxLength) {
                me.resumeCbk();
                me.stopped = false;
                ///console.log ("@@@@@ RESUMING @@@@@ ", me.stack.length);
            };
            return retv;
        } else {
            if (me.eof()) return Promise.reject("EOF");
            return new Promise(function(resolve, reject){
                me.queue.push({
                    resolve: function(data){
                        resolve(data);
                    },
                    reject: reject,
                });
            });
        };
    };//}}}
    _buff.prototype.pshift = function stack_pshift(){//{{{
        var me = this;
        if (me.stack.length) {
            var retv = Promise.resolve(me.stack.shift());
            if (me.stopped && me.stack.length < me.maxLength) {
                me.resumeCbk();
                me.stopped = false;
                ///console.log ("@@@@@ RESUMING @@@@@ ", me.stack.length);
            };
            return retv;
        } else {
            return new Promise(function(resolve, reject){
                me.queue.unshift({
                    resolve: function(data){
                        resolve(data);
                    },
                    reject: reject,
                });
            });
        };
    };//}}}

    // Synchronous (but BLOCKING) output:
    _buff.prototype.pop = function stack_pop() {//{{{
        var done = false;
        var data;
        var err;
        this.ppop().then(function(rcvData){
            data = rcvData;
            done = true;
        }).catch(function(rcvErr){
            err = rcvErr;
            done = true;
        });
        Deasync.loopWhile(function(){return !done;});
        if (err) throw err;
        return data;
    };//}}}
    _buff.prototype.shift = function stack_shift() {//{{{
        var done = false;
        var data;
        var err;
        this.pshift().then(function(rcvData){
            data = rcvData;
            done = true;
        }).catch(function(rcvErr){
            err = rcvErr;
            done = true;
        });
        Deasync.loopWhile(function(){return !done;});
        if (err) throw err;
        return data;
    };//}}}

    // Synchronous (but BLOCKING) iterator:
    _buff.prototype[Symbol.iterator] = function buffIterator() {//{{{
        return {
            next: () => {
                try {
                    return {
                        value: this.pop(),
                        done: false,
                    };
                } catch (err) {
                    if (err != "EOF") throw err;
                    return {
                        value: undefined,
                        done: true,
                    };
                };

            },
        };
    };//}}}

    // Array-like functions:
    _buff.prototype.map = function arrayLike_map(cbk, thisArg){//{{{
        var it = Object.create(this);
        it[Symbol.iterator] = function buffMapIterator(){
            return {
                next: () => {
                    try {
                        return {
                            value: cbk.call(thisArg, this.pop()),
                            done: false,
                        };
                    } catch (err) {
                        if (err != "EOF") throw err;
                        return {
                            value: undefined,
                            done: true,
                        };
                    };

                },
            };
        };
        return it;
    };//}}}
    _buff.prototype.filter = function arrayLike_filter(cbk, thisArg){//{{{
        var it = Object.create(this);
        it[Symbol.iterator] = function buffFilterIterator(){
            return {
                next: () => {
                    var value;
                    try {
                        while (cbk.call(thisArg, value = this.pop())); // Consume until next match.
                        return {
                            value: value,
                            done: false,
                        };
                    } catch (err) {
                        if (err != "EOF") throw err;
                        return {
                            value: undefined,
                            done: true,
                        };
                    };

                },
            };
        };
        return it;
    };//}}}

    // Status reporting functions:
    Object.defineProperty(_buff.prototype, "length", {//{{{
        enumerable: false,
        configurable: false,
        get: function get_virtual_length(){
            return this.stack.length - this.queue.length;
        },
    });//}}}

    return _buff;
})();


