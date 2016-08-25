aBuffer
-------

Asynchronous Buffering Tool.


> Original implementation:
> https://gist.github.com/bitifet/f6914cb51bd1f22cfd85

Example:
--------

    var s = new stack();
    s.push("hello");
    s.pop().then(function(data){console.log(data)});
    s.pop().then(function(data){console.log(data)});
    s.push("world");

