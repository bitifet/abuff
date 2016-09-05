aBuffer
=======

> Asynchronous Buffering Tool.
>
> (Original idea comes from this [gist](https://gist.github.com/bitifet/f6914cb51bd1f22cfd85)) 

With aBuffer you can easily create asynchronous buffers which will *never*
overflow.

The key thing is that pop/shift operations returns promises instead actual
values so they can delay its fullfillment until there is some value in the
buffer (or error happened).

To distinguish them from usual pop/shift operations they are called ppop() and
pshift(), respectively. But there are also actual synchronous-like pop() and
shift() operations provided which works thanks to
[deasync](https://www.npmjs.com/package/deasync) library.

At the end, aBuffer instances are also iterables so they can be accessed with
any valid iteration statement. A *buff.eof()* method is also provided which, if
called with true as its first parameter, it will make aBuffer iterator
interface to end after already injected data is exhausted. If pop/shift
operations are used instead, then they throw an error if the internal buffer is
exhausted after *EOF* was triggered.


Usage
-----

### Install

    npm install --save abuffer


### Syntax

    var b = new abuff([options]);


#### Valid options:

All of below options are optional, but mandatory if any of them are specified:

  * **maxLength:** Non mandatory maximum buffer length.

  * **stop:** Callback that will be called when buffer lenght exceeds
  *maxLength*.

  * **reume:** Callback that will be called as soon as buffer length becomes
  smaller than *maxLength* again.


### Simple unlimited stack / buffer

    var abuff = require("abuffer");
    var b = new abuff();


### Stack / buffer with memory usage limit

    var abuff = require("abuffer");
    var b = new abuffer({
        maxLength: 50,
        stop: function(){
            // Do something that pauses push / unshift operations.
        },
        resume: function(){
            // Do something that resumes push / unshift operations.
        },
    });

> **NOTE:** Using maxLength with stop and resume callbacks doesn't actually
> disallow push / unshift operations. They only provide an interace to tell
> provider process to stop and resume pushing / unshifting more data in order
> to preserve reasonable memory usage.



Interface
---------

Below are available methods of any *abuffer* instance:


### Synchronous Input Operations

#### buff.push(data)

    buff.push(someData); // Append someData to the buffer (if EOF didn't triggered).


#### buff.unshift(data)

    buff.unshift(someData); // Prepend someData to the buffer (if EOF didn't triggered).


### Asynchronous Output Operations (returns promises)

#### buff.ppop()

    buff.ppop().then(function(someData){
        // Do something with someData (picked from the end of buffer)
    });


#### buff.pshift()

    buff.pshift().then(function(someData){
        // Do something with someData (picked from the begining of buffer)
    });


### Synchronous-like (but BLOCKING) Output Operations:

**NOTE:** This are blocking operation so, if buffer is currently empty, next
push or shift operation must occur on asynchronous event or it will never
happen!!!


#### pop()

    var foo = buff.pop(); // Pick last (even future) value at the end of the buffer.


### shift()

    var foo = buff.shift(); // Pick last (even future) value at the begin of the buffer.


### Iterator interface

Abuffer instances are also iterables because they expose an iterator interface.
That means you can iterate them with any javascript iteration statement.

The only thing you need to take in account is that, if you want the iteration
ends at any time, you will need to tell the buffer when will not come new input
data thought push() or unshift() operations.

To do that you need to trigger the *EOF* event thought *buff.eof(true)*.

See [Example 2](#example2) below.


#### buff.eof()

Check or set the buffer *EOF* status.

    buff.eof(true); // Sets and returns current eof status.


**NOTE:** Buffer *EOF* status can't be resetted after being set anymore.

    buff.eof(); // Returns current eof status.


#### Array-Like methods:

Following array-like methods are implemented. They work like its Array
equivalents but returns an iterator instead of an array. This make possible to
consume its output without waiting for primary iteration to end and, most
important, without loading all data on an in-memory array.

  * buff.map(cbk [, thisArg])

  * buff.filter(cbk [,thisArg])


Example 1: Simple asynchronous stack
------------------------------------

Stack / buffer that never overflows:

    var abuff = require("abuffer");
    var s = new abuff();
    s.push("hello");
    s.ppop().then(function(data){console.log(data)});
    s.ppop().then(function(data){console.log(data)});
    s.push("world");



<a name="example2"></a>Example 2: Scanning data thought (synchronous-like) iterator:
------------------------------------------------------------------------------------


    var abuff = require("abuffer");
    var b = new abuff();

    b.unshift("Hello");
    b.unshift("World");

    setTimeout(function(){
        b.unshift("Bar");
        console.log("  *** EOF is:", b.eof(), "***"); // False.
        b.eof(true); // Now no more push/unshift operations are allowed.
                     // ...and as soon buffer becomes empty, iterator will end.
        console.log("  *** EOF is:", b.eof(), "***"); // True (even there is still data in buffer).
        ///b.unshift("Baz"); // Push or unshift after eof will throw an error.
    }, 2000);
    b.unshift("Foo");

    for (var x of b) {
        console.log(x);
    };

    // NOTE: Signalling eof here instead would block!!



<a name="contributing"></a>Contributing
---------------------------------------

If you are interested in contributing with this project, you can do it in many ways:

  * Creating and/or mantainig documentation.

  * Implementing new features or improving code implementation.

  * Reporting bugs and/or fixing it.
  
  * Sending me any other feedback.

  * Whatever you like...
    
Please, contact-me, open issues or send pull-requests thought [this project GIT repository](https://github.com/bitifet/abuffer)

