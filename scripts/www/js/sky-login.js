"use strict";
$(function(){
    var t = {
        init: function(){
            t.bindInit();
        },
        bindInit: function(){
            $(".btn-enter").click(function(){
                $(".page-1").addClass("status2");
                setTimeout(function(){
                    $(".page-1").addClass("status3");
                    $(".page-1").addClass("status4");
                }, 500);
                setTimeout(function(){
                    $(".page-1").removeClass("status3");
                }, 2500);
                setTimeout(function(){
                    location.href = "main.html";
                }, 3000);
            });
        }
    };
    t.init();
});
