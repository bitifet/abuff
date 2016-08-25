// index.js
// ========
// Asynchronous Buffer 
//
// @author: Joan Miquel Torres <jmtorres@112ib.com>
// @company: GEIBSAU
// @license: GPL
//
"use strict";

module.exports = (function(){

    function _buff(opts){//{{{
        this.stack = [];
        this.queue = [];
        this.stopped = false;
        if (opts === undefined) opts = {};
        if (opts.maxLength) {
            this.maxLength = parseInt(opts.maxLength);
            this.stopCbk = opts.stop;
            this.resumeCbk = opts.resume;
            if (this.maxLength < 1) throw "Wrong value for maxLength.";
            if (typeof this.stopCbk + typeof this.resumeCbk != "functionfunction") {
                throw "stop and resume callbacks are mandatory when maxLength is specified";
            };
        };
    };//}}}

    // Basic stack operations:
    _buff.prototype.push = function stack_push(data){//{{{
        var me = this;
        if (me.queue.length) {
            me.queue.shift()(data);
        } else {
            me.stack.push(data);
            if (! me.stopped && me.maxLength && (me.stack.length >= me.maxLength)) {
                ///console.log ("@@@@@ STOPPING @@@@@ ", me.stack.length);
                me.stopCbk();
                me.stopped = true;
            }
        }
    };//}}}
    _buff.prototype.ppop = function stack_pop(){//{{{
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
            return new Promise(function(resolve, reject){
                me.queue.push(function(data){
                    resolve(data);
                });
            });
        };
    };//}}}
    _buff.prototype.unshift = function stack_unshift(data){//{{{
        var me = this;
        if (me.queue.length) {
            me.queue.pop()(data);
        } else {
            me.stack.unshift(data);
            if (! me.stopped && me.maxLength && (me.stack.length >= me.maxLength)) {
                ///console.log ("@@@@@ STOPPING @@@@@ ", me.stack.length);
                me.stopCbk();
                me.stopped = true;
            }
        }
    };//}}}
    _buff.prototype.pshift = function stack_shift(){//{{{
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
                me.queue.unshift(function(data){
                    resolve(data);
                });
            });
        };
    };//}}}

    return _buff;
})();


