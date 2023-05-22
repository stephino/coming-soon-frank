/**
 * Copyright 2013 Stephino
 * 
 * @version 1.0
 */
$(document).ready(function(){
    "use strict";
    
    // Global variables - Disqus implementation
    var disqus_public_key, disqus_shortname, disqus_title, disqus_identifier, disqus_url;
    
    // Global functions - PHP ports
    var intval = function (mixed_var, base) {var tmp;var type = typeof(mixed_var);if (type === 'boolean') {return +mixed_var;} else if (type === 'string') {tmp = parseInt(mixed_var, base || 10);return (isNaN(tmp) || !isFinite(tmp)) ? 0 : tmp;} else if (type === 'number' && isFinite(mixed_var)) {return mixed_var | 0;} else {return 0;}};
    var shadeColor = function(color, percent) {var R = parseInt(color.substring(1,3),16); var G = parseInt(color.substring(3,5),16); var B = parseInt(color.substring(5,7),16); R = parseInt(R * (100 + percent) / 100); G = parseInt(G * (100 + percent) / 100); B = parseInt(B * (100 + percent) / 100); R = (R<255)?R:255; G = (G<255)?G:255; B = (B<255)?B:255; var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));return "#"+RR+GG+BB;};
    var hexToRgb = function(hex) {var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);var rgb = {r:0, g: 0, b: 0}; if (result){rgb.r = parseInt(result[1], 16); rgb.g = parseInt(result[2], 16); rgb.b = parseInt(result[3], 16);} return rgb;};
    
    // Define the main class
    var Frank = function() {
        var _this = this;
        var objects = {
            storyline: null,
            storylineNavActions: {left: null,right: null,},
        };
        var options = {};
        
        // Initiate the project
        this.init = function() {
            // Initialize the options
            this.initOptions();
            
            // Load the sections
            this.loadSections();
            
            // Load the effects
            this.loadEffects();
            
            // Run the hash listener
            this.hashListener.run();
        };
        
        // Load the options
        this.initOptions = function() {
            var body = $('body');
            var userOptions = {
                color: body.attr('data-color') ? body.attr('data-color') : '#42c3ff',
                anchorColor: body.attr('data-anchor-color') ? body.attr('data-anchor-color') : '#42c3ff',
                clock: body.attr('data-clock') ? body.attr('data-clock') : 'yes',
                layout: body.attr('data-layout') ? body.attr('data-layout') : 'boxed',
                navigation: body.attr('data-navigation') ? body.attr('data-navigation') : 'yes',
                navigationHelper: body.attr('data-navigation-helper') ? body.attr('data-navigation-helper') : 'yes',
            };
            
            // Validate the clock setting
            if (userOptions.clock != 'yes' && userOptions.clock != 'no') {
                userOptions.clock = 'yes';
            }
            
            // Validate the layout option
            if (userOptions.layout != 'boxed' && userOptions.layout != 'full-width') {
                userOptions.layout = 'boxed';
            }
                        
            // Validate the navigation setting
            if (userOptions.navigation != 'yes' && userOptions.navigation != 'no') {
                userOptions.navigation = 'yes';
            }
                        
            // Validate the navigation helper setting
            if (userOptions.navigationHelper != 'yes' && userOptions.navigationHelper != 'no') {
                userOptions.navigationHelper = 'yes';
            }
            
            userOptions.darker = shadeColor(userOptions.color, -20);
            userOptions.lighter = shadeColor(userOptions.color, 20);
            
            userOptions.anchorDarker = shadeColor(userOptions.anchorColor, -20);
            userOptions.anchorLighter = shadeColor(userOptions.anchorColor, 20);
            $.extend(options, userOptions);
        };
        
        // Load the provided list of effects
        this.loadEffects = function(effects) {
            if (typeof effects === "undefined") {
                $.each(_this.effects, function(effect){
                    _this.effects[effect]();
                });
            } else {
                $.each(effects, function(k){
                    if (typeof _this.effects[effects[k]] === "function") {
                        _this.effects[effects[k]]();
                    }
                });
            }
        };
        
        // Load the provied list of sections
        this.loadSections = function(sections) {
            if (typeof sections === "undefined") {
                $.each($('.row'), function() {
                    var section = $(this).attr('class').replace(/\s*row\s*/g, '');
                    if (typeof _this.sections[section] === "function") {
                        _this.sections[section]();
                    }
                });
            } else {
                $.each(sections, function(k){
                    if ($('.row.' + sections[k]).length && typeof _this.sections[sections[k]] === "function") {
                        _this.sections[sections[k]]();
                    }
                });
            }
        };
        
        // Hash listens: goto directives
        this.hashListener = {
            hash: '',
            triggers: {},
            hashEncode: function(key, itemId, data) {
                var result = 'goto:' + key + '|' + itemId + '|' + JSON.stringify(data);                
                return result;
            },
            hashDecode: function(hash) {
                hash = decodeURIComponent(hash);
                var result = {
                    key: null,
                    itemId: null,
                    data: null,
                };
                var match = hash.match(/^goto:([\s\S]*?)\|([\s\S]*?)\|([\s\S]*)/i);
                
                if (null === match) {
                    return result;
                }
                
                result.key = match[1];
                result.itemId = match[2];
                try {
                    result.data = $.parseJSON(match[3]);
                } catch(e) {/*Nothing to do*/}
                
                return result;
            },
            registerTrigger: function(o) {
                var options = {
                    element: null,
                    key: null,
                    data: null,
                    trigger: function(){},
                };
                options = $.extend(options, o);
                if (options.element && options.key && typeof options.trigger === "function") {
                    if (options.element.length) {
                        if (typeof _this.hashListener.triggers[options.key] === "undefined") {
                            _this.hashListener.triggers[options.key] = {};
                        }
                        var itemId = options.element.attr('rel').substr(1).replace(/\D/g, '');
                        var hash = '#' + _this.hashListener.hashEncode(options.key, itemId, options.data);
                        if (typeof options.init === "function") {
                            options.init(hash, options.element, options.data, options.key);
                        }
                        $(options.element).click(function(){
                            window.location.hash = hash;
                        });
                        _this.hashListener.triggers[options.key][itemId] = {
                            element: options.element,
                            trigger: options.trigger,
                        };
                    }
                }
            },
            registerCleaner: function(e) {
                if (typeof e !== "undefined" && e) {
                    $('body').on('click', e, function(){
                        window.location.hash = '#!';
                    });
                }
            },
            run: function() {
                if (0 !== window.location.hash.length && window.location.hash != '#') {
                    var hash = window.location.hash.substr(1);
                    if (_this.hashListener.hash != hash) {
                        var data = _this.hashListener.hashDecode(hash);
                        try {
                            if (data.itemId && typeof _this.hashListener.triggers[data.key][data.itemId].trigger === "function") {
                                // Call the trigger
                                _this.hashListener.triggers[data.key][data.itemId].trigger.call(_this.hashListener.triggers[data.key][data.itemId].element, data.data, data.key);
                            }
                        } catch (e){/*Nothing to do*/}
                        
                        // Set the new hash
                        _this.hashListener.hash = hash;
                    }
                }
                window.setTimeout(_this.hashListener.run, 200);
            },
        };
        
        // Disqus integration
        this.disqus = {
            init: function(key, shortname) {
                // Set the key
                disqus_public_key = key;
                
                // Set the shortname
                disqus_shortname = shortname;
                
                // Both valid, let's go
                if (disqus_public_key && disqus_shortname) {
                    $.ajax({
                        type: 'GET',
                        url: "https://disqus.com/api/3.0/threads/list.json",
                        data: {api_key: disqus_public_key, forum: disqus_shortname},
                        cache: false,
                        async: false,
                        dataType: 'json',
                        success: function (result) {
                            for (var i in result.response) {
                                if (result.response.hasOwnProperty(i)) {
                                    var id = decodeURIComponent(result.response[i].link);
                                    if (/^(?:[\s\S]*?goto:blog\|(\d+)\|[\s\S]*$)$/.test(id)) {
                                        id = '' + id.replace(/[\s\S]*?goto:blog\|(\d+)\|[\s\S]*$/g, "$1");
                                        _this.disqus.comments[id] = intval(result.response[i].posts);
                                    }
                                }
                            }
                        }
                    });
                }
            },
            comments: {},
            commentCount: function(hash) {
                // Get ID from hash
                var id = hash.replace(/^#goto:blog\|([\s\S]*?)\|[\s\S]*$/ig, "$1");
                if ("undefined" !== typeof _this.disqus.comments[id]) {
                    return intval(_this.disqus.comments[id]);
                }
                return 0;
            },
            thread: null,
            load: function(target, url, title) {
                if (!disqus_shortname) {
                    return;
                }

                // Clean-up any previous comment sections
                if ($('#disqus_thread').length) {
                    $('#disqus_thread').remove();
                }
                
                // Create a new thread
                _this.disqus.thread = $('<div id="disqus_thread"></div>');
                
                // Append the disqus thread
                _this.disqus.thread.appendTo(target);
                
                // Reset function
                var reset = function(){
                    // Set the disqus variables
                    disqus_identifier = url.replace(/[\s\S]*?goto:blog\|(\d+)\|[\s\S]*$/g, "$1");
                    disqus_url = url;
                    disqus_title = title;

                    // If Disqus exists, call its reset method
                    DISQUS.reset({
                        reload: true,
                        config: function(){
                            this.page.identifier = disqus_identifier;
                            this.page.url = disqus_url;
                            this.page.title = disqus_title;
                        }
                    });
                };
                
                if (!window.DISQUS) {
                    // Append the Disqus embed script to HTML
                    (function() {
                        var dsq = document.createElement('script'); 
                        dsq.id = 'disqus_script'; 
                        dsq.type = 'text/javascript'; 
                        dsq.async = false;
                        dsq.onload = reset;
                        dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
                        (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
                    })();
                } else {
                    reset();
                }
            },
        };
        
        /**
         * Sections array
         */
        this.sections = {
            // Home animations and slider
            home: function() {
                // Create the canvas
                var div = $('.home > .canvas');
                var width = div.width();
                var height = div.height();
                var canvas = $('<canvas></canvas>').attr('width', width).attr('height', height);
                div.append(canvas);
                var ctx = canvas[0].getContext('2d');
                ctx.beginPath();
                ctx.moveTo(0,0);  
                ctx.lineTo(width,height);
                ctx.lineTo(0,height);
                ctx.fillStyle='#fff';
                ctx.fill();
                ctx.closePath(); 

                // Slider
                $('.slider .fullwidthbanner').revolution({
                    delay:9000,
                    startwidth:1170,
                    startheight:700,
                    onHoverStop:"on",
                    thumbWidth:100,
                    thumbHeight:50,
                    thumbAmount:3,
                    hideThumbs:200,
                    navigationType:"none",
                    navigationArrows:"solo",
                    navigationStyle:"round",
                    navigationHAlign:"center",
                    navigationVAlign:"right",
                    navigationHOffset:0,
                    navigationVOffset:40,
                    soloArrowLeftHalign:"right",
                    soloArrowLeftValign:"bottom",
                    soloArrowLeftHOffset:200,
                    soloArrowLeftVOffset:0,
                    soloArrowRightHalign:"right",
                    soloArrowRightValign:"bottom",
                    soloArrowRightHOffset:120,
                    soloArrowRightVOffset:0,
                    touchenabled:"on",
                    stopAtSlide:-1,
                    stopAfterLoops:-1,
                    hideCaptionAtLimit:0,
                    hideAllCaptionAtLilmit:0,
                    hideSliderAtLimit:0,
                    fullWidth:"on",
                    shadow:0
                });
            },
                
            // Products animation
            products: function() {
                $('.sort > li').click(function(){
                    var options = {
                        filter: $(this).attr('rel') == '*' ? '[rel]' : '[rel="' + $(this).attr('rel') + '"]',
                    };

                    if (!$(this).hasClass('active')) {
                        $.each($('.sort > li'), function(){
                            $(this).removeClass('active');
                        });
                        $(this).addClass('active');
                    }

                    $('.products .isotope').isotope(options);
                });

                var productsIterator = 1;

                // Create image placeholders from images
                $.each($('.products .isotope > div > img'), function(){
                    var isotopeCategory = $(this).parent().attr('rel');
                    var src = $(this).attr('src');
                    var title = $(this).attr('title') ? $(this).attr('title') : '';
                    var id = 'product-modal-' + productsIterator;
                    var thumb = src.replace(/^([\s\S]*?)(\.[a-z0-9]+)$/ig, "$1-thumb$2");
                    var layout = $('<div class="preview" style="background-image:url(' + thumb + ');">' + 
                        '<div class="cover"></div>' + 
                        '<div rel="#' + id + '" class="full"><i class="sc-t"></i><i class="sc-b"></i><span class="icon-eye-1"></span></div>' + 
                        '</div>' + 
                        (title ? ('<h3>' + title + '</h3>') : '')  + 
                        ($(this).attr('subtitle') ? ('<h4>'+$(this).attr('subtitle')+'</h4>') : ''));

                    var content = '<div id="' + id + '" class="modal fade">' + 
                        '<div class="modal-dialog">' + 
                          '<div class="modal-content">' + 
                            '<div class="modal-header">' + 
                              '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
                              ($(this).attr('title') ? '<h4 class="modal-title">' + $(this).attr('title') + '</h4>' : '') + 
                            '</div>' + 
                            '<div class="modal-body">' + 
                              '<img class="full-size" src="' + src + '"/>'  + 
                              '<div class="text-zone">' + $(this).siblings('.content').html() + '</div>' + 
                            '</div>' + 
                          '</div>' + 
                        '</div>' + 
                      '</div>';

                    // Register the trigger
                    _this.hashListener.registerTrigger({
                        element: layout.find('.full'),
                        key: 'products',
                        data: {
                            title: title,
                            category: isotopeCategory,
                        },
                        trigger: function(data) {
                            // After the hash changes, trigger the modal
                            var modal = $($(this).attr('rel'));
                            modal.modal();
                            modal.on('hidden.bs.modal', function(){
                                window.location.hash = '#!';
                            });
                            // Sort items from this category
                            $('.sort > li[rel="' + data.category + '"]').click();
                        }
                    });

                    $('body').append(content);
                    $(this).replaceWith(layout);

                    productsIterator++;
                });
            },
            
            // Blog section
            blog: function() {
                // Prepare the blog items iterator
                var blogItemsIterator = 1;
                var blog = $('.blog');

                // Initialize the disqus username and public key
                _this.disqus.init(
                    blog.attr('data-disqus-key') ? blog.attr('data-disqus-key') : null,
                    blog.attr('data-disqus-shortname') ? blog.attr('data-disqus-shortname') : null
                );

                // Create image placeholders from images
                $.each($('.swipe > div > img', blog), function(){
                    var src = $(this).attr('src');
                    var title = $(this).attr('title') ? $(this).attr('title') : '';
                    var id = 'blog-modal-' + ($(this).attr('id') ? $(this).attr('id') : blogItemsIterator);
                    var thumb = src.replace(/^([\s\S]*?)(\.[a-z0-9]+)$/ig, "$1-thumb$2");
                    var layout = $('<div class="preview" style="background-image:url(' + thumb + ');">' + 
                        '<div class="cover"></div>' + 
                        '<div rel="#' + id + '" class="full"><i class="sc-t"></i><i class="sc-b"></i><span class="icon-eye-1"></span></div>' + 
                        '</div><div rel="#' + id + '" class="comment-count">0</div>' + 
                        ($(this).attr('title') ? ('<h3>'+$(this).attr('title')+'</h3>') : '')  + 
                        ($(this).attr('subtitle') ? ('<h4>'+$(this).attr('subtitle')+'</h4>') : ''));

                    var content = '<div id="' + id + '" class="modal fade">' + 
                        '<div class="modal-dialog">' + 
                          '<div class="modal-content">' + 
                            '<div class="modal-header">' + 
                              '<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' + 
                              ($(this).attr('title') ? '<h4 class="modal-title">' + $(this).attr('title') + '</h4>' : '') + 
                            '</div>' + 
                            '<div class="modal-body">' + 
                              '<img class="full-size" src="' + src + '"/>'  + 
                              '<div class="text-zone">'  + 
                              $(this).siblings('.content').html()  + 
                              '<div class="comments"></div></div>' + 
                            '</div>' + 
                          '</div>' + 
                        '</div>' + 
                      '</div>';

                    // Register the trigger
                    _this.hashListener.registerTrigger({
                        element: layout.find('.full'),
                        key: 'blog',
                        data: {
                            title: title,
                        },
                        init: function(hash, element) {
                            element.parents('.preview').siblings('.comment-count').html(_this.disqus.commentCount(hash));
                        },
                        trigger: function(data) {
                            // After the hash changes, trigger the modal
                            var modal = $($(this).attr('rel'));
                            modal.modal();
                            modal.on('hidden.bs.modal', function(){
                                window.location.hash = '#!';
                            });
                            var page = 'http://' + window.location.host + '?q=' + window.location.hash.substr(1);
                            _this.disqus.load(modal.find('.comments'), page, data.title);
                        }
                    });

                    $('body').append(content);
                    $(this).replaceWith(layout);

                    blogItemsIterator++;
                });
                $('.comment-count').click(function(){
                    $(this).parent().find('.full').click();
                });
            },
            
            // Clients section
            clients: function() {
                $.each($('.clients .client > img'), function(){
                    var replacement = $('<a class="border" href="' + ($(this).attr('data-href') ? $(this).attr('data-href') : '#!') + '"><div class="bkg" style="background-image: url('+$(this).attr('src')+');"></div></a>');
                    $(this).replaceWith(replacement);
                });
            },
            
            // Pricing table effect
            pricing: function (){
                var tableCells = $('.pricing table td, .pricing table th');
                tableCells.hover(function(){
                    if ($(this).hasClass('active')) {
                        return;
                    }
                    
                    // Get the row index
                    var index = $(this).index() + 1;
                    
                    // Remove the active class from all the TD an TH elements
                    tableCells.removeClass('active');
                    
                    // Add the Active class to this column
                    $('.pricing table td:nth-child(' + index + '), .pricing table th:nth-child(' + index + ')').addClass('active');
                });
            },
        };
        
        /**
         * Effects array
         */
        this.effects = {
            // Switch to full-width or boxed
            layout: function() {
                if (options.layout === 'full-width') {
                    $('body div.container').attr('class', 'container-fluid');
                    $('body').css('overflowX', 'hidden');
                }
            },
                
            // Implement the clock
            clock: function() {
                if ('yes' !== options.clock) {
                    return false;
                }

                var clock = $('.clock');
                if (!clock.length) {
                    return false;
                }

                var updateClock = function() {
                    // Get the date
                    var today = new Date();

                    // Get the time
                    var h = today.getHours();
                    var m = today.getMinutes();
                    var s = today.getSeconds();

                    // Add starting zeros
                    if (h < 10) h = "0" + h;
                    if (m < 10) m = "0" + m;
                    if (s < 10) s = "0" + s;

                    // Update the clock
                    clock.html('<i class="h">' + h + '</i>:<i class="m">' + m + '</i>:<i class="s">' + s + '</i>');

                    // Again after 1 second
                    window.setTimeout(updateClock, 1000);
                };
                updateClock();
            },
                
            // Implement the moving menu
            movingMenu: function() {
                var menu = $('.header-menu');
                var menuHeight = menu.height();
                var headerBandHeight = $('.header-band').height();
                var menuNextDiv = $('.header-menu + div');
                var menuMarginLeft = menu.css('marginLeft');
                var container = $('body > div > div');
                var containerWidth = container.width() + intval(container.css('paddingLeft')) + intval(container.css('paddingRight'));
                var tools = {
                    hide: function() {
                        menu.css({
                           left: 'auto',
                           marginLeft: menuMarginLeft,
                           position: 'relative',
                           top: 'auto',
                           width: 'auto'
                        }).removeClass('active');
                        menuNextDiv.css({
                            marginTop: 0
                        });
                    },
                    show: function() {
                        menu.css({
                           left: '50%',
                           marginLeft: - (containerWidth/2),
                           position: 'fixed',
                           top: 0,
                           width: containerWidth,
                        }).addClass('active');
                        menuNextDiv.css({
                            marginTop: menuHeight
                        });
                    }
                };

                window.setInterval(function(){
                    containerWidth = container.width() + intval(container.css('paddingLeft')) + intval(container.css('paddingRight'));
                    if ($(window).scrollTop() >= $('.header-band').offset().top + headerBandHeight) {
                        tools.show();
                    } else {
                        tools.hide();
                    }
                }, 200);
            },
                
            // Top page contact form toggle action
            contactToggle: function() {
                var contactToggle = $('.contact-toggle');
                var upperForm = $('.upper-form');
                var contactText = contactToggle.html();
                var closeText = contactToggle.attr('close-text') ? contactToggle.attr('close-text') : 'Close form';
                contactToggle.click(function(){
                    if (upperForm.hasClass('active')) {
                        upperForm.removeClass('active');
                        $(this).html(contactText);
                    } else {
                        upperForm.addClass('active');
                        window.setTimeout(function(){
                            upperForm.find('input').first().focus();
                        }, 500);
                        $(this).html(closeText);
                    }
                });
            },
                
            // Use the StoryLine
            storyline: function() {
                var home = {
                    canvas: $('.home .canvas'),
                };

                // Store the storyline object
                objects.storyline = $.storyline({
                    frames: {
                        '.home' : {
                            onActive: function(c){
                                home.canvas.css({
                                    height: 100 * ((100 - Math.abs(c.percent.frameUnCentered)) / 100),
                                });
                            },
                            onGoTo: function() {
                                // Navigation actions
                                objects.storylineNavActions = {
                                    left: function() {
                                        $('.home .tp-leftarrow').click();
                                    },
                                    right: function() {
                                        $('.home .tp-rightarrow').click();
                                    },
                                };
                            }
                        },
                        '.products' : {
                            onEnter: function() {
                                if (!$('.products').hasClass('visible') && !$('.products').data('animating')) {
                                    $('.products').data('animating', true);
                                    window.setTimeout(function(){
                                        $('.products').addClass('visible');
                                        $('.products').data('animating', false);
                                    }, 800);
                                }
                            },
                            onLeave: function(){
                                $('.products').removeClass('visible');
                            },
                            onGoTo: function() {
                                // Navigation actions
                                objects.storylineNavActions = {
                                    left: function() {
                                        // Get the index
                                        var index = $('ul.sort > li.active').index() - 1;
                                        if (index < 0) {
                                            index = $('ul.sort > li').length - 1;
                                        }
                                        $('ul.sort > li:nth-child(' + (index+1) + ')').click();
                                    },
                                    right: function() {
                                        // Get the index
                                        var index = $('ul.sort > li.active').index() + 1;
                                        if (index > $('ul.sort > li').length - 1) {
                                            index = 0;
                                        }
                                        $('ul.sort > li:nth-child(' + (index+1) + ')').click();
                                    },
                                };
                            }
                        },
                        '.blog' : {
                            onEnter: function() {
                                if (!$('.swipe').hasClass('visible') && !$('.swipe').data('animating')) {
                                    $('.swipe').data('animating', true);
                                    window.setTimeout(function(){
                                        $('.swipe').addClass('visible');
                                        $('.swipe').data('animating', false);
                                    }, 800);
                                }
                            },
                            onLeave: function(){
                                $('.swipe').removeClass('visible');
                            },
                            onGoTo: function() {
                                objects.storylineNavActions = {
                                    left: function(){
                                        $('.blog .swipe-navigation > .left').click();
                                    }, 
                                    right: function(){
                                        $('.blog .swipe-navigation > .right').click();
                                    },
                                };
                            }
                        },
                        '.clients' : {
                            onActive: function(c){
                                // Do something
                                var degrees = c.percent.frameUnCentered > 0 ? -90 : 90;
                                $('.client > .border').css({
                                    width: c.percent.frameVisible + '%',
                                    height: (70 * c.percent.frameVisible/100) + 'px',
                                    transform: c.percent.frameVisible == 100 ? 'none' : ('rotate(' + (degrees *(100 - c.percent.frameVisible)/100) + 'deg)'),
                                });
                            },
                            onGoTo: function() {
                                objects.storylineNavActions = {left: null, right: null,};
                            }
                        },
                        '.pricing' : {
                            onActive: function(){
                                // Do something
                            },
                            onGoTo: function() {
                                // Prepare the navigation actions
                                objects.storylineNavActions = {left: null, right: null,};

                                // Get the currently active TD elements
                                var currentlyActiveTd = $('.pricing table td.active');

                                // Prepare the index
                                var index = 1;
                                if (currentlyActiveTd.length) {
                                    // Get the row index
                                    index = currentlyActiveTd.index() + 1;
                                }

                                // Get the total number of columns
                                var total = $('.pricing table thead tr th').length;
                                var tableCells = $('.pricing table td, .pricing table th');

                                // Create the custom actions
                                objects.storylineNavActions = {
                                    left: function(){
                                        // Decrement the index
                                        index--; if (index < 1) {index = total;}

                                        // Remove the active class from all the TD an TH elements
                                        tableCells.removeClass('active');

                                        // Add the Active class to this column
                                        $('.pricing table td:nth-child(' + index + '), .pricing table th:nth-child(' + index + ')').addClass('active');
                                    }, 
                                    right: function() {
                                        // Increment the index
                                        index++; if (index > total) {index = 1;}

                                        // Remove the active class from all the TD an TH elements
                                        tableCells.removeClass('active');

                                        // Add the Active class to this column
                                        $('.pricing table td:nth-child(' + index + '), .pricing table th:nth-child(' + index + ')').addClass('active');
                                    }
                                };
                            }
                        },
                        '.testimonials' : {
                            onActive: function(c){
                                // Do something
                                var degrees = c.percent.frameUnCentered > 0 ? -90 : 90;
                                $('.testimonials .swipe .author').css({
                                    width: (150 * c.percent.frameVisible/100) + 'px',
                                    height: (150 * c.percent.frameVisible/100) + 'px',
                                    transform: c.percent.frameVisible == 100 ? 'none' : ('rotate(' + (degrees *(100 - c.percent.frameVisible)/100) + 'deg)'),
                                });
                            },
                            onGoTo: function() {
                                objects.storylineNavActions = {
                                    left: function(){
                                        $('.testimonials .swipe-navigation > .left').click();
                                    }, 
                                    right: function(){
                                        $('.testimonials .swipe-navigation > .right').click();
                                    }
                                };
                            }
                        }
                    },
                    buildMenu: [],
                    menuTarget: '.menu-holder',
                    menuParent: '.row',
                });

                if ($('[goto]').length) {
                    $.each($('[goto]'), function(){
                        $(this).click(function(){
                            $(this).goToFrame($(this).attr('goto'));
                        });
                    });
                }
            },
            
            // Keyboard navigation
            keyNavigation: function() {
                if ("yes" !== options.navigation) {
                    return;
                }
                
                // Implement the navigation helper
                if ("yes" === options.navigationHelper) {
                    // Create the navigation div
                    var navUp = $('<div class="up"><i class="icon-up-dir"></i></div>');
                    var navDown = $('<div class="down"><i class="icon-down-dir"></i></div>');
                    var navLeft = $('<div class="left' + ("function" !== typeof objects.storylineNavActions.left ? ' hidden' : '') + '"><i class="icon-left-dir"></i></div>');
                    var navRight = $('<div class="right' + ("function" !== typeof objects.storylineNavActions.right ? ' hidden' : '') + '"><i class="icon-right-dir"></i></div>');
                    var navigationDiv = $('<div class="arrow-navigation"></div>').append(navUp).append(navDown).append(navLeft).append(navRight);
                    var state = {
                        lastActive: 0,
                        navigationHidden: false,
                        checkLastActive: function() {
                            if (state.lastActive >= 2500) {
                                if (!state.navigationHidden) {
                                    navigationDiv.addClass('hidden');
                                    state.navigationHidden = true;
                                }
                            } else {
                                state.lastActive += 300;
                                if (state.navigationHidden) {
                                    navigationDiv.removeClass('hidden');
                                    state.navigationHidden = false;
                                }
                                
                                // Left side movement is optional
                                if ("function" === typeof objects.storylineNavActions.left) {
                                    if (navLeft.hasClass('hidden')) {
                                        navLeft.removeClass('hidden');
                                    }
                                } else {
                                    if (!navLeft.hasClass('hidden')) {
                                        navLeft.addClass('hidden');
                                    }
                                }

                                // Right side movements is optional
                                if ("function" === typeof objects.storylineNavActions.right) {
                                    if (navRight.hasClass('hidden')) {
                                        navRight.removeClass('hidden');
                                    }
                                } else {
                                    if (!navRight.hasClass('hidden')) {
                                        navRight.addClass('hidden');
                                    }
                                }
                            }
                            
                            window.setTimeout(state.checkLastActive, 300);
                        },
                    };

                    // Hide the buttons
                    navUp.css({opacity:0});
                    navLeft.css({opacity:0});
                    navDown.css({opacity:0});
                    navRight.css({opacity:0});

                    // Start the button animation
                    navUp.animate({opacity:1},{duration:500});
                    navLeft.delay(600).animate({opacity:1},{duration:500});
                    navDown.delay(1200).animate({opacity:1},{duration:500});
                    navRight.delay(1800).animate({opacity:1},{duration:500});

                    // When the button animation is over, start the checker
                    window.setTimeout(state.checkLastActive, 2300);
                    
                    // Release the keys
                    $(document).keyup(function(){
                        navigationDiv.children().removeClass('active');
                    });
                  
                    // Append the item to the body
                    $('body').append(navigationDiv);
                }
                
                // Compute the number of frames
                var noFrames = 0;
                for (var e in objects.storyline.frameList) {
                    if (objects.storyline.frameList.hasOwnProperty(e)) {
                        noFrames++;
                    }
                }
                
                // Listen for the keydown
                $(document).keydown(function(e){
                    // Hold from using the keyboard while on an input or textarea
                    if ($('input:focus, textarea:focus').length) {
                        return true;
                    }
                    
                    if ("yes" === options.navigationHelper) {
                        state.lastActive = 0;
                        navigationDiv.removeClass('hidden');
                        state.navigationHidden = false;
                    }
                    
                    // Implement event
                    switch (e.keyCode) {
                        // Left
                        case 37:
                            e.preventDefault();
                            if ("function" === typeof objects.storylineNavActions.left) {
                                objects.storylineNavActions.left();
                            } 
                            if ("yes" === options.navigationHelper && !navLeft.hasClass('active')) {
                                navLeft.addClass('active');
                            }
                            break;
                            
                        // Up
                        case 38:
                            if (1 !== objects.storyline.mostVisibleFrame) {
                                $('body').goToFrame(objects.storyline.mostVisibleFrame - 1, null, null, true);
                            }
                            if ("yes" === options.navigationHelper && !navUp.hasClass('active')) {
                                navUp.addClass('active');
                            }
                            break;
                            
                        // Right
                        case 39:
                            e.preventDefault();
                            if ("function" === typeof objects.storylineNavActions.right) {
                                objects.storylineNavActions.right();
                            }
                            if ("yes" === options.navigationHelper && !navRight.hasClass('active')) {
                                navRight.addClass('active');
                            }
                            break;
                            
                        // Down
                        case 40:
                            if (noFrames !== objects.storyline.mostVisibleFrame) {
                                $('body').goToFrame(objects.storyline.mostVisibleFrame + 1, null, null, true);
                            }
                            if ("yes" === options.navigationHelper && !navDown.hasClass('active')) {
                                navDown.addClass('active');
                            }
                            break;
                    }
                });
            },
            
            // The parallax effect
            parallax: function() {
                var documentHeight = $(document).height();
                var windowHeight = $(window).height();
                var parallaxes = $('.parallax');
                $.each(parallaxes, function() {
                    var data = {
                        src: $(this).attr('data-src') ? $(this).attr('data-src') : '',
                        height: $(this).attr('data-height') ? intval($(this).attr('data-height')) : 200,
                        speed: $(this).attr('data-speed') ? intval($(this).attr('data-speed')) : 100,
                        direction: $(this).attr('data-direction') ? intval($(this).attr('data-direction')) : 1,
                        static: $(this).attr('data-static') ? intval($(this).attr('data-static')) : 1,
                    };
                    $.each($(this).children('div'), function(){
                        var top, bottom;
                        $.each($(this).children(), function(){
                            var topOffset = $(this).offset().top;
                            var bottomOffset = $(this).outerHeight(true) + topOffset;

                            if (typeof top == 'undefined') {
                                top = topOffset;
                            } else {
                                if (topOffset < top) {
                                    top = topOffset;
                                }
                            }
                            if (typeof bottom == 'undefined') {
                                bottom = bottomOffset;
                            } else {
                                if (bottomOffset > bottom) {
                                    bottom = bottomOffset;
                                }
                            }
                        });
                        $(this).css({
                            height: Math.abs(bottom - top),
                        });
                    });

                    // Validate the options
                    data.height = data.height < 10 ? 10 : (data.height > 1000 ? 1000 : data.height);
                    data.speed = data.speed < 10 ? 10 : (data.speed > 100 ? 100 : data.speed);

                    // Update the speed attribute
                    $(this).data('speed', data.speed);

                    // Set the height
                    $(this).data('height', data.height);

                    // Set the direction
                    $(this).data('direction', data.direction);
                    
                    // Set the static indicator
                    $(this).data('static', data.static);

                    // Set the background image and element height
                    $(this).css({
                        backgroundImage: 'url(' + data.src + ')',
                        backgroundAttachment: data.static ? 'static' : 'fixed',
                        height: data.height
                    });
                });
                $(window).scroll(function(){
                    if (document.documentHeight <= windowHeight) {
                        return;
                    }
                    var scrollTop = $(window).scrollTop();
                    var percent = scrollTop / (documentHeight - windowHeight) * 100;
                    percent = percent < 0 ? 0 : (percent > 100 ? 100 : percent);

                    $.each(parallaxes, function(){
                        if (!$(this).data('static')) {
                            return;
                        }
                        var start = $(this).offset().top;
                        var height = $(this).data('height');
                        var speed = $(this).data('speed');
                        var direction = $(this).data('direction');
                        var m = 100 / (height + windowHeight);
                        var n = 100 / (height + windowHeight) * (windowHeight - start);
                        var y = 0;
                        if (scrollTop + windowHeight > start && scrollTop <= start + height) {
                            y = m*scrollTop + n;
                            if (!direction) {
                                y = 100 - y;
                            }
                            $(this).css({
                                backgroundPosition: '0px ' + (y/100 * speed) + '%'
                            });
                        }
                    });
                });
            },
            
            tweets: function() {
                // Get the "tweets" blocks
                if ($('.tweets').length) {
                    $.each($('.tweets'), function(){
                        // Tweets div
                        var tweetsDiv = $(this);

                        // Get the animation speed
                        var animationSpeed = tweetsDiv.attr('data-speed') ? intval(tweetsDiv.attr('data-speed')) : 2500;
                        animationSpeed = animationSpeed < 500 ? 500 : (animationSpeed > 10000 ? 10000: animationSpeed);
                        
                        // Get the tweets
                        tweetsDiv.html(tweetsDiv.attr('data-loading') ? tweetsDiv.attr('data-loading') : 'Loading...');
                        $.getJSON('php/tweets.php', function(tweets){
                            if (tweets.length) {
                                // Prepare the tweet elements and navigation elements
                                var tweetElements = $('<div class="elements"></div>'), navigationElements = $('<div class="navigation"></div>');
                                
                                // Parse the tweets
                                for (var i in tweets) {
                                    if (tweets.hasOwnProperty(i)) {
                                        var tw = $('<div class="tw">' + tweets[i].desc + '<div class="time"><a href="http://twitter.com/' + (tweetsDiv.attr('data-username') ? tweetsDiv.attr('data-username') : 'teamstephino') + '" target="_blank" class="icon-s-twitter"></a>' + tweets[i].time + '</div></div>');
                                        var nav = $('<i data-target="' + i + '">*</i>');
                                    console.log(tweets[i].desc);
                                        // Append to tweet elements
                                        tweetElements.append(tw);
                                    
                                        // Append to navigation elements
                                        navigationElements.append(nav);
                                    }
                                }
                                
                                // Navigation actions
                                navigationElements.children().on('click', function(){
                                    // Store this
                                    var navElement = $(this);
                                    
                                    // Make other elements inactive
                                    tweetElements.children().fadeOut(500);
                                    navigationElements.children().removeClass('active');

                                    // Make the current element active
                                    navElement.addClass('active');
                                    
                                    window.setTimeout(function(){
                                        tweetElements.children(':nth-child(' + (intval(navElement.attr('data-target')) + 1) + ')').fadeIn();
                                    }, 510);
                                });
                                
                                // Click on the first button
                                navigationElements.children().first().click();
                                
                                var iterator = {
                                    next: function() {
                                        // Get the index
                                        var index = navigationElements.children('.active').index();
                                        
                                        // Increment
                                        if (++index >= tweets.length) {
                                            index = 0;
                                        }
                                        navigationElements.children(':nth-child(' + (index+1) + ')').click();
                                    },
                                    run: function() {
                                        if (!tweetsDiv.is(":hover")) {
                                            iterator.next();
                                        }
                                        window.setTimeout(iterator.run, animationSpeed);
                                    },
                                };
                                window.setTimeout(iterator.run, animationSpeed);
                                
                                // Prepend the items
                                tweetsDiv.html('').prepend(tweetElements).prepend(navigationElements);
                                return;
                            }
                            tweetsDiv.html(tweetsDiv.attr('data-no-tweets') ? tweetsDiv.attr('data-no-tweets') : 'No tweets found...');
                        });
                    });
                     
                }
            },
            
            // Testimonials widget
            testimonials: function() {
                if ($('.testimonials .swipe .author').length) {
                    $.each($('.testimonials .swipe .author'), function(){
                        $(this).css({
                            background: $(this).attr('data-img') ? 'url(' + $(this).attr('data-img') + ')' : '#eee',
                        });
                        
                        // Enclose the author name
                        $(this).html(
                            '<span>' + $(this).html() + '</span>'
                        );
                    });
                    $('.testimonials .swipe > div').css({
                        display: 'block'
                    });
                }
            },
            
            // Swipe function
            swipe: function() {
                $.each($('.swipe'), function(){
                    // Get the children
                    var frames = $(this).children('div');
                    var thisSwipe = $(this);
                    
                    // No frames to iterate over
                    if (!frames.length) {
                        return;
                    }
                    
                    // Get the iterator
                    var iterator = {
                        current: 0,
                        max: frames.length-1,
                        prev: function(){
                            var ci = iterator.current;
                            var slideWidth = frames.first().outerWidth();
                            var slidesPerSwipe = Math.round(thisSwipe.width() / slideWidth);
                            ci--;
                            if (ci < 0) {
                                ci = iterator.max - slidesPerSwipe + 1;
                            }
                            if (ci !== iterator.current && (iterator.max - iterator.current + 1) >= slidesPerSwipe) {
                                iterator.current = ci;
                                return true;
                            }
                            return false;
                        },
                        next: function(){
                            var ci = iterator.current;
                            var slideWidth = frames.first().outerWidth();
                            var slidesPerSwipe = Math.round(thisSwipe.width() / slideWidth);
                            ci++;
                            if (ci > iterator.max - slidesPerSwipe + 1) {
                                ci = 0;
                            }
                            if (ci !== iterator.current && (iterator.max - iterator.current + 1) >= slidesPerSwipe) {
                                iterator.current = ci;
                                return true;
                            }
                            return false;
                        },
                        animate: function() {
                            var slideWidth = frames.first().outerWidth();
                            for (var i = 0; i <= iterator.max; i++) {
                                var marginLeft = (i - iterator.current) * slideWidth;
                                $(frames[i]).stop().animate({marginLeft: marginLeft, left: 0, top: 0},{duration: 500});
                            }
                        }
                    };
                    
                    // Create the navigation
                    var navigation = $('<div class="swipe-navigation"></div>');
                    var navLeft = $('<div class="left"><i class="icon-left-open-big"></i><div>');
                    var navRight = $('<div class="right"><i class="icon-right-open-big"></i><div>');
                    navLeft.appendTo(navigation);
                    navRight.appendTo(navigation);
                    
                    // Left navigation button click event
                    navLeft.click(function(){
                        if (iterator.prev()) {
                            iterator.animate();
                        }
                    });
                    
                    // Right navigation button click event
                    navRight.click(function(){
                        if (iterator.next()) {
                            iterator.animate();
                        }
                    });
                    
                    // Make each slide draggable
                    $.each(frames, function(){
                        $(this).draggable({
                            drag: function(e,ui) {
                                $.each(frames.not(e.target), function(){
                                    $(this).css({
                                        left: ui.helper.position().left,
                                    });
                                });
                            },
                            stop: function(e,ui) {
                                // Compute the number of slides per swipe
                                var slidesPerSwipe = Math.round(thisSwipe.width() / frames.first().outerWidth());
                            
                                // Compute direction of travel
                                var direction = ui.helper.position().left > 0 ? 'prev' : 'next';
                                
                                // Compute the steps
                                var steps = Math.abs(Math.round(ui.helper.position().left/$(e.target).outerWidth()));
                                
                                // No steps, revert to no actual
                                if (steps > 0) {
                                    for (var i = 1; i <= steps; i++) {
                                        // Do not allow overflowing (less than the first element or more than the last)
                                        if (('prev' !== direction || 0 !== iterator.current) && ('next' !== direction || iterator.current !== iterator.max - slidesPerSwipe + 1)) {
                                            iterator[direction]();
                                        }
                                    }
                                    
                                }
                                iterator.animate();
                            }
                        });
                    });
                    
                    // Append the navigation to the parent
                    $(this).parent().append(navigation);
                    
                    // On resize, recreate the animation
                    $(window).resize(iterator.animate);
                    
                    // Animate for the first time
                    iterator.animate();
                });
            },
            
            // Create the map
            map: function() {
                var mapCanvas = $('#map-canvas'), mapMaker;
                var coords = {
                    lat: mapCanvas.attr('lat') ? mapCanvas.attr('lat') : 52.519772,
                    long: mapCanvas.attr('long') ? mapCanvas.attr('long') : 13.400059,
                };
            
                // No map canvas present
                if (!mapCanvas.length) {
                    return;
                }
                
                // Google Map
                var map;
                
                // Create an array of styles
                var styles = [
                    {   
                        stylers: [
                            {hue: options.color },
                            {saturation: -30 },
                            {lightness: -10 },
                        ]
                    },{
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [
                            {lightness: 100 },
                            {visibility: "simplified" },
                        ]
                    },{
                        featureType: "road",
                        elementType: "labels",
                        stylers: [
                            {visibility: "off"},
                        ]
                    }
                ];
                
                // Create a new StyledMapType object
                var styledMap = new google.maps.StyledMapType(
                    styles,
                    {name: "Styled Map"}
                );

                // Map Coordinates
                var myLatlng = new google.maps.LatLng(coords.lat, coords.long);
                var mapOptions = {
                    zoom: 16,
                    center: myLatlng,
                    scrollwheel: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                
                // Create the actual map
                map = new google.maps.Map(mapCanvas[0], mapOptions);

                // Marker Coordinates
                mapMaker = new google.maps.Marker({
                    position: new google.maps.LatLng(coords.lat, coords.long),
                    map: map
                });

                map.mapTypes.set('map_style', styledMap);
                map.setMapTypeId('map_style');
            },
                
            formValidation: function() {
                // Parse forms
                $('.submit.btn').on('click', function(){
                    $(this).closest('form').submit();
                });
                $.each($('form.validate'), function(){
                    $(this).validate({
                        submitHandler: function(form) {
                            // The captcha was not yet shown
                            if ('none' === $('.validate > .captcha').css('display')) {
                                $('.validate > .captcha').slideDown();
                                $('.validate > .initial-input').slideUp();
                                return;
                            }
                            
                            // Get the data after validation
                            var data = $(form).serializeArray();
                            var action = $(form).attr('action');
                            $.ajax({
                                method: 'post',
                                dataType: 'json',
                                url: action,
                                data: data,
                                async: false,
                                success: function(d) {
                                    // Prepare the message
                                    var message = $('<div></div>');
                                    $.each(d, function(k){
                                        var messageType = 'boolean' === $.type(d[k].status) ? (d[k].status?'success':'danger') : d[k].status;
                                        
                                        // Create the message
                                        var msg = $('<div class="alert alert-dismissable alert-'+messageType+'">'+('success' === messageType ? '': '<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>')+d[k].message+'</div>');
                                        
                                        // Auto-close after 2 seconds
                                        if ('success' !== messageType) {
                                            window.setTimeout(function() { message.slideUp(); }, 2500);
                                        } else {
                                            $('.captcha, .submit', form).slideUp();
                                        }
                                        
                                        // Append to the holder
                                        message.append(msg);
                                    });
                                    
                                    // Replace the form with the message
                                    $(form).prepend(message);                                    
                                },
                                error: function() {
                                    var error = $('<div class="alert alert-dismissable alert-danger"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Could not contact host. Please try again later.</div>');
                                    
                                    // Add to the form
                                    $(form).replaceWith(error);
                                }
                            });
                            if (window.Recaptcha) {
                                window.Recaptcha.reload();
                            }
                        }
                    });
                });
            },
            
            backToTop: function() {
                $('.back-to-top').on('click', function() {
                    if ($('.upper-form').length && $('.contact-toggle').length) {
                        if (!$('.upper-form').height()) {
                            $('.contact-toggle').click();
                        }
                    }
                    $('html, body').animate({scrollTop: 0}, {duration: 1000});
                    window.setTimeout(function(){
                        $('.upper-form').find('input').first().focus();
                    }, 500);
                });
            },
            
            // Set the colors
            // WARNING - This item must be last in array IF you choose to provide
            // no arguments to Frank.loadEffects() in Frank.init();
            setColors: function() {
                // Prepare the Style element
                var style = $('<style type="text/css"></style>');
                
                // Prepare the style string
                var styleString = {
                    selectors: {},
                    get: function() {
                        var result = '';
                        $.each(styleString.selectors, function(selector, kv){
                            var selectorStyle = '';
                            $.each(kv, function(k,v){
                                selectorStyle += (k + ': ' + v + ";");
                            });
                            result += (selector + ' {' + selectorStyle + '}');
                        });
                        return result;
                    },
                    add: function(selector, style) {
                        if (typeof styleString.selectors[selector] === "undefined") {
                            styleString.selectors[selector] = {};
                        }
                        $.each(style, function(k,v){
                            styleString.selectors[selector][k] = v;
                        });
                    }
                };
                
                // Upper form
                styleString.add('.upper-form', {'border-bottom-color': options.color});

                // Buttons
                styleString.add('.btn', {
                    'background-color': options.color,
                    'border-color': options.color,
                    'box-shadow': '0px 3px 0px ' + options.darker, 
                    'text-shadow': '0px -1px 0px ' + options.darker,
                });
                styleString.add('.btn:hover', {
                    'background-color': shadeColor(options.color, 10),
                    'border-color': options.lighter,
                });
                styleString.add('.btn:active', {
                    'background-color': options.color,
                    'border-color': options.color,
                });
                
                // Logo
                styleString.add('a.logo', {
                    'background-color': options.color,
                    'border-color': options.color,
                });
                
                // Favicons
                styleString.add('[class^="icon-s-"], [class*=" icon-s-"]', {
                    'color': options.color
                });
                
                // Slider
                styleString.add('.tp-caption .color', {
                    'color': options.color
                });

                // Menu
                styleString.add('.storyline-menu > li', {
                    'border-color': options.color,
                });
                styleString.add('.header-menu ul li > i', {
                    'border-color': options.color,
                });
                styleString.add('.header-menu ul li', {
                    'box-shadow': 'none',
                    'color': '#555',
                });
                styleString.add('.header-menu ul li.active, .header-menu ul li:hover', {
                    'box-shadow': '0px -3px 0px ' + options.color + ' inset',
                    'color': options.color,
                });
                styleString.add('.storyline-mobile-button', {
                    'background': 'transparent',
                    'color': options.color
                });
                styleString.add('.storyline-mobile-button:hover', {
                    'background': options.color,
                    'color': '#fff'
                });
                
                // Products
                styleString.add('ul.sort > li', {
                    'border-color': '#ccc',
                });
                styleString.add('ul.sort > li:hover, ul.sort > li.active', {
                    'border-color': options.color,
                });

                // Products custom color
                styleString.add('.products .isotope > div > .preview > .cover', {
                    'background-color': options.color,
                });

                // Blog item custom color
                styleString.add('.blog .swipe > div > .preview > .cover', {
                    'background-color': options.color,
                });

                // Comment count color
                styleString.add('.blog .swipe .comment-count', {
                    'color': options.color,
                });
                
                // Pricing table
                styleString.add('.pricing table > thead th.active', {
                    'background-color': options.darker,
                    'box-shadow': '-1px 0 0 #ebeae5 inset, 0px -10px 0px ' + options.darker,
                });
                styleString.add('.pricing table > thead th.active > span', {
                    'background-color': options.color,
                });
                
                // Form 
                var rgbColor = hexToRgb(options.color);
                styleString.add('.form-control:focus', {
                    'border-color': options.color,
                    'box-shadow': '0 0 8px rgba('+rgbColor.r+','+rgbColor.g+','+rgbColor.b+', 0.6)',
                });
                
                // Selection color
                styleString.add('::selection', {
                    'color': '#ffffff',
                    'text-shadow': 'none !important',
                    'background': options.color,
                });
                styleString.add('::-moz-selection', {
                    'color': '#ffffff',
                    'text-shadow': 'none !important',
                    'background': options.color,
                });
            
                // Tweets navigation elements
                styleString.add('.tweets > .navigation > i.active', {
                    'background' : options.color,
                });
                
                // Contact us button
                styleString.add('.back-to-top:hover > i', {
                    'color' : options.color,
                });
                
                // Swipe navigation
                styleString.add('.swipe-navigation > .left:hover, .swipe-navigation > .right:hover', {
                    'color' : options.color,
                    'border-color' : options.color,
                });
                
                // Anchor colors
                styleString.add('a', {
                    'color' : options.anchorColor,
                });
                styleString.add('a:hover', {
                    'color' : options.anchorLighter,
                });
                styleString.add('a:visited', {
                    'color' : options.anchorDarker,
                });
            
                // Append the style to the head
                style.html(styleString.get()).appendTo('head');
            }
        };
    };
    
    // Load the class
    var instance = new Frank();
    instance.init();
});